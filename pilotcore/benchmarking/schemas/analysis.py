from pydantic import BaseModel

from .insight import Insight
from .diagnosis import Diagnosis
from .recommendation import Recommendation

from .insight_report import InsightReport
from .recommendation_report import RecommendationReport


class BenchmarkAnalysis(BaseModel):

    # Internal deterministic outputs
    insights: list[Insight]

    diagnoses: list[Diagnosis]

    recommendations: list[Recommendation]

    # AI generated outputs
    insight_report: InsightReport | None = None

    recommendation_report: RecommendationReport | None = None
