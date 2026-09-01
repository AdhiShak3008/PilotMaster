import time
import requests
from pilotcore.config import (
    TRACEPILOT_URL,
    GROQ_MODEL,
    EVALUATOR_VERSION,
    PROMPT_VERSION,
    RETRIEVER_VERSION,
)
from pilotcore.tracing.trace_context import generate_trace_id
from pilotcore.tracing.trace_manager import create_trace
from pilotcore.retrieval.runtime import retrieve
from pilotcore.generation.generator import generate_response
from pilotcore.generation.prompt_builder import build_prompt
from pilotcore.evaluation.evaluator import run_evaluation
from pilotcore.retrieval.query_rewriter import rewrite_query
from pilotcore.runtime.experiment_config import ExperimentConfig
from pilotcore.enhancements.orchestrator import EnhancementOrchestrator
from pilotcore.memory.vector_memory import VectorMemoryManager
from pilotcore.retrieval.multi_query import (
    generate_queries,
)



def run_pipeline(
    query: str,
    user_id=None,
    source=None,
    document_ids=None,
    model_name=None,
    experiment_config=None,
    chat_history=None,
):
    print("PIPELINE document_ids =", document_ids)
    if experiment_config is None:
        experiment_config = ExperimentConfig()
    print("\n===== EXPERIMENT CONFIG =====")
    print(experiment_config.model_dump())
    print("=============================\n")
    trace_id = generate_trace_id()
    start_time = time.perf_counter()

    trace = create_trace(
        trace_id=trace_id,
        user_query=query,
    )
    trace.chat_history = chat_history

    # ─────────────────────────────────────────────────────────────
    # Search Long-Term Episodic Vector Memory (if user_id provided)
    # ─────────────────────────────────────────────────────────────
    memories = []
    if user_id:
        try:
            memories = VectorMemoryManager.search_memory(
                user_id=user_id,
                query=query,
                top_k=2,
                similarity_threshold=0.58,
            )
        except Exception:
            memories = []

    trace.memory_matches = memories
    if memories:
        mem_lines = [f"- {m['text']}" for m in memories]
        trace.memory_context = "\n".join(mem_lines)
    else:
        trace.memory_context = None

    # ─────────────────────────────────────────────────────────────
    # Run Centralized Query Enhancement Orchestrator
    # ─────────────────────────────────────────────────────────────
    active_enh_list = getattr(experiment_config, "enhancements", [])
    if not active_enh_list and getattr(experiment_config, "query_rewrite", False):
        active_enh_list = ["query_rewrite"]

    transform_state = EnhancementOrchestrator.execute(
        query=query,
        enhancements=active_enh_list,
        chat_history=chat_history,
    )
    trace.transformation_state = transform_state.model_dump()
    trace.rewritten_query = transform_state.rewritten_query or transform_state.current_query

    # Determine query variants for retrieval
    query_variants_to_search = []
    if transform_state.sub_queries:
        query_variants_to_search.extend(transform_state.sub_queries)
    elif transform_state.expanded_queries:
        query_variants_to_search.extend(transform_state.expanded_queries)
    else:
        query_variants_to_search.append(transform_state.current_query)

    if transform_state.step_back_query and transform_state.step_back_query not in query_variants_to_search:
        query_variants_to_search.append(transform_state.step_back_query)

    # Clean duplicates while preserving order
    unique_search_queries = []
    for q_item in query_variants_to_search:
        if q_item and q_item.strip() and q_item not in unique_search_queries:
            unique_search_queries.append(q_item)

    if not unique_search_queries:
        unique_search_queries = [query]

    trace.generated_queries = unique_search_queries

    print("\n===== ENHANCEMENT ORCHESTRATION =====")
    print("ORIGINAL QUERY   :", query)
    print("ACTIVE ENHANCED  :", transform_state.active_enhancements)
    print("TRANSFORMED QUERY:", transform_state.current_query)
    print("SEARCH VARIANTS  :", unique_search_queries)
    if transform_state.metadata_filters:
        print("METADATA FILTERS :", transform_state.metadata_filters)
    if transform_state.route:
        print("QUERY ROUTE      :", transform_state.route)
    print("=====================================\n")

    all_chunks = []
    retrieval_result = None

    for query_variant in unique_search_queries:
        # If HyDE is active and we are on primary query, we can use hypothetical doc for vector search
        search_text = query_variant
        if transform_state.hypothetical_document and query_variant == transform_state.current_query:
            search_text = transform_state.hypothetical_document

        result = retrieve(
            strategy=experiment_config.retrieval_method,
            query=search_text,
            user_id=user_id,
            source=source,
            document_ids=document_ids,
            trace_id=trace.trace_id,
            trace=trace,
            experiment_config=experiment_config,
        )

        if result:
            if retrieval_result is None:
                retrieval_result = result
            all_chunks.extend(result.retrieved_chunks)

    seen = set()
    deduped_chunks = []

    for chunk in all_chunks:
        chunk_key = (
            str(getattr(chunk.chunk, "document_id", "")),
            str(getattr(chunk.chunk, "chunk_id", "")),
            str(getattr(chunk.chunk, "text", ""))[:200],
        )

        if chunk_key not in seen:
            seen.add(chunk_key)
            deduped_chunks.append(chunk)

    if retrieval_result:
        retrieval_result.retrieved_chunks = deduped_chunks

    trace.retrieval_result = retrieval_result


    # ===== Retrieval debug =====
    print("\n===== RETRIEVAL DEBUG =====")
    print("QUERY:", query)

    if trace.retrieval_result and getattr(
        trace.retrieval_result, "retrieved_chunks", None
    ):
        for i, c in enumerate(trace.retrieval_result.retrieved_chunks):
            chunk_text = getattr(getattr(c, "chunk", None), "text", "")
            score = getattr(c, "score", None)
            print(f"\nRANK {i + 1}")
            print(chunk_text[:500])
            print("SCORE:", score)
            print("dense_score:", c.dense_score, "| dense_rank:", c.dense_rank)
            print("bm25_score:", c.bm25_score, "| bm25_rank:", c.bm25_rank)
            print("rrf_score:", c.rrf_score)
            print(
                "reranker_score:", c.reranker_score, "| reranker_rank:", c.reranker_rank
            )
            print("final_rank:", c.final_rank)
            print("retrieval_sources:", c.retrieval_sources)
            print("METADATA:", c.chunk.metadata)
    else:
        print("(no retrieved chunks)")

    print("===========================\n")

    response = generate_response(
        trace,
        model_name=model_name,
    )
    trace.final_response = response

    latency_ms = (time.perf_counter() - start_time) * 1000

    chunks = trace.retrieval_result.retrieved_chunks if trace.retrieval_result else []
    scores = [c.score for c in chunks]

    evaluation = run_evaluation(
        query=query,
        response=response,
        chunks=chunks,
        scores=scores,
    )
    if experiment_config.emit_trace:
        _emit_trace(
            trace=trace,
            latency_ms=latency_ms,
            evaluation=evaluation,
            user_id=user_id,
            source=source,
            model_name=model_name,
            experiment_config=experiment_config,
        )
    trace.evaluation = evaluation
    trace.latency_ms = latency_ms
    return trace


def _emit_trace(
    trace,
    latency_ms: float,
    evaluation: dict,
    user_id=None,
    source=None,
    model_name=None,
    experiment_config=None,
):
    print(
        "TRACE MODE:",
        experiment_config.mode if experiment_config else "NO_CONFIG",
    )
    chunks = trace.retrieval_result.retrieved_chunks if trace.retrieval_result else []

    active_enhancements = list(getattr(experiment_config, "enhancements", [])) if experiment_config else []
    if not active_enhancements and experiment_config:
        if experiment_config.query_rewrite:
            active_enhancements.append("query_rewrite")
        if experiment_config.hyde:
            active_enhancements.append("hyde")
        if experiment_config.multi_query:
            active_enhancements.append("multi_query")
        if experiment_config.query_expansion:
            active_enhancements.append("keyword_expansion")

    payload = {
        "trace_id": trace.trace_id,
        "query": trace.user_query,
        "rewritten_query": getattr(trace, "rewritten_query", None),
        "generated_queries": getattr(
            trace,
            "generated_queries",
            [],
        ),
        "transformation_state": getattr(trace, "transformation_state", None),
        "response": trace.final_response or "",
        "prompt": build_prompt(trace),
        "memory_turns_count": len(getattr(trace, "chat_history", []) or []),
        "memory_matches_count": len(getattr(trace, "memory_matches", []) or []),
        "memory_context": getattr(trace, "memory_context", None),
        "latency": round(latency_ms, 2),
        "model_name": model_name or GROQ_MODEL,

        "retrieved_chunks": [
            {
                "chunk_id": str(c.chunk.chunk_id),
                "text": c.chunk.text,
                "score": c.score,
                "rank": i,
                "dense_score": c.dense_score,
                "dense_rank": c.dense_rank,
                "bm25_score": c.bm25_score,
                "bm25_rank": c.bm25_rank,
                "rrf_score": c.rrf_score,
                "reranker_score": c.reranker_score,
                "reranker_confidence": getattr(c, "reranker_confidence", None),
                "reranker_rank": c.reranker_rank,
                "final_rank": c.final_rank,
                "reranker_margin": getattr(c, "reranker_margin", None),
                "retrieval_sources": c.retrieval_sources,
                "source_file": (
                    getattr(c.chunk, "source", None)
                    or getattr(c.chunk, "metadata", {}).get("source_file")
                    or getattr(c.chunk, "metadata", {}).get("source")
                    or source
                ),
                "page": (
                    getattr(c.chunk, "page_number", None)
                    or getattr(c.chunk, "metadata", {}).get("page")
                    or getattr(c.chunk, "metadata", {}).get("page_number")
                    or getattr(c.chunk, "metadata", {}).get("slide")
                    or getattr(c.chunk, "metadata", {}).get("row")
                ),
                "section_title": getattr(c.chunk, "metadata", {}).get("section_title"),
                "document_id": str(getattr(c.chunk, "document_id", "")),
                "file_type": getattr(c.chunk, "metadata", {}).get("file_type"),
            }
            for i, c in enumerate(chunks)
        ],
        "retrieval_consensus": evaluation.get("retrieval_consensus"),
        "retrieval_score_avg": evaluation.get("retrieval_score_avg", 0.0),
        "top_retrieval_score": evaluation.get("top_retrieval_score", 0.0),
        "chunk_count": len(chunks),
        "response_length": len(trace.final_response or ""),
        "retrieval_quality": evaluation.get("retrieval_relevance", "none"),
        "grounded": evaluation.get("grounded", False),
        "evaluation": evaluation,
        "evaluator_version": EVALUATOR_VERSION,
        "prompt_version": PROMPT_VERSION,
        "retriever_version": RETRIEVER_VERSION,
        "user_id": str(user_id) if user_id else None,
        "source": source,
        "spans": [
            {
                "span_id": s.span_id,
                "name": s.name,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat() if s.end_time else None,
            }
            for s in trace.spans
        ],
        "mode": (experiment_config.mode if experiment_config else "production"),
        "pipeline_config": {
            "chunker": getattr(experiment_config, "chunker", None),
            "embedding_model": getattr(experiment_config, "embedding_model", None),
            "retrieval_strategy": (
                experiment_config.retrieval_method if experiment_config else "hybrid"
            ),
            "reranker_model": (
                getattr(
                    experiment_config,
                    "reranker_model",
                    None,
                )
                if experiment_config
                else None
            ),
            "active_enhancements": active_enhancements,
            "query_rewrite": (
                experiment_config.query_rewrite if experiment_config else False
            ),
            "generated_queries": getattr(
                trace,
                "generated_queries",
                [],
            ),
            "hyde": (experiment_config.hyde if experiment_config else False),
            "multi_query": (
                experiment_config.multi_query if experiment_config else False
            ),
            "query_expansion": (
                experiment_config.query_expansion if experiment_config else False
            ),
            "parent_child": (
                experiment_config.parent_child if experiment_config else False
            ),
            "contextual_retrieval": (
                experiment_config.contextual_retrieval if experiment_config else False
            ),
            "graph_rag": (experiment_config.graph_rag if experiment_config else False),
            "context_compression": (
                experiment_config.context_compression if experiment_config else False
            ),
        },

    }
    print("\n===== PIPELINE CONFIG =====")
    print(payload["pipeline_config"])
    print("===========================\n")
    # 1. Direct database save for guaranteed in-process persistence
    saved_directly = False
    try:
        from TracePilot.backend.app.tracing.trace_manager import save_trace as direct_save_trace
        from TracePilot.backend.app.models.trace import Trace as TpTrace, RetrievedChunk as TpChunk
        from datetime import datetime

        tp_trace = TpTrace(
            trace_id=payload["trace_id"],
            query=payload["query"],
            rewritten_query=payload.get("rewritten_query"),
            generated_queries=payload.get("generated_queries", []),
            transformation_state=payload.get("transformation_state"),
            retrieved_chunks=[TpChunk(**c) for c in payload.get("retrieved_chunks", [])],
            prompt=payload.get("prompt", ""),
            response=payload.get("response", ""),
            latency=payload.get("latency", 0),
            timestamp=datetime.utcnow(),
            model_name=payload.get("model_name"),
            retrieval_score_avg=payload.get("retrieval_score_avg"),
            response_length=payload.get("response_length", 0),
            chunk_count=payload.get("chunk_count", 0),
            parent_trace_id=payload.get("parent_trace_id"),
            retrieval_quality=payload.get("retrieval_quality", "medium"),
            grounded=payload.get("grounded", True),
            top_retrieval_score=payload.get("top_retrieval_score"),
            spans=payload.get("spans", []),
            failure_types=payload.get("failure_types", []),
            prompt_mode=payload.get("prompt_mode", "strict"),
            evaluation=payload.get("evaluation", {}),
            user_id=payload.get("user_id"),
            source=payload.get("source"),
            evaluator_version=payload.get("evaluator_version", "1.0"),
            prompt_version=payload.get("prompt_version", "1.0"),
            retriever_version=payload.get("retriever_version", "hybrid_rrf_v1"),
            mode=payload.get("mode", "production"),
            pipeline_config=payload.get("pipeline_config", {}),
        )
        direct_save_trace(tp_trace)
        saved_directly = True
        print(f"[TracePilot] Direct DB save succeeded for trace {payload['trace_id']}")
    except Exception as d_err:
        print(f"[TracePilot] Direct DB save fallback failed: {repr(d_err)}")

    # 2. HTTP ingest fallback if direct DB save didn't execute
    if not saved_directly:
        try:
            resp = requests.post(
                f"{TRACEPILOT_URL}/tracepilot/ingest",
                json=payload,
                timeout=5,
            )
            print(f"[TracePilot] HTTP ingest status={resp.status_code}")
        except Exception as e:
            print(f"[TracePilot] HTTP ingest failed: {repr(e)}")
