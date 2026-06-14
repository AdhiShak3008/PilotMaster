from pydantic import BaseModel


class BenchmarkRequest(BaseModel):
    questions: list[str]
