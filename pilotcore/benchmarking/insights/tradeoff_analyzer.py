from ..schemas.insight import Insight


def analyze_tradeoffs(results):

    findings = []

    if len(results) < 2:
        return findings

    fastest = min(
        results,
        key=lambda r: r.latency,
    )

    best_grounding = max(
        results,
        key=lambda r: r.semantic_grounding,
    )

    best_faithfulness = max(
        results,
        key=lambda r: r.faithfulness,
    )

    best_retrieval = max(
        results,
        key=lambda r: r.retrieval_quality_score,
    )

    # =====================================================
    # Latency vs Grounding
    # =====================================================

    if fastest.config_name != best_grounding.config_name:

        findings.append(
            Insight(
                category="tradeoff",
                title="Latency vs Grounding",
                severity="info",
                metadata={
                    "fastest": fastest.config_name,
                    "best_grounding": best_grounding.config_name,
                    "grounding_gain": round(
                        best_grounding.semantic_grounding - fastest.semantic_grounding,
                        4,
                    ),
                    "latency_penalty_ms": round(
                        best_grounding.latency - fastest.latency,
                        2,
                    ),
                },
            )
        )

    # =====================================================
    # Latency vs Faithfulness
    # =====================================================

    if fastest.config_name != best_faithfulness.config_name:

        findings.append(
            Insight(
                category="tradeoff",
                title="Latency vs Faithfulness",
                severity="info",
                metadata={
                    "fastest": fastest.config_name,
                    "best_faithfulness": best_faithfulness.config_name,
                    "faithfulness_gain": round(
                        best_faithfulness.faithfulness - fastest.faithfulness,
                        4,
                    ),
                    "latency_penalty_ms": round(
                        best_faithfulness.latency - fastest.latency,
                        2,
                    ),
                },
            )
        )

    # =====================================================
    # Retrieval vs Grounding
    # =====================================================

    if best_retrieval.config_name != best_grounding.config_name:

        findings.append(
            Insight(
                category="tradeoff",
                title="Retrieval vs Grounding",
                severity="info",
                metadata={
                    "best_retrieval": best_retrieval.config_name,
                    "best_grounding": best_grounding.config_name,
                    "retrieval_quality": best_retrieval.retrieval_quality_score,
                    "grounding": best_grounding.semantic_grounding,
                },
            )
        )

    return findings
