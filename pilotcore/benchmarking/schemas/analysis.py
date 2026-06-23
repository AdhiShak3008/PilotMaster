from pydantic import BaseModel

from .insight import Insight
from .diagnosis import Diagnosis
from .recommendation import Recommendation


class BenchmarkAnalysis(BaseModel):
    insights: list[Insight]
    diagnoses: list[Diagnosis]
    recommendations: list[Recommendation]
    llm_summary: str | None = None
