from .metric_analyzer import analyze_metrics
from .tradeoff_analyzer import analyze_tradeoffs
from .ranking_analyzer import analyze_rankings


def build_findings(results):

    findings = []

    findings.extend(analyze_metrics(results))

    findings.extend(analyze_tradeoffs(results))

    findings.extend(analyze_rankings(results))

    return findings
