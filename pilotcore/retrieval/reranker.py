from sentence_transformers import CrossEncoder
import math

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
        pairs.append((query, chunk.chunk.text))

    scores = _reranker.predict(pairs)

    reranked = []

    # assign raw reranker logits, compute sigmoid-normalized confidence
    for rank, (chunk, score) in enumerate(zip(candidate_chunks, scores), start=1):

        # legacy compatibility
        chunk.score = float(score)

        # preserve reranker lineage (raw logit)
        chunk.reranker_score = float(score)

        # normalized confidence in [0,1]
        try:
            chunk.reranker_confidence = 1.0 / (1.0 + math.exp(-float(score)))
        except OverflowError:
            chunk.reranker_confidence = 0.0 if score < 0 else 1.0

        # temporary ranking metadata
        chunk.reranker_rank = rank

        reranked.append(chunk)

    # final sort by reranker logits (higher = better)
    reranked.sort(key=lambda chunk: chunk.score, reverse=True)

    # compute reranker margin (top - second) on raw logits for certainty
    raw_scores = [getattr(c, "reranker_score", None) for c in reranked if getattr(c, "reranker_score", None) is not None]
            scores = _reranker.predict(pairs)
        sorted_raw = sorted(raw_scores, reverse=True)
        margin = float(sorted_raw[0] - sorted_raw[1])
    else:
        margin = 0.0

    for final_rank, chunk in enumerate(reranked, start=1):

        chunk.final_rank = final_rank
        # attach margin so downstream can inspect retrieval certainty
        chunk.reranker_margin = margin

    return reranked[:top_k]
