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
from pilotcore.retrieval.multi_query import (
    generate_queries,
)


def run_pipeline(
    query: str,
    user_id=None,
    source=None,
    model_name=None,
    experiment_config=None,
):
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
    retrieval_query = query

    if experiment_config.query_rewrite:
        retrieval_query = rewrite_query(query)

    trace.rewritten_query = retrieval_query
    generated_queries = [retrieval_query]

    if experiment_config.multi_query:

        generated_queries = generate_queries(retrieval_query)

    trace.generated_queries = generated_queries

    print("\n===== QUERY REWRITE =====")
    print("ORIGINAL :", query)
    print("REWRITTEN:", retrieval_query)
    print("=========================\n")
    print("STRATEGY:", experiment_config.retrieval_method)

    print("\n===== MULTI QUERY =====")

    for i, q in enumerate(generated_queries):
        print(f"{i + 1}. {q}")

    print("=======================\n")

    all_chunks = []
    retrieval_result = None

    for query_variant in generated_queries:

        result = retrieve(
            strategy=experiment_config.retrieval_method,
            query=query_variant,
            user_id=user_id,
            source=source,
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

        chunk_id = chunk.chunk.chunk_id

        if chunk_id not in seen:

            seen.add(chunk_id)

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

    active_enhancements = []

    if experiment_config:

        if experiment_config.query_rewrite:
            active_enhancements.append("Query Rewrite")

        if experiment_config.hyde:
            active_enhancements.append("HyDE")

        if experiment_config.multi_query:
            active_enhancements.append("Multi Query")

        if experiment_config.query_expansion:
            active_enhancements.append("Query Expansion")

        if experiment_config.parent_child:
            active_enhancements.append("Parent Child")

        if experiment_config.contextual_retrieval:
            active_enhancements.append("Contextual Retrieval")

        if experiment_config.graph_rag:
            active_enhancements.append("Graph RAG")

        if experiment_config.context_compression:
            active_enhancements.append("Context Compression")

    payload = {
        "trace_id": trace.trace_id,
        "query": trace.user_query,
        "rewritten_query": getattr(trace, "rewritten_query", None),
        "generated_queries": getattr(
            trace,
            "generated_queries",
            [],
        ),
        "response": trace.final_response or "",
        "prompt": build_prompt(trace),
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
                "source_file": getattr(c.chunk, "metadata", {}).get("source_file"),
                "page": getattr(c.chunk, "metadata", {}).get("page"),
                "section_title": getattr(c.chunk, "metadata", {}).get("section_title"),
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
    try:
        resp = requests.post(
            f"{TRACEPILOT_URL}/tracepilot/ingest",
            json=payload,
            timeout=5,
        )

        print(f"[TracePilot] ingest status={resp.status_code}")
        print(f"[TracePilot] response={resp.text}")

    except Exception as e:
        print(f"[TracePilot] ingest failed: {repr(e)}")
