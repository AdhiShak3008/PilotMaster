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

    raise ValueError(
        f"Unknown retrieval strategy: {strategy}")
