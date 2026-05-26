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

# Query types that signal intent beyond simple keyword lookup
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
    return {w for w in text.lower().split() if w not in STOPWORDS and len(w) > 2}


def _classify_query(query: str) -> str:
    """
    Classify query intent to inform answerability evaluation.

    Returns:
        direct_fact
        broad_query
        abstention_likely
        keyword_trap
    """

    q = query.lower().strip()
    words = set(q.split())

    if any(v in words for v in BROAD_QUERY_VERBS):
        return "broad_query"

    if q.startswith("who is") or (q.startswith("what is") and len(words) <= 5):
        return "direct_fact"

    return "direct_fact"


def evaluate_retrieval_relevance(
    query: str,
    chunks: list,
    scores: list[float],
) -> dict:
    """
    Did retrieval fetch semantically relevant context?

    Uses L2 distance:
    LOWER = BETTER

    Current thresholds calibrated using
    real production traces from PilotMaster.
    """

    if not chunks or not scores:
        return {
            "retrieval_relevance": "none",
            "retrieval_score_avg": 0.0,
            "top_retrieval_score": 0.0,
        }

    # Ignore noisy retrievals
    relevant_scores = [s for s in scores if s < 1.4]

    if not relevant_scores:
        return {
            "retrieval_relevance": "low",
            "retrieval_score_avg": round(
                sum(scores) / len(scores),
                4,
            ),
            "top_retrieval_score": round(
                min(scores),
                4,
            ),
        }

    top_score = min(relevant_scores)

    avg_score = round(
        sum(scores) / len(scores),
        4,
    )

    # =========================
    # L2 Distance Thresholds
    # LOWER = BETTER
    # =========================

    if top_score < 1.15:
        relevance = "high"

    elif top_score < 1.35:
        relevance = "medium"

    else:
        relevance = "low"

    return {
        "retrieval_relevance": relevance,
        "retrieval_score_avg": avg_score,
        "top_retrieval_score": round(
            top_score,
            4,
        ),
    }


def evaluate_grounding(
    response: str,
    chunks: list,
) -> dict:
    """
    Did the model answer USING retrieved evidence?

    Abstention is rewarded as correct grounded behavior.
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

    # Penalize long responses
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

    Intent-aware:
    broad queries are harder to fully answer.
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

    # Ignore noisy chunks
    if scores:
        relevant_chunks = [c for c, s in zip(chunks, scores) if s < 1.4]
    else:
        relevant_chunks = chunks

    if not relevant_chunks:
        return {
            "answerability": "none",
            "context_sufficiency": "insufficient",
            "query_coverage": 0.0,
            "query_type": query_type,
        }

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

    # Broad conceptual queries
    if query_type == "broad_query":

        if coverage >= 0.4:
            answerability = "partial"
            sufficiency = "partial"

        else:
            answerability = "none"
            sufficiency = "insufficient"

    # Direct fact queries
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
