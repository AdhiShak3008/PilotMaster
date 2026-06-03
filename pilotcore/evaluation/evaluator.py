import re
import math

STOPWORDS = {
    "the",
    "is",
    "a",
    "an",
    "to",
    "of",
    "and",
    "in",
    "on",
    "for",
    "what",
    "how",
    "who",
    "why",
    "when",
    "where",
    "which",
    "was",
    "were",
    "are",
    "be",
    "been",
    "being",
    "i",
    "it",
    "this",
    "that",
    "do",
    "does",
    "did",
    "about",
    "tell",
    "me",
    "explain",
    "describe",
    "give",
    "get",
    "has",
    "have",
    "had",
    "will",
    "would",
    "could",
    "should",
    "can",
    "may",
    "might",
    "its",
    "their",
    "there",
}

ABSTENTION_PHRASES = [
    "i don't have enough information",
    "i don't have any specific information",
    "the context does not provide",
    "cannot answer from the context",
    "not enough information",
    "not mentioned in",
    "no information",
    "outside the context",
    "i cannot find",
    "not available in",
    "i'm unable to find",
    "the document does not",
]

BROAD_QUERY_VERBS = {
    "explain",
    "describe",
    "tell",
    "elaborate",
    "discuss",
    "summarize",
    "overview",
}

FACTUAL_QUERY_WORDS = {
    "what",
    "which",
    "who",
    "when",
    "where",
    "how many",
    "how much",
}


def _chunk_texts(chunks: list) -> list[str]:

    return [c["text"] if isinstance(c, dict) else c.chunk.text for c in chunks]


def _meaningful_words(text: str) -> set:

    words = re.findall(
        r"\b[a-zA-Z0-9]+\b",
        text.lower(),
    )

    return {w for w in words if w not in STOPWORDS and len(w) > 2}


def _classify_query(query: str) -> str:
    """
    Classify query intent to inform answerability evaluation.
    """

    q = query.lower().strip()
    words = set(q.split())

    if any(v in words for v in BROAD_QUERY_VERBS):
        return "broad_query"

    if q.startswith("who is") or (q.startswith("what is") and len(words) <= 5):
        return "direct_fact"

    return "direct_fact"


def evaluate_query_relevance(
    query: str,
    chunks: list,
) -> str:

    if not chunks:
        return "none"

    query_terms = _meaningful_words(query)

    if not query_terms:
        return "low"

    all_chunk_words = set()

    for text in _chunk_texts(chunks):

        all_chunk_words.update(_meaningful_words(text))

    overlap = query_terms.intersection(all_chunk_words)

    coverage = len(overlap) / max(
        len(query_terms),
        1,
    )

    if coverage >= 0.6:
        return "high"

    elif coverage >= 0.3:
        return "medium"

    return "low"


def evaluate_retrieval_relevance(
    query: str,
    chunks: list,
    scores: list[float],
) -> dict:

    if not chunks:
        return {
            "retrieval_relevance": "none",
            "retrieval_score_avg": 0.0,
            "top_retrieval_score": 0.0,
        }

    relevance = evaluate_query_relevance(query, chunks)

    # Normalize raw scores (logits or BM25) into [0,1] confidences using sigmoid
    normalized_scores = []
    for s in scores or []:
        try:
            conf = 1.0 / (1.0 + math.exp(-float(s)))
        except OverflowError:
            conf = 0.0 if s < 0 else 1.0
        normalized_scores.append(conf)

    avg_score = (
        round(sum(normalized_scores) / len(normalized_scores), 4)
        if normalized_scores
        else 0.0
    )

    top_score = round(max(normalized_scores), 4) if normalized_scores else 0.0

    # Reranker-specific metrics (preserve raw logits for debugging)
    reranker_raw_scores = []
    for c in chunks:
        if isinstance(c, dict):
            val = c.get("reranker_score")
        else:
            val = getattr(c, "reranker_score", None)
        if val is not None:
            reranker_raw_scores.append(val)
    if reranker_raw_scores:
        # normalized reranker confidence average
        reranker_confidences = []
        for r in reranker_raw_scores:
            try:
                reranker_confidences.append(1.0 / (1.0 + math.exp(-float(r))))
            except OverflowError:
                reranker_confidences.append(0.0 if r < 0 else 1.0)
        reranker_confidence_avg = round(
            sum(reranker_confidences) / len(reranker_confidences), 4
        )
        # margin between top two reranker logits
        if len(reranker_raw_scores) >= 2:
            sorted_raw = sorted(reranker_raw_scores, reverse=True)
            reranker_margin = round(float(sorted_raw[0] - sorted_raw[1]), 4)
        else:
            reranker_margin = 0.0
    else:
        reranker_confidence_avg = 0.0
        reranker_margin = 0.0

    # Retrieval consensus across chunks: consensus if chunk retrieved by both dense and bm25
    consensus_counts = {
        "consensus": 0,
        "semantic-only": 0,
        "lexical-only": 0,
        "none": 0,
    }
    for c in chunks:
        if isinstance(c, dict):
            sources = c.get("retrieval_sources", []) or []
        else:
            sources = getattr(c, "retrieval_sources", []) or []
        has_dense = "dense" in sources
        has_bm25 = "bm25" in sources
        if has_dense and has_bm25:
            consensus_counts["consensus"] += 1
        elif has_dense:
            consensus_counts["semantic-only"] += 1
        elif has_bm25:
            consensus_counts["lexical-only"] += 1
        else:
            consensus_counts["none"] += 1

    # pick the most common consensus type
    retrieval_consensus = max(consensus_counts.items(), key=lambda x: x[1])[0]

    return {
        "retrieval_relevance": relevance,
        "retrieval_score_avg": avg_score,
        "top_retrieval_score": top_score,
        "reranker_confidence_avg": reranker_confidence_avg,
        "reranker_margin": reranker_margin,
        "retrieval_consensus": retrieval_consensus,
    }


def evaluate_grounding(
    response: str,
    chunks: list,
) -> dict:
    """
    Did the model answer USING retrieved evidence?
    """

    abstained = any(phrase in response.lower() for phrase in ABSTENTION_PHRASES)

    if abstained:
        return {
            "grounded": True,
            "grounding_confidence": "high",
            "hallucination_risk": "low",
            "faithfulness_score": 1.0,
            "abstained": True,
        }

    response_words = _meaningful_words(response)

    all_chunk_words = set()

    for text in _chunk_texts(chunks):

        all_chunk_words.update(_meaningful_words(text))

    if not response_words:
        return {
            "grounded": False,
            "grounding_confidence": "none",
            "hallucination_risk": "high",
            "faithfulness_score": 0.0,
            "abstained": False,
        }

    overlap = response_words.intersection(all_chunk_words)

    faithfulness = round(
        len(overlap) / len(response_words),
        2,
    )

    length_penalty = min(
        1.0,
        len(response_words) / 150,
    )

    adjusted_hallucination = round(
        (1.0 - faithfulness) * (0.7 + 0.3 * length_penalty),
        2,
    )

    grounded = len(overlap) >= 3

    grounding_confidence = (
        "high" if faithfulness > 0.5 else "medium" if faithfulness > 0.25 else "low"
    )

    hallucination_risk = (
        "low"
        if adjusted_hallucination < 0.35
        else "medium" if adjusted_hallucination < 0.6 else "high"
    )

    return {
        "grounded": grounded,
        "grounding_confidence": grounding_confidence,
        "hallucination_risk": hallucination_risk,
        "faithfulness_score": faithfulness,
        "abstained": False,
    }


def evaluate_answerability(
    query: str,
    chunks: list,
    scores: list[float] = None,
) -> dict:
    """
    Did retrieved context contain enough
    information to answer?
    """

    if not chunks:
        return {
            "answerability": "none",
            "context_sufficiency": "insufficient",
            "query_coverage": 0.0,
            "query_type": "unknown",
        }

    query_type = _classify_query(query)

    query_words = _meaningful_words(query)

    relevant_chunks = chunks

    all_chunk_words = set()

    for text in _chunk_texts(relevant_chunks):

        all_chunk_words.update(_meaningful_words(text))

    if not query_words:
        return {
            "answerability": "partial",
            "context_sufficiency": "partial",
            "query_coverage": 0.5,
            "query_type": query_type,
        }

    overlap = query_words.intersection(all_chunk_words)

    coverage = round(
        len(overlap) / len(query_words),
        2,
    )

    if query_type == "broad_query":

        if coverage >= 0.4:
            answerability = "partial"
            sufficiency = "partial"

        else:
            answerability = "none"
            sufficiency = "insufficient"

    else:

        if coverage >= 0.5:
            answerability = "high"
            sufficiency = "sufficient"

        elif coverage >= 0.2:
            answerability = "partial"
            sufficiency = "partial"

        else:
            answerability = "none"
            sufficiency = "insufficient"

    return {
        "answerability": answerability,
        "context_sufficiency": sufficiency,
        "query_coverage": coverage,
        "query_type": query_type,
    }


def run_evaluation(
    query: str,
    response: str,
    chunks: list,
    scores: list[float],
) -> dict:
    """
    Full multi-dimensional evaluation contract.
    """

    retrieval = evaluate_retrieval_relevance(
        query,
        chunks,
        scores,
    )

    grounding = evaluate_grounding(
        response,
        chunks,
    )

    answerability = evaluate_answerability(
        query,
        chunks,
        scores,
    )

    return {
        **retrieval,
        **grounding,
        **answerability,
    }
