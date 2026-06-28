from pydantic import BaseModel


class InsightReport(BaseModel):
    executive_insight: str

    strengths: list[str]

    weaknesses: list[str]

    engineering_observations: list[str]

    benchmark_takeaway: str
