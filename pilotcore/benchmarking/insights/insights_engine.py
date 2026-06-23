from ..schemas.insight import Insight


def generate_insights(
    results,
    aggregated,
):
    insights = []

    averages = aggregated["averages"]

    for r in results:

        # Low grounding
        if r.semantic_grounding < 0.5:
            insights.append(
                Insight(
                    type="regression",
                    title="Low Grounding",
                    description=(
                        f"{r.config_name} produced low grounding "
                        f"({r.semantic_grounding:.2f}). "
                        "The generated answers may not be well supported "
                        "by retrieved evidence."
                    ),
                    severity="warning",
                    metric="grounding",
                    configuration=r.config_name,
                )
            )

        # Above average grounding
        if r.semantic_grounding > averages["grounding"] and r.semantic_grounding > 0.6:
            insights.append(
                Insight(
                    type="improvement",
                    title="Above Average Grounding",
                    description=(
                        f"{r.config_name} exceeded the average " "grounding score."
                    ),
                    severity="success",
                    metric="grounding",
                    configuration=r.config_name,
                )
            )

        # High latency
        if r.latency > 10000:
            insights.append(
                Insight(
                    type="regression",
                    title="High Latency",
                    description=(
                        f"{r.config_name} took " f"{r.latency:.0f} ms to complete."
                    ),
                    severity="warning",
                    metric="latency",
                    configuration=r.config_name,
                )
            )

        # Poor retrieval quality
        if r.retrieval_quality_score < 0.4:
            insights.append(
                Insight(
                    type="regression",
                    title="Poor Retrieval Quality",
                    description=(f"{r.config_name} retrieved " "low-quality context."),
                    severity="warning",
                    metric="retrieval_quality",
                    configuration=r.config_name,
                )
            )

        # Frequent abstention
        if r.abstain_rate > 0.5:
            insights.append(
                Insight(
                    type="observation",
                    title="Frequent Abstention",
                    description=(
                        f"{r.config_name} abstained from " "answering frequently."
                    ),
                    severity="warning",
                    metric="abstain_rate",
                    configuration=r.config_name,
                )
            )

        # Excellent faithfulness
        if r.faithfulness >= 0.9:
            insights.append(
                Insight(
                    type="improvement",
                    title="High Faithfulness",
                    description=(
                        f"{r.config_name} achieved excellent " "faithfulness."
                    ),
                    severity="success",
                    metric="faithfulness",
                    configuration=r.config_name,
                )
            )

        if len(results) >= 2:

            fastest = min(
                results,
                key=lambda r: r.latency,
            )

            insights.append(
                Insight(
                    type="tradeoff",
                    title="Fastest Configuration",
                    description=(
                        f"{fastest.config_name} " f"achieved the lowest latency."
                    ),
                    severity="info",
                )
            )

            best_grounding = max(
                results,
                key=lambda r: r.semantic_grounding,
            )

            insights.append(
                Insight(
                    type="tradeoff",
                    title="Best Grounding",
                    description=(
                        f"{best_grounding.config_name} "
                        f"achieved the strongest grounding."
                    ),
                    severity="info",
                )
            )

    return insights
