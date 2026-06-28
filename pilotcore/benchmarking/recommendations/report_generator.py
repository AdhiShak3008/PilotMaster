import json

from pilotcore.generation.report_generator import generate_report

from ..schemas.recommendation_report import RecommendationReport

from .prompts import (
    SYSTEM_PROMPT,
    build_recommendation_prompt,
)


def generate_recommendation_report(
    leaderboard,
    results,
    insights,
    diagnoses,
    recommendations,
):
    """
    Generates an AI-written recommendation report.
    """

    prompt = build_recommendation_prompt(
        leaderboard=leaderboard,
        results=results,
        insights=insights,
        diagnoses=diagnoses,
        recommendations=recommendations,
    )

    response = generate_report(
        system_prompt=SYSTEM_PROMPT,
        prompt=prompt,
    )

    try:
        return RecommendationReport(**json.loads(response))

    except Exception as e:
        print("=" * 80)
        print("RECOMMENDATION REPORT GENERATION FAILED")
        print("ERROR:")
        print(e)
        print("-" * 80)
        print("RAW RESPONSE:")
        print(response)
        print("=" * 80)

        raise
