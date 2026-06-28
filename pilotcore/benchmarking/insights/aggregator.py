from statistics import mean


def summarize_result(result):
    return {
        "configuration": result.config_name,
        "faithfulness": result.faithfulness,
        "grounding": result.semantic_grounding,
        "coverage": result.semantic_query_coverage,
        "retrieval_quality": result.retrieval_quality_score,
        "latency": result.latency,
        "grounded_rate": result.grounded_rate,
        "abstain_rate": result.abstain_rate,
    }


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
        "best_grounding": summarize_result(
            max(results, key=lambda r: r.semantic_grounding)
        ),
        "best_faithfulness": summarize_result(
            max(results, key=lambda r: r.faithfulness)
        ),
        "best_retrieval": summarize_result(
            max(results, key=lambda r: r.retrieval_quality_score)
        ),
        "best_coverage": summarize_result(
            max(results, key=lambda r: r.semantic_query_coverage)
        ),
        "lowest_abstention": summarize_result(
            min(results, key=lambda r: r.abstain_rate)
        ),
        "fastest": summarize_result(min(results, key=lambda r: r.latency)),
    }


def compute_ranges(results):
    return {
        "faithfulness": (
            min(r.faithfulness for r in results),
            max(r.faithfulness for r in results),
        ),
        "grounding": (
            min(r.semantic_grounding for r in results),
            max(r.semantic_grounding for r in results),
        ),
        "coverage": (
            min(r.semantic_query_coverage for r in results),
            max(r.semantic_query_coverage for r in results),
        ),
        "retrieval_quality": (
            min(r.retrieval_quality_score for r in results),
            max(r.retrieval_quality_score for r in results),
        ),
        "latency": (
            min(r.latency for r in results),
            max(r.latency for r in results),
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
        "ranges": compute_ranges(results),
        "configurations": build_configuration_map(results),
    }
