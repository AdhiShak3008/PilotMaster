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


def run_pipeline(
    query: str,
    user_id=None,
    source=None,
    model_name=None,
):

    trace_id = generate_trace_id()
    start_time = time.perf_counter()

    trace = create_trace(
        trace_id=trace_id,
        user_query=query,
    )

    retrieval_result = retrieve(
        strategy="hybrid",
        query=query,
        user_id=user_id,
        source=source,
        trace_id=trace.trace_id,
        trace=trace,
    )

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

    _emit_trace(
        trace,
        latency_ms,
        evaluation,
        user_id,
        source,
        model_name=model_name,
    )

    return trace


def _emit_trace(
    trace,
    latency_ms: float,
    evaluation: dict,
    user_id=None,
    source=None,
    model_name=None,
):
    chunks = trace.retrieval_result.retrieved_chunks if trace.retrieval_result else []

    payload = {
        "trace_id": trace.trace_id,
        "query": trace.user_query,
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
    }

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
