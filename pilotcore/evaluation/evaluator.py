import re

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


def _chunk_texts(chunks: list) -> list[str]:

    return [c["text"] if isinstance(c, dict) else c.chunk.text for c in chunks]


def _meaningful_words(text: str) -> set:

    words = re.findall(
        r"\b[a-zA-Z0-9]+\b",
        text.lower(),
    )

    return {w for w in words if w not in STOPWORDS and len(w) > 2}


def _classify_query(query: str) -> str:

    q = query.lower().strip()

    words = set(q.split())

    if any(v in words for v in BROAD_QUERY_VERBS):
        return "broad_query"

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
            "reranker_confidence_avg": 0.0,
            "reranker_margin": 0.0,
            "retrieval_consensus": "none",
        }

    overlap_relevance = evaluate_query_relevance(
        query,
        chunks,
    )

    reranker_confidences = []

    reranker_raw_scores = []

    for c in chunks:

        if isinstance(c, dict):

            confidence = c.get("reranker_confidence")

            raw_score = c.get("reranker_score")

            sources = (
                c.get(
                    "retrieval_sources",
                    [],
                )
                or []
            )

        else:

            confidence = getattr(
                c,
                "reranker_confidence",
                None,
            )

            raw_score = getattr(
                c,
                "reranker_score",
                None,
            )

            sources = (
                getattr(
                    c,
                    "retrieval_sources",
                    [],
                )
                or []
            )

        if confidence is not None:
            reranker_confidences.append(float(confidence))

        if raw_score is not None:
            reranker_raw_scores.append(float(raw_score))

    reranker_confidence_avg = round(
        sum(reranker_confidences) / max(len(reranker_confidences), 1),
        4,
    )

    top_retrieval_score = (
        round(
            max(reranker_confidences),
            4,
        )
        if reranker_confidences
        else 0.0
    )

    retrieval_score_avg = reranker_confidence_avg

    # ===== Margin =====

    if len(reranker_raw_scores) >= 2:

        sorted_raw = sorted(
            reranker_raw_scores,
            reverse=True,
        )

        reranker_margin = round(
            sorted_raw[0] - sorted_raw[1],
            4,
        )

    else:

        reranker_margin = 0.0

    # ===== Retrieval Agreement =====

    consensus_counts = {
        "strong": 0,
        "semantic": 0,
        "lexical": 0,
        "none": 0,
    }

    for c in chunks:

        if isinstance(c, dict):

            sources = (
                c.get(
                    "retrieval_sources",
                    [],
                )
                or []
            )

        else:

            sources = (
                getattr(
                    c,
                    "retrieval_sources",
                    [],
                )
                or []
            )

        has_dense = "dense" in sources

        has_bm25 = "bm25" in sources

        if has_dense and has_bm25:

            consensus_counts["strong"] += 1

        elif has_dense:

            consensus_counts["semantic"] += 1

        elif has_bm25:

            consensus_counts["lexical"] += 1

        else:

            consensus_counts["none"] += 1

    retrieval_consensus = max(
        consensus_counts.items(),
        key=lambda x: x[1],
    )[0]

    # ===== Composite Retrieval Quality =====

    quality_score = 0.0

    # confidence dominates
    quality_score += reranker_confidence_avg * 0.7

    # agreement boost
    if retrieval_consensus == "strong":

        quality_score += 0.2

    elif retrieval_consensus in (
        "semantic",
        "lexical",
    ):

        quality_score += 0.1

    # certainty boost
    if reranker_margin > 1.5:

        quality_score += 0.1

    elif reranker_margin > 0.5:

        quality_score += 0.05

    # overlap fallback
    if overlap_relevance == "high":

        quality_score += 0.05

    quality_score = round(
        min(quality_score, 1.0),
        4,
    )

    if quality_score >= 0.65:

        retrieval_relevance = "high"

    elif quality_score >= 0.35:

        retrieval_relevance = "medium"

    else:

        retrieval_relevance = "low"

    return {
        "retrieval_relevance": retrieval_relevance,
        "retrieval_score_avg": retrieval_score_avg,
        "top_retrieval_score": top_retrieval_score,
        "reranker_confidence_avg": reranker_confidence_avg,
        "reranker_margin": reranker_margin,
        "retrieval_consensus": retrieval_consensus,
        "retrieval_quality_score": quality_score,
    }


def evaluate_grounding(
    response: str,
    chunks: list,
) -> dict:

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

    grounded = len(overlap) >= 3

    grounding_confidence = (
        "high" if faithfulness > 0.5 else "medium" if faithfulness > 0.25 else "low"
    )

    hallucination_risk = (
        "low" if faithfulness > 0.6 else "medium" if faithfulness > 0.3 else "high"
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

    if not chunks:

        return {
            "answerability": "none",
            "context_sufficiency": "insufficient",
            "query_coverage": 0.0,
            "query_type": "unknown",
        }

    query_type = _classify_query(query)

    query_words = _meaningful_words(query)

    all_chunk_words = set()

    for text in _chunk_texts(chunks):

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
