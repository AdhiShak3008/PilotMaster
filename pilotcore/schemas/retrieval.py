from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

from pilotcore.schemas.chunk import Chunk


class RetrievedChunk(BaseModel):
    model_config = ConfigDict(validate_assignment=True)
    chunk: Chunk

    # temporary compatibility field
    score: float

    # retrieval stage scores
    dense_score: Optional[float] = None
    bm25_score: Optional[float] = None
    rrf_score: Optional[float] = None
    reranker_score: Optional[float] = None
    reranker_confidence: Optional[float] = None
    reranker_margin: Optional[float] = None

    # ranking metadata
    dense_rank: Optional[int] = None
    bm25_rank: Optional[int] = None
    reranker_rank: Optional[int] = None
    final_rank: Optional[int] = None

    # provenance
    retrieval_sources: List[str] = Field(default_factory=list)


class RetrievalResult(BaseModel):
    trace_id: str

    query: str

    retrieved_chunks: List[RetrievedChunk]

    latency_ms: float

    retriever_version: str
