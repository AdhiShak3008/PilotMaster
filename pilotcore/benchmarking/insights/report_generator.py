import json

from pilotcore.generation.report_generator import generate_report

from ..schemas.insight_report import InsightReport

from .prompts import (
    SYSTEM_PROMPT,
    build_insight_prompt,
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


def generate_insight_report(
    results,
    findings,
    aggregated,
):
    """
    Generates an AI-written benchmark insight report.
    """

    prompt = build_insight_prompt(
        results=results,
        findings=findings,
        aggregated=aggregated,
    )

    response = generate_report(
        system_prompt=SYSTEM_PROMPT,
        prompt=prompt,
    )

    response = clean_json_response(response)

    try:
        return InsightReport(**json.loads(response))

    except Exception as e:
        print("=" * 80)
        print("INSIGHT REPORT GENERATION FAILED")
        print("ERROR:")
        print(e)
        print("-" * 80)
        print("RAW RESPONSE:")
        print(response)
        print("=" * 80)

        raise
