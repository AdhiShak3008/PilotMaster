from pydantic import BaseModel
from typing import List
from uuid import uuid4
from datetime import datetime


class RetrievedChunk(BaseModel):
    chunk_id: str
    text: str
    score: float
    rank: int


class Trace(BaseModel):
    trace_id: str
    query: str
    retrieved_chunks: List[RetrievedChunk]
    prompt: str
    response: str
    latency: float
    timestamp: datetime
    model_name: str
    retrieval_score_avg: float
    response_length: int
    chunk_count: int
    parent_trace_id: str | None = None
    retrieval_quality: str
    grounded: bool
    top_retrieval_score: float = 0.0
    prompt_mode: str = "strict"
    spans: list = []
    failure_types: list = []
    evaluation: dict = {}
    user_id: str | None = None
    source: str | None = None
    evaluator_version: str = "1.0"
    prompt_version: str = "1.0"
    retriever_version: str = "vector_v1"

    @staticmethod
    def create_id():
        return str(uuid4())
