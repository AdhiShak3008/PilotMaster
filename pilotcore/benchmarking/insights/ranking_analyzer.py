from ..schemas.insight import Insight

from .ranking_engine import compute_rankings


def analyze_rankings(results):

    findings = []

    if not results:
        return findings

    rankings = compute_rankings(results)

    # =====================================================
    # Best Overall
    # =====================================================

    best = rankings["best_overall"]

    findings.append(
        Insight(
            category="ranking",
            title="Best Overall",
            severity="success",
            configuration=best.config_name,
            metadata={
                "configuration": best.config_name,
                "grounding": best.semantic_grounding,
                "faithfulness": best.faithfulness,
                "retrieval_quality": best.retrieval_quality_score,
                "coverage": best.semantic_query_coverage,
                "latency": best.latency,
                "grounded_rate": best.grounded_rate,
                "abstain_rate": best.abstain_rate,
            },
        )
    )

    # =====================================================
    # Fastest
    # =====================================================

    fastest = rankings["fastest"]

    findings.append(
        Insight(
            category="ranking",
            title="Fastest Configuration",
            severity="info",
            configuration=fastest.config_name,
            metadata={
                "configuration": fastest.config_name,
                "latency": fastest.latency,
            },
        )
    )

    # =====================================================
    # Most Accurate
    # =====================================================

    accurate = rankings["most_accurate"]

    findings.append(
        Insight(
            category="ranking",
            title="Most Accurate",
            severity="success",
            configuration=accurate.config_name,
            metadata={
                "configuration": accurate.config_name,
                "grounding": accurate.semantic_grounding,
                "faithfulness": accurate.faithfulness,
            },
        )
    )

    # =====================================================
    # Best Efficiency
    # =====================================================

    efficient = rankings["best_efficiency"]

    findings.append(
        Insight(
            category="ranking",
            title="Best Efficiency",
            severity="success",
            configuration=efficient.config_name,
            metadata={
                "configuration": efficient.config_name,
                "latency": efficient.latency,
                "grounding": efficient.semantic_grounding,
                "faithfulness": efficient.faithfulness,
                "retrieval_quality": efficient.retrieval_quality_score,
            },
        )
    )

    return findings
