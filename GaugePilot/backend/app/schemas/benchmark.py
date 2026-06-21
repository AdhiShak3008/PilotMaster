from pydantic import BaseModel


class BenchmarkRequest(BaseModel):
    questions: list[str]
    model: str | None = None
    retrieval_method: str
    reranker: str
    enhancements: list[str] = []
