from typing import Any, Literal

from pydantic import BaseModel, Field


class Insight(BaseModel):
    """
    Deterministic benchmark finding.

    An Insight represents a structured engineering observation
    produced by the analysis engine. It intentionally contains
    structured evidence instead of natural language explanations.
    """

    category: Literal[
        "metric",
        "tradeoff",
        "ranking",
        "outlier",
        "observation",
    ]

    title: str

    severity: Literal[
        "info",
        "warning",
        "success",
    ] = "info"

    metric: str | None = None

    configuration: str | None = None

    metadata: dict[str, Any] = Field(
        default_factory=dict,
    )
