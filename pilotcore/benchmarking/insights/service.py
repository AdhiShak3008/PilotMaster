from .aggregator import aggregate
from .finding_builder import build_findings
from .report_generator import generate_insight_report


def generate_insight_analysis(results):
    """
    Generates only deterministic benchmark findings.
    """

    findings = build_findings(results)

    return findings


def generate_ai_insight_report(results):
    """
    Generates the AI-written insight report.
    """

    aggregated = aggregate(results)

    findings = build_findings(results)

    return generate_insight_report(
        results=results,
        findings=findings,
        aggregated=aggregated,
    )
