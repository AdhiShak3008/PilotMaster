from pydantic import BaseModel
from typing import Literal


class ChatRequest(BaseModel):

    question: str

    source: str | None = None

    session_id: int | None = None

    model_name: str | None = None

    retrieval_strategy: str | None = None

    enhancements: list[str] | None = None

    reranker: str | None = None

    mode: Literal["production", "experimental"] = "production"
