from pydantic import BaseModel


class BenchmarkRequest(BaseModel):
    source: str
    questions: list[str]
