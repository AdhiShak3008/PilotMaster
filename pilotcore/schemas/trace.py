from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from pydantic import Field
from pilotcore.schemas.retrieval import RetrievalResult
from pilotcore.schemas.span import Span


class Trace(BaseModel):
    trace_id: str

    user_query: str

    rewritten_query: Optional[str] = None

    generated_queries: List[str] = Field(default_factory=list)

    retrieval_result: Optional[RetrievalResult] = None

    final_response: Optional[str] = None

    spans: List[Span] = Field(default_factory=list)

    created_at: datetime

    evaluation: Optional[dict] = None

    latency_ms: Optional[float] = None
