from pydantic import BaseModel


class Diagnosis(BaseModel):
    issue: str
    severity: str
    causes: list[str]
    recommendations: list[str]
