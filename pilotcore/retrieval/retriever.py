import time

from pilotcore.retrieval.vector_store import (
    load_user_documents,
    load_user_bm25,
)
from pilotcore.schemas.chunk import Chunk
from pilotcore.schemas.retrieval import RetrievedChunk, RetrievalResult
from pilotcore.tracing.telemetry import emit_event
from pilotcore.retrieval.bm25 import tokenize


def retrieve_chunks(user_id, query, trace_id, source=None, top_k=3, **_):
    start_time = time.perf_counter()

    documents = load_user_documents(user_id)
    bm25 = load_user_bm25(user_id)

    if bm25 is None:
        return RetrievalResult(
            trace_id=trace_id,
            query=query,
            retrieved_chunks=[],
            latency_ms=0,
            retriever_version="bm25_v1",
        )

    tokenized_query = tokenize(query)

    scores = bm25.get_scores(tokenized_query)

    matches = []

    for idx, score in enumerate(scores):

        if idx >= len(documents):
            continue

        doc = documents[idx]

        if source and source != doc.get("source"):
            continue

        if score == 0:
            continue

        matches.append((score, doc))

    matches.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    retrieved_chunks = [
        RetrievedChunk(
            chunk=Chunk(
                chunk_id=str(doc.get("chunk_id", index)),
                document_id=str(
                    doc.get(
                        "document_id",
                        "unknown_document",
                    )
                ),
                user_id=str(user_id),
                text=doc.get("text", ""),
                source=doc.get("source"),
                page_number=doc.get("page"),
            ),
            # legacy compatibility
            score=float(score),
            # bm25 lineage
            bm25_score=float(score),
            bm25_rank=index + 1,
            # provenance
            retrieval_sources=["bm25"],
        )
        for index, (score, doc) in enumerate(matches[:top_k])
    ]

    latency_ms = (time.perf_counter() - start_time) * 1000

    emit_event(
        "bm25_retrieval.completed",
        {
            "trace_id": trace_id,
            "latency_ms": latency_ms,
            "retrieved_chunks": len(retrieved_chunks),
            "user_id": user_id,
        },
    )

    return RetrievalResult(
        trace_id=trace_id,
        query=query,
        retrieved_chunks=retrieved_chunks,
        latency_ms=latency_ms,
        retriever_version="bm25_v1",
    )
