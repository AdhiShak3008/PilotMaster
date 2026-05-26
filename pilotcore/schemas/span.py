from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Span(BaseModel):
    span_id: str

    trace_id: str

    name: str

    start_time: datetime

    end_time: Optional[datetime] = None
