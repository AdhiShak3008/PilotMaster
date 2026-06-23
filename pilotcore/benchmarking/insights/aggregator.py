from statistics import mean


def compute_averages(results):

    return {
        "faithfulness": mean(r.faithfulness for r in results),
        "grounding": mean(r.semantic_grounding for r in results),
        "coverage": mean(r.semantic_query_coverage for r in results),
        "retrieval_quality": mean(r.retrieval_quality_score for r in results),
        "latency": mean(r.latency for r in results),
        "grounded_rate": mean(r.grounded_rate for r in results),
        "abstain_rate": mean(r.abstain_rate for r in results),
    }


def compute_extremes(results):

    return {
        "best_grounding": max(
            results,
            key=lambda r: r.semantic_grounding,
        ),
        "best_faithfulness": max(
            results,
            key=lambda r: r.faithfulness,
        ),
        "fastest": min(
            results,
            key=lambda r: r.latency,
        ),
    }


def build_configuration_map(results):

    return {
        r.config_name: {
            "faithfulness": r.faithfulness,
            "grounding": r.semantic_grounding,
            "coverage": r.semantic_query_coverage,
            "retrieval_quality": r.retrieval_quality_score,
            "latency": r.latency,
            "grounded_rate": r.grounded_rate,
            "abstain_rate": r.abstain_rate,
        }
        for r in results
    }


def aggregate(results):

    return {
        "averages": compute_averages(results),
        "extremes": compute_extremes(results),
        "configurations": build_configuration_map(results),
    }
