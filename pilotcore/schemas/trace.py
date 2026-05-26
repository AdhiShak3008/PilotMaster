from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

from pilotcore.schemas.retrieval import RetrievalResult
from pilotcore.schemas.span import Span


class Trace(BaseModel):
    trace_id: str

    user_query: str

    retrieval_result: Optional[RetrievalResult] = None

    final_response: Optional[str] = None

    spans: List[Span] = []

    created_at: datetime
