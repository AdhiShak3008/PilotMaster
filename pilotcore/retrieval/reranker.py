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


RERANKER_MODELS = {
    "minilm": "cross-encoder/ms-marco-MiniLM-L-6-v2",
    "tinybert": "cross-encoder/ms-marco-TinyBERT-L-2-v2",
    "bge-large": "BAAI/bge-reranker-large",
    "bge-m3": "BAAI/bge-reranker-v2-m3",
    #  "jina-v3": "jinaai/jina-reranker-v3",
    #  "nv-rerankqa": "nvidia/nv-rerankqa",
    #  "zerank-2": "ZeroEntropy/zerank-2",
}

_loaded_rerankers = {}


def softmax(scores, temperature=1.0):
    exp_scores = [math.exp(s / temperature) for s in scores]
    total = sum(exp_scores)
    return [s / total for s in exp_scores]


def rerank_chunks(
    query,
    candidate_chunks,
    top_k=7,
    model_key="minilm",
):

    if not candidate_chunks:
        return []

    pairs = []

    for chunk in candidate_chunks:
        pairs.append((query, chunk.chunk.text))

    reranker = get_reranker(model_key)

    scores = reranker.predict(pairs)

    confidences = softmax(scores)

    reranked = []

    for rank, (chunk, score, confidence) in enumerate(
        zip(candidate_chunks, scores, confidences), start=1
    ):

        chunk.score = float(score)
        chunk.reranker_score = float(score)
        chunk.reranker_confidence = float(confidence)
        chunk.reranker_rank = rank

        reranked.append(chunk)

    # final sort by reranker logits (higher = better)
    reranked.sort(key=lambda chunk: chunk.score, reverse=True)

    # compute reranker margin (top - second) on raw logits for certainty
    raw_scores = [
        getattr(c, "reranker_score", None)
        for c in reranked
        if getattr(c, "reranker_score", None) is not None
    ]
    if len(raw_scores) >= 2:
        sorted_raw = sorted(raw_scores, reverse=True)
        margin = float(sorted_raw[0] - sorted_raw[1])
    else:
        margin = 0.0

    for final_rank, chunk in enumerate(reranked, start=1):

        chunk.final_rank = final_rank
        # attach margin so downstream can inspect retrieval certainty
        chunk.reranker_margin = margin

    return reranked[:top_k]


def get_reranker(model_key: str):

    model_name = RERANKER_MODELS.get(
        model_key,
        RERANKER_MODELS["minilm"],
    )

    if model_key not in _loaded_rerankers:

        print(f"Loading reranker: {model_name}")

        _loaded_rerankers[model_key] = CrossEncoder(model_name)

    return _loaded_rerankers[model_key]
