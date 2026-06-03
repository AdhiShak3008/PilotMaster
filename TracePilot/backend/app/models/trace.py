from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4
from datetime import datetime


class RetrievedChunk(BaseModel):
    chunk_id: str
    text: str
    score: float
    rank: int
    dense_score: Optional[float] = None
    dense_rank: Optional[int] = None
    bm25_score: Optional[float] = None
    bm25_rank: Optional[int] = None
    rrf_score: Optional[float] = None
    reranker_score: Optional[float] = None
    reranker_confidence: Optional[float] = None
    reranker_rank: Optional[int] = None
    final_rank: Optional[int] = None
    retrieval_sources: List[str] = Field(default_factory=list)


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
    spans: list = Field(default_factory=list)
    failure_types: list = Field(default_factory=list)
    evaluation: dict = {}
    user_id: str | None = None
    source: str | None = None
    evaluator_version: str = "1.0"
    prompt_version: str = "1.0"
    retriever_version: str = "vector_v1"
    retrieval_consensus: str | None = None

    @staticmethod
    def create_id():
        return str(uuid4())
