from ..schemas.insight import Insight

# ==========================================================
# Thresholds
# ==========================================================

GROUNDING_HIGH = 0.80
GROUNDING_LOW = 0.50

FAITHFULNESS_HIGH = 0.80
FAITHFULNESS_LOW = 0.50

RETRIEVAL_HIGH = 0.65
RETRIEVAL_LOW = 0.40

COVERAGE_HIGH = 0.70
COVERAGE_LOW = 0.40

LATENCY_GOOD_MS = 1000
LATENCY_HIGH_MS = 10000

ABSTAIN_HIGH = 0.50


def analyze_metrics(results):

    findings = []

    for r in results:

        analyze_grounding(r, findings)

        analyze_faithfulness(r, findings)

        analyze_retrieval(r, findings)

        analyze_coverage(r, findings)

        analyze_latency(r, findings)

        analyze_abstention(r, findings)

    return findings


# ==========================================================
# Individual Metric Analyzers
# ==========================================================


def analyze_grounding(result, findings):

    value = result.semantic_grounding

    if value >= GROUNDING_HIGH:

        findings.append(
            Insight(
                category="metric",
                title="Grounding",
                severity="success",
                metric="grounding",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": GROUNDING_HIGH,
                    "state": "high",
                    "difference": round(
                        value - GROUNDING_HIGH,
                        4,
                    ),
                },
            )
        )

    elif value < GROUNDING_LOW:

        findings.append(
            Insight(
                category="metric",
                title="Grounding",
                severity="warning",
                metric="grounding",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": GROUNDING_LOW,
                    "state": "low",
                    "difference": round(
                        GROUNDING_LOW - value,
                        4,
                    ),
                },
            )
        )


def analyze_faithfulness(result, findings):

    value = result.faithfulness

    if value >= FAITHFULNESS_HIGH:

        findings.append(
            Insight(
                category="metric",
                title="Faithfulness",
                severity="success",
                metric="faithfulness",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": FAITHFULNESS_HIGH,
                    "state": "high",
                },
            )
        )

    elif value < FAITHFULNESS_LOW:

        findings.append(
            Insight(
                category="metric",
                title="Faithfulness",
                severity="warning",
                metric="faithfulness",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": FAITHFULNESS_LOW,
                    "state": "low",
                },
            )
        )


def analyze_retrieval(result, findings):

    value = result.retrieval_quality_score

    if value >= RETRIEVAL_HIGH:

        findings.append(
            Insight(
                category="metric",
                title="Retrieval Quality",
                severity="success",
                metric="retrieval_quality",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": RETRIEVAL_HIGH,
                    "state": "high",
                },
            )
        )

    elif value < RETRIEVAL_LOW:

        findings.append(
            Insight(
                category="metric",
                title="Retrieval Quality",
                severity="warning",
                metric="retrieval_quality",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": RETRIEVAL_LOW,
                    "state": "low",
                },
            )
        )


def analyze_coverage(result, findings):

    value = result.semantic_query_coverage

    if value >= COVERAGE_HIGH:

        findings.append(
            Insight(
                category="metric",
                title="Coverage",
                severity="success",
                metric="coverage",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": COVERAGE_HIGH,
                    "state": "high",
                },
            )
        )

    elif value < COVERAGE_LOW:

        findings.append(
            Insight(
                category="metric",
                title="Coverage",
                severity="warning",
                metric="coverage",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": COVERAGE_LOW,
                    "state": "low",
                },
            )
        )


def analyze_latency(result, findings):

    value = result.latency

    if value <= LATENCY_GOOD_MS:

        findings.append(
            Insight(
                category="metric",
                title="Latency",
                severity="success",
                metric="latency",
                configuration=result.config_name,
                metadata={
                    "value_ms": value,
                    "threshold": LATENCY_GOOD_MS,
                    "state": "good",
                },
            )
        )

    elif value > LATENCY_HIGH_MS:

        findings.append(
            Insight(
                category="metric",
                title="Latency",
                severity="warning",
                metric="latency",
                configuration=result.config_name,
                metadata={
                    "value_ms": value,
                    "threshold": LATENCY_HIGH_MS,
                    "state": "high",
                },
            )
        )


def analyze_abstention(result, findings):

    value = result.abstain_rate

    if value == 0:

        findings.append(
            Insight(
                category="metric",
                title="Abstention",
                severity="success",
                metric="abstain_rate",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "state": "none",
                },
            )
        )

    elif value > ABSTAIN_HIGH:

        findings.append(
            Insight(
                category="metric",
                title="Abstention",
                severity="warning",
                metric="abstain_rate",
                configuration=result.config_name,
                metadata={
                    "value": value,
                    "threshold": ABSTAIN_HIGH,
                    "state": "high",
                },
            )
        )
