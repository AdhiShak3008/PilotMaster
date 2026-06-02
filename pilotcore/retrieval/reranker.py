from sentence_transformers import CrossEncoder

# Lightweight cross-encoder reranker
# -----------------------------------
# This model evaluates:
#   (query, chunk_text)
#
# jointly and predicts how relevant
# the chunk is for answering the query.
#
# Unlike embeddings:
# - query + chunk are processed together
# - much stronger ranking quality
# - slower than vector similarity
#
# This reranker operates AFTER:
# - FAISS retrieval
# - BM25 retrieval
# - RRF fusion
#
# Final score semantics:
# higher = better relevance


_reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def rerank_chunks(
    query,
    candidate_chunks,
    top_k=7,
):

    if not candidate_chunks:
        return []

    pairs = []

    for chunk in candidate_chunks:

        pairs.append(
            (
                query,
                chunk.chunk.text,
            )
        )

    scores = _reranker.predict(pairs)

    reranked = []

    for rank, (chunk, score) in enumerate(
        zip(candidate_chunks, scores),
        start=1,
    ):

        # legacy compatibility
        chunk.score = float(score)

        # preserve reranker lineage
        chunk.reranker_score = float(score)

        # temporary ranking metadata
        chunk.reranker_rank = rank

        reranked.append(chunk)

    reranked.sort(
        key=lambda chunk: chunk.score,
        reverse=True,
    )

    for final_rank, chunk in enumerate(reranked, start=1):

        chunk.final_rank = final_rank

    return reranked[:top_k]
