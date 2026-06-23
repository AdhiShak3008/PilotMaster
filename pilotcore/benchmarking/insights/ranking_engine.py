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


def get_best_overall(results):

    max_latency = max(r.latency for r in results)

    def score(r):

        normalized_latency = r.latency / max_latency

        return (
            0.30 * r.semantic_grounding
            + 0.25 * r.faithfulness
            + 0.20 * r.retrieval_quality_score
            + 0.15 * r.semantic_query_coverage
            + 0.05 * r.grounded_rate
            - 0.10 * normalized_latency
            - 0.20 * r.abstain_rate
        )

    return max(
        results,
        key=score,
    )
