from pydantic import BaseModel


class RecommendationReport(BaseModel):
    executive_recommendation: str

    priority_actions: list[str]

    pipeline_optimizations: list[str]

    next_experiment: str

    production_readiness: str
