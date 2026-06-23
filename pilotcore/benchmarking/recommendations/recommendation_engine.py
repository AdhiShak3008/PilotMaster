from ..schemas.recommendation import Recommendation
from ..insights.ranking_engine import (
    get_best_overall,
    get_fastest,
    get_most_accurate,
    get_best_efficiency,
)

from .experiment_advisor import (
    suggest_experiments,
)


def generate_recommendations(results):

    recommendations = []

    if not results:
        return recommendations

    # Not enough experiments
    if len(results) == 1:
        recommendations.append(
            Recommendation(
                category="experiment",
                title="More Experiments Needed",
                description=(
                    "Only one configuration has been benchmarked. "
                    "Run additional experiments to generate "
                    "comparative recommendations."
                ),
                configuration=None,
            )
        )

    # Best Overall
    best = get_best_overall(results)

    recommendations.append(
        Recommendation(
            category="best_overall",
            title="Best Overall",
            description=(
                f"{best.config_name} achieved the strongest "
                "overall balance across metrics."
            ),
            configuration=best.config_name,
        )
    )

    # Fastest
    fastest = get_fastest(results)

    recommendations.append(
        Recommendation(
            category="fastest",
            title="Fastest Configuration",
            description=(
                f"{fastest.config_name} achieved "
                f"the lowest latency ({fastest.latency:.0f} ms)."
            ),
            configuration=fastest.config_name,
        )
    )

    # Most Accurate
    accurate = get_most_accurate(results)

    recommendations.append(
        Recommendation(
            category="most_accurate",
            title="Most Accurate",
            description=(
                f"{accurate.config_name} achieved "
                "the highest grounding and faithfulness."
            ),
            configuration=accurate.config_name,
        )
    )

    # Best Efficiency
    efficient = get_best_efficiency(results)

    recommendations.append(
        Recommendation(
            category="best_efficiency",
            title="Best Efficiency",
            description=(
                f"{efficient.config_name} delivered "
                "the best performance-to-latency ratio."
            ),
            configuration=efficient.config_name,
        )
    )

    # Production Candidate
    if best.latency < 5000 and best.abstain_rate < 0.25:
        recommendations.append(
            Recommendation(
                category="production",
                title="Production Candidate",
                description=(
                    f"{best.config_name} demonstrates a "
                    "strong balance of quality and latency "
                    "and is suitable for production evaluation."
                ),
                configuration=best.config_name,
            )
        )

    # Warnings
    for r in results:

        if r.latency > 10000:
            recommendations.append(
                Recommendation(
                    category="warning",
                    title="High Latency Warning",
                    description=(
                        f"{r.config_name} may not be suitable "
                        "for latency-sensitive applications."
                    ),
                    configuration=r.config_name,
                )
            )

        if r.abstain_rate > 0.5:
            recommendations.append(
                Recommendation(
                    category="warning",
                    title="Frequent Abstention Warning",
                    description=(
                        f"{r.config_name} frequently abstained "
                        "from answering and may require "
                        "retrieval improvements."
                    ),
                    configuration=r.config_name,
                )
            )

    # Suggested Experiments
    for suggestion in suggest_experiments(results):

        recommendations.append(
            Recommendation(
                category="experiment",
                title="Experiment Recommendation",
                description=suggestion,
                configuration=None,
            )
        )

    return recommendations
