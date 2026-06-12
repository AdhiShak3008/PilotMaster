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
from pilotcore.retrieval.reranker import rerank_chunks


def deduplicate_chunks(chunks):

    seen = set()
    unique = []

    for chunk in chunks:

        text = chunk.chunk.text.strip()

        # crude but effective near-duplicate filter
        key = text[:250].lower()

        if key in seen:
            continue

        seen.add(key)
        unique.append(chunk)

    return unique


def run_dedup(chunks):
    before = len(chunks)

    chunks = deduplicate_chunks(chunks)

    after = len(chunks)

    print(f"[DEDUP] {before} -> {after}")

    return chunks


def apply_post_processing(
    chunks,
    query,
    top_k,
    experiment_config,
):
    if experiment_config is None:
        return chunks

    if experiment_config.deduplication:
        chunks = run_dedup(chunks)

    if experiment_config.reranker:

        chunks = rerank_chunks(
            query=query,
            candidate_chunks=chunks,
            top_k=top_k,
            model_key=experiment_config.reranker_model,
        )

    return chunks


def retrieve(
    strategy: str,
    **kwargs,
):
    experiment_config = kwargs.pop(
        "experiment_config",
        None,
    )

    trace = kwargs.get("trace")

    kwargs.pop("trace", None)

    if strategy == "lexical":

        span = start_span(
            trace_id=trace.trace_id,
            name="retrieval",
        )

        trace.spans.append(span)
        query = kwargs.get("query")
        top_k = kwargs.get("top_k", 7)

        result = retrieve_chunks(**kwargs)

        result.retrieved_chunks = apply_post_processing(
            chunks=result.retrieved_chunks,
            query=query,
            top_k=top_k,
            experiment_config=experiment_config,
        )

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
        top_k = kwargs.pop("top_k", 7)
        query_embedding = get_embedding(query)

        result = search_vectors(
            user_id=user_id,
            query_embedding=query_embedding,
            source=source,
            trace_id=trace_id,
            top_k=top_k,
        )
        result.retrieved_chunks = apply_post_processing(
            chunks=result.retrieved_chunks,
            query=query,
            top_k=top_k,
            experiment_config=experiment_config,
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

        # Reciprocal Rank Fusion (RRF)
        # -----------------------------------------
        # Instead of naïvely concatenating vector and BM25 results,
        # we fuse rankings from both retrievers.
        #
        # Why RRF?
        # - robust across retrievers with different score scales
        # - boosts chunks retrieved by BOTH systems
        # - improves hybrid retrieval quality significantly
        #
        # Formula:
        # score += 1 / (RRF_K + rank)

        from pilotcore.schemas.retrieval import RetrievedChunk

        RRF_K = 60

        rrf_scores = {}
        chunk_map = {}

        # Vector retrieval ranks
        for rank, chunk in enumerate(vector_result.retrieved_chunks, start=1):

            chunk_key = (
                chunk.chunk.document_id,
                chunk.chunk.chunk_id,
            )

            if chunk_key not in rrf_scores:

                rrf_scores[chunk_key] = 0.0

                chunk_map[chunk_key] = chunk

            else:

                existing = chunk_map[chunk_key]

                # Preserve dense lineage if newly available
                if chunk.dense_score is not None:
                    existing.dense_score = chunk.dense_score

                if chunk.dense_rank is not None:
                    existing.dense_rank = chunk.dense_rank

                # Preserve BM25 lineage if newly available
                if chunk.bm25_score is not None:
                    existing.bm25_score = chunk.bm25_score

                if chunk.bm25_rank is not None:
                    existing.bm25_rank = chunk.bm25_rank

                # Merge provenance safely
                existing.retrieval_sources = list(
                    set(existing.retrieval_sources + chunk.retrieval_sources)
                )

            rrf_scores[chunk_key] += 1.0 / (RRF_K + rank)

        # BM25 retrieval ranks
        for rank, chunk in enumerate(lexical_result.retrieved_chunks, start=1):

            chunk_key = (
                chunk.chunk.document_id,
                chunk.chunk.chunk_id,
            )

            if chunk_key not in rrf_scores:

                rrf_scores[chunk_key] = 0.0

                chunk_map[chunk_key] = chunk

            else:

                existing = chunk_map[chunk_key]

                # Preserve dense lineage if newly available
                if chunk.dense_score is not None:
                    existing.dense_score = chunk.dense_score

                if chunk.dense_rank is not None:
                    existing.dense_rank = chunk.dense_rank

                # Preserve BM25 lineage if newly available
                if chunk.bm25_score is not None:
                    existing.bm25_score = chunk.bm25_score

                if chunk.bm25_rank is not None:
                    existing.bm25_rank = chunk.bm25_rank

                # Merge provenance safely
                existing.retrieval_sources = list(
                    set(existing.retrieval_sources + chunk.retrieval_sources)
                )

            rrf_scores[chunk_key] += 1.0 / (RRF_K + rank)

        # Build fused chunk list
        fused_chunks = []

        for chunk_key, fused_score in rrf_scores.items():

            original_chunk = chunk_map[chunk_key]

            fused_chunks.append(
                RetrievedChunk(
                    chunk=original_chunk.chunk,
                    # temporary compatibility
                    score=float(fused_score),
                    # RRF lineage
                    rrf_score=float(fused_score),
                    # preserve upstream lineage
                    dense_score=original_chunk.dense_score,
                    dense_rank=original_chunk.dense_rank,
                    bm25_score=original_chunk.bm25_score,
                    bm25_rank=original_chunk.bm25_rank,
                    # provenance
                    retrieval_sources=original_chunk.retrieval_sources,
                )
            )

        # Global ranking by fused RRF score
        # Global ranking by fused RRF score
        fused_chunks.sort(
            key=lambda chunk: chunk.score,
            reverse=True,
        )
        fused_chunks = apply_post_processing(
            chunks=fused_chunks,
            query=query,
            top_k=top_k,
            experiment_config=experiment_config,
        )
        print("\n===== HYBRID DEBUG =====")

        for idx, chunk in enumerate(fused_chunks, start=1):

            print(f"\nRANK {idx}")
            print(chunk.chunk.text[:400])
            print("SCORE:", chunk.score)

        print("========================\n")
        result = RetrievalResult(
            trace_id=trace_id,
            query=query,
            retrieved_chunks=fused_chunks[:top_k],
            latency_ms=(vector_result.latency_ms + lexical_result.latency_ms),
            retriever_version="hybrid_rrf_v1",
        )
        end_span(span)

        return result

    raise ValueError(f"Unknown retrieval strategy: {strategy}")
