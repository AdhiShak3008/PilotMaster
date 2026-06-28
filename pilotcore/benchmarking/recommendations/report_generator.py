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

    except Exception:

        return RecommendationReport(
            executive_recommendation="",
            priority_actions=[],
            pipeline_optimizations=[],
            next_experiment="",
            production_readiness="",
        )
