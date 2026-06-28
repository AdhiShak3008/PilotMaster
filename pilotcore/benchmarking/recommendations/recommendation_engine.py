from ..schemas.recommendation import Recommendation

from ..insights.ranking_engine import compute_rankings

from .experiment_advisor import suggest_experiments


def generate_recommendations(results):

    recommendations = []

    if not results:
        return recommendations

    rankings = compute_rankings(results)

    best = rankings["best_overall"]
    fastest = rankings["fastest"]
    accurate = rankings["most_accurate"]
    efficient = rankings["best_efficiency"]

    # =====================================================
    # Benchmark Coverage
    # =====================================================

    if len(results) == 1:
        recommendations.append(
            Recommendation(
                category="experiment",
                title="Expand Benchmark Coverage",
                description=(
                    "Benchmark additional configurations to enable meaningful comparisons."
                ),
                configuration=None,
            )
        )

    # =====================================================
    # Production Candidate
    # =====================================================

    recommendations.append(
        Recommendation(
            category="production",
            title="Primary Production Candidate",
            description=(
                f"{best.config_name} achieved the strongest overall benchmark performance."
            ),
            configuration=best.config_name,
        )
    )

    # =====================================================
    # Fastest
    # =====================================================

    recommendations.append(
        Recommendation(
            category="performance",
            title="Lowest Latency Configuration",
            description=(
                f"{fastest.config_name} is the fastest benchmarked configuration."
            ),
            configuration=fastest.config_name,
        )
    )

    # =====================================================
    # Highest Quality
    # =====================================================

    recommendations.append(
        Recommendation(
            category="quality",
            title="Highest Answer Quality",
            description=(
                f"{accurate.config_name} achieved the highest combined grounding and faithfulness."
            ),
            configuration=accurate.config_name,
        )
    )

    # =====================================================
    # Best Efficiency
    # =====================================================

    recommendations.append(
        Recommendation(
            category="efficiency",
            title="Best Performance Efficiency",
            description=(
                f"{efficient.config_name} delivered the strongest quality-to-latency tradeoff."
            ),
            configuration=efficient.config_name,
        )
    )

    # =====================================================
    # Optimization Opportunities
    # =====================================================

    for r in results:

        if r.latency > 10000:
            recommendations.append(
                Recommendation(
                    category="optimization",
                    title="Reduce Pipeline Latency",
                    description=(
                        "Investigate retrieval, reranking or model complexity to reduce latency."
                    ),
                    configuration=r.config_name,
                )
            )

        if r.abstain_rate > 0.5:
            recommendations.append(
                Recommendation(
                    category="optimization",
                    title="Improve Retrieval Coverage",
                    description=(
                        "Increase evidence quality before generation to reduce abstentions."
                    ),
                    configuration=r.config_name,
                )
            )

    # =====================================================
    # Suggested Experiments
    # =====================================================

    for suggestion in suggest_experiments(results):

        recommendations.append(
            Recommendation(
                category="experiment",
                title="Suggested Next Experiment",
                description=suggestion,
                configuration=None,
            )
        )

    return recommendations
