def rank_metric(
    results,
    metric_name,
    reverse=True,
):
    ranked = sorted(
        results,
        key=lambda r: getattr(r, metric_name),
        reverse=reverse,
    )

    return [
        {
            "rank": rank,
            "config_name": result.config_name,
            "value": getattr(result, metric_name),
        }
        for rank, result in enumerate(
            ranked,
            start=1,
        )
    ]


def generate_leaderboard(
    benchmark_results,
):
    faithfulness_ranks = {
        row["config_name"]: row["rank"]
        for row in rank_metric(
            benchmark_results,
            "faithfulness",
        )
    }

    grounding_ranks = {
        row["config_name"]: row["rank"]
        for row in rank_metric(
            benchmark_results,
            "semantic_grounding",
        )
    }

    retrieval_quality_ranks = {
        row["config_name"]: row["rank"]
        for row in rank_metric(
            benchmark_results,
            "retrieval_quality_score",
        )
    }

    query_coverage_ranks = {
        row["config_name"]: row["rank"]
        for row in rank_metric(
            benchmark_results,
            "semantic_query_coverage",
        )
    }

    latency_ranks = {
        row["config_name"]: row["rank"]
        for row in rank_metric(
            benchmark_results,
            "latency",
            reverse=False,
        )
    }

    overall = []

    for result in benchmark_results:

        average_rank = (
            faithfulness_ranks[result.config_name]
            + grounding_ranks[result.config_name]
            + retrieval_quality_ranks[result.config_name]
            + query_coverage_ranks[result.config_name]
            + latency_ranks[result.config_name]
        ) / 5

        overall.append(
            {
                "config_name": result.config_name,
                "average_rank": round(
                    average_rank,
                    2,
                ),
                "faithfulness_rank": faithfulness_ranks[result.config_name],
                "grounding_rank": grounding_ranks[result.config_name],
                "retrieval_quality_rank": retrieval_quality_ranks[result.config_name],
                "query_coverage_rank": query_coverage_ranks[result.config_name],
                "latency_rank": latency_ranks[result.config_name],
                "metrics": {
                    "faithfulness": result.faithfulness,
                    "semantic_grounding": result.semantic_grounding,
                    "retrieval_quality_score": result.retrieval_quality_score,
                    "semantic_query_coverage": result.semantic_query_coverage,
                    "latency": result.latency,
                    "grounded_rate": result.grounded_rate,
                    "abstain_rate": result.abstain_rate,
                },
            }
        )

    overall.sort(key=lambda row: row["average_rank"])

    print("\n===== CONSENSUS LEADERBOARD =====")

    for row in overall:
        print(
            row["config_name"],
            "| avg_rank =",
            row["average_rank"],
        )

    print("===============================\n")

    return {
        "overall": overall,
        "faithfulness": rank_metric(
            benchmark_results,
            "faithfulness",
        ),
        "grounding": rank_metric(
            benchmark_results,
            "semantic_grounding",
        ),
        "retrieval_quality": rank_metric(
            benchmark_results,
            "retrieval_quality_score",
        ),
        "query_coverage": rank_metric(
            benchmark_results,
            "semantic_query_coverage",
        ),
        "latency": rank_metric(
            benchmark_results,
            "latency",
            reverse=False,
        ),
    }
