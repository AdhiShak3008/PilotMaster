import os
import pickle

from rank_bm25 import BM25Okapi


def tokenize(text):
    return text.lower().split()


def build_bm25(chunks):
    tokenized_chunks = [tokenize(chunk["text"]) for chunk in chunks]

    return BM25Okapi(tokenized_chunks)


def save_bm25(bm25, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "wb") as f:
        pickle.dump(bm25, f)


def load_bm25(path):
    if not os.path.exists(path):
        return None

    with open(path, "rb") as f:
        return pickle.load(f)


def search_bm25(bm25, query, chunks, top_k=10):

    if bm25 is None:
        return []

    tokenized_query = tokenize(query)

    scores = bm25.get_scores(tokenized_query)

    ranked = sorted(
        zip(chunks, scores),
        key=lambda x: x[1],
        reverse=True,
    )

    results = []

    for rank, (chunk, score) in enumerate(
        ranked[:top_k],
        start=1,
    ):

        results.append(
            {
                "chunk": chunk,
                # legacy compatibility
                "score": float(score),
                # bm25 lineage
                "bm25_score": float(score),
                "bm25_rank": rank,
                # provenance
                "retrieval_sources": ["bm25"],
            }
        )

    return results
