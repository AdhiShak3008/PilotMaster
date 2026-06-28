OVERALL_WEIGHTS = {
    "grounding": 0.30,
    "faithfulness": 0.25,
    "retrieval_quality": 0.20,
    "coverage": 0.15,
    "grounded_rate": 0.05,
    "latency": -0.10,
    "abstain_rate": -0.20,
}


def get_fastest(results):
    return min(
        results,
        key=lambda r: r.latency,
    )


def get_most_accurate(results):
    return max(
        results,
        key=lambda r: r.semantic_grounding + r.faithfulness,
    )


def get_best_efficiency(results):
    return max(
        results,
        key=lambda r: (
            r.semantic_grounding + r.faithfulness + r.retrieval_quality_score
        )
        / max(r.latency, 1),
    )


def score_overall(result, max_latency):

    normalized_latency = result.latency / max_latency

    return (
        OVERALL_WEIGHTS["grounding"] * result.semantic_grounding
        + OVERALL_WEIGHTS["faithfulness"] * result.faithfulness
        + OVERALL_WEIGHTS["retrieval_quality"] * result.retrieval_quality_score
        + OVERALL_WEIGHTS["coverage"] * result.semantic_query_coverage
        + OVERALL_WEIGHTS["grounded_rate"] * result.grounded_rate
        + OVERALL_WEIGHTS["latency"] * normalized_latency
        + OVERALL_WEIGHTS["abstain_rate"] * result.abstain_rate
    )


def get_best_overall(results):

    max_latency = max(r.latency for r in results)

    return max(
        results,
        key=lambda r: score_overall(
            r,
            max_latency,
        ),
    )


def compute_rankings(results):
    """
    Returns all benchmark rankings in a single object.
    """

    return {
        "best_overall": get_best_overall(results),
        "best_efficiency": get_best_efficiency(results),
        "most_accurate": get_most_accurate(results),
        "fastest": get_fastest(results),
    }
