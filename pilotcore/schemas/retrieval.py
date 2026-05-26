from pydantic import BaseModel
from typing import List

from pilotcore.schemas.chunk import Chunk


class RetrievedChunk(BaseModel):
    chunk: Chunk
    score: float


class RetrievalResult(BaseModel):
    trace_id: str

    query: str

    retrieved_chunks: List[RetrievedChunk]

    latency_ms: float

    retriever_version: str
