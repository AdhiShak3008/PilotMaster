import json

from pilotcore.generation.report_generator import generate_report

from ..schemas.recommendation_report import RecommendationReport

from .prompts import (
    SYSTEM_PROMPT,
    build_recommendation_prompt,
)


def clean_json_response(response: str) -> str:
    response = response.strip()

    if response.startswith("```"):
        lines = response.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]

        response = "\n".join(lines).strip()

    return response


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

    response = clean_json_response(response)

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
