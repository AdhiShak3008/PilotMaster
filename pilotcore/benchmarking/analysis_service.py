from .insights.service import (
    generate_insight_analysis,
    generate_ai_insight_report,
)

from .recommendations.service import (
    generate_recommendation_analysis,
    generate_ai_recommendation_report,
)

from .schemas.analysis import BenchmarkAnalysis


def generate_deterministic_analysis(
    results,
    leaderboard,
):
    """
    Generates only deterministic benchmark analysis.
    """

    insights = generate_insight_analysis(
        results,
    )

    diagnoses, recommendations = generate_recommendation_analysis(
        results=results,
    )

    return BenchmarkAnalysis(
        insights=insights,
        diagnoses=diagnoses,
        recommendations=recommendations,
        insight_report=None,
        recommendation_report=None,
    )


def generate_ai_analysis(
    results,
    leaderboard,
):
    """
    Generates only AI-written benchmark reports.
    """

    insights = generate_insight_analysis(
        results,
    )

    diagnoses, recommendations = generate_recommendation_analysis(
        results=results,
    )

    insight_report = generate_ai_insight_report(
        results=results,
    )

    recommendation_report = generate_ai_recommendation_report(
        results=results,
        leaderboard=leaderboard,
        insights=insights,
    )

    return BenchmarkAnalysis(
        insights=insights,
        diagnoses=diagnoses,
        recommendations=recommendations,
        insight_report=insight_report,
        recommendation_report=recommendation_report,
    )
