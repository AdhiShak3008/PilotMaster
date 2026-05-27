from pilotcore.retrieval.retriever import (
    retrieve_chunks,
)

from pilotcore.retrieval.vector_store import (
    search_vectors,
)

from pilotcore.tracing.spans import (
    start_span,
    end_span,
)


def retrieve(
    strategy: str,
    **kwargs,
):

    trace = kwargs.get("trace")

    kwargs.pop("trace", None)

    if strategy == "lexical":

        span = start_span(
            trace_id=trace.trace_id,
            name="retrieval",
        )

        trace.spans.append(span)

        result = retrieve_chunks(**kwargs)

        end_span(span)

        return result

    elif strategy == "vector":

        span = start_span(
            trace_id=trace.trace_id,
            name="vector_retrieval",
        )

        trace.spans.append(span)

        from pilotcore.retrieval.embeddings import get_embedding

        query = kwargs.pop("query")
        user_id = kwargs.pop("user_id", None)
        source = kwargs.pop("source", None)
        trace_id = kwargs.pop("trace_id")

        query_embedding = get_embedding(query)

        result = search_vectors(
            user_id=user_id,
            query_embedding=query_embedding,
            source=source,
            trace_id=trace_id,
        )

        end_span(span)

        return result

    elif strategy == "hybrid":

        span = start_span(
            trace_id=trace.trace_id,
            name="hybrid_retrieval",
        )

        trace.spans.append(span)

        from pilotcore.retrieval.embeddings import get_embedding
        from pilotcore.schemas.retrieval import RetrievalResult

        query = kwargs.pop("query")
        user_id = kwargs.pop("user_id", None)
        source = kwargs.pop("source", None)
        trace_id = kwargs.pop("trace_id")
        top_k = kwargs.pop("top_k", 7)

        query_embedding = get_embedding(query)

        vector_result = search_vectors(
            user_id=user_id,
            query_embedding=query_embedding,
            source=source,
            trace_id=trace_id,
            top_k=top_k,
        )

        lexical_result = retrieve_chunks(
            user_id=user_id,
            query=query,
            source=source,
            trace_id=trace_id,
            top_k=top_k,
        )

        combined = vector_result.retrieved_chunks + lexical_result.retrieved_chunks

        seen = set()
        deduped = []

        for chunk in combined:

            chunk_key = (
                chunk.chunk.document_id,
                chunk.chunk.chunk_id,
            )

            if chunk_key in seen:
                continue

            seen.add(chunk_key)
            deduped.append(chunk)

        deduped = deduped[:top_k]

        print("\n===== HYBRID DEBUG =====")

        for idx, chunk in enumerate(deduped, start=1):

            print(f"\nRANK {idx}")
            print(chunk.chunk.text[:400])
            print("SCORE:", chunk.score)

        print("========================\n")

        result = RetrievalResult(
            trace_id=trace_id,
            query=query,
            retrieved_chunks=deduped,
            latency_ms=(vector_result.latency_ms + lexical_result.latency_ms),
            retriever_version="hybrid_v1",
        )

        end_span(span)

        return result

    raise ValueError(f"Unknown retrieval strategy: {strategy}")
