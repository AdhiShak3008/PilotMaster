from pydantic import BaseModel
from typing import Literal


class Insight(BaseModel):
    type: Literal[
        "improvement",
        "regression",
        "observation",
        "tradeoff",
    ]

    title: str
    description: str
    severity: Literal[
        "info",
        "warning",
        "success",
    ] = "info"

    metric: str | None = None
    configuration: str | None = None
