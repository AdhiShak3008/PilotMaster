from .diagnostics_engine import generate_diagnoses
from .recommendation_engine import generate_recommendations
from .report_generator import generate_recommendation_report


def generate_recommendation_analysis(
    results,
):
    """
    Generates only deterministic recommendation analysis.
    """

    diagnoses = generate_diagnoses(
        results,
    )

    recommendations = generate_recommendations(
        results,
    )

    return (
        diagnoses,
        recommendations,
    )


def generate_ai_recommendation_report(
    results,
    leaderboard,
    insights,
):
    """
    Generates the AI-written recommendation report.
    """

    diagnoses = generate_diagnoses(
        results,
    )

    recommendations = generate_recommendations(
        results,
    )

    return generate_recommendation_report(
        results=results,
        leaderboard=leaderboard,
        insights=insights,
        diagnoses=diagnoses,
        recommendations=recommendations,
    )
