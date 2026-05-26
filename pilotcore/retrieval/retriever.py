import time

from pilotcore.retrieval.vector_store import load_user_documents
from pilotcore.schemas.chunk import Chunk
from pilotcore.schemas.retrieval import RetrievedChunk, RetrievalResult
from pilotcore.tracing.telemetry import emit_event


def retrieve_chunks(user_id, query, trace_id, source=None, top_k=3, **_):
    start_time = time.perf_counter()
    documents = load_user_documents(user_id)
    query_terms = {
        term.lower()
        for term in query.split()
        if term.strip()
    }

    matches = []
    for doc in documents:
        if source and source != doc.get("source"):
            continue

        text = doc.get("text", "")
        text_terms = set(text.lower().split())
        score = len(query_terms & text_terms)
        if score <= 0:
            continue

        matches.append((score, doc))

    matches.sort(key=lambda item: item[0], reverse=True)
    retrieved_chunks = [
        RetrievedChunk(
            chunk=Chunk(
                chunk_id=str(doc.get("chunk_id", index)),
                document_id=str(doc.get("document_id", "unknown_document")),
                user_id=str(user_id),
                text=doc.get("text", ""),
                source=doc.get("source"),
                page_number=doc.get("page"),
            ),
            score=float(score),
        )
        for index, (score, doc) in enumerate(matches[:top_k])
    ]

    latency_ms = (time.perf_counter() - start_time) * 1000
    emit_event(
        "lexical_retrieval.completed",
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
        retriever_version="lexical_v1",
    )
