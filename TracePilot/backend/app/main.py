from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from TracePilot.backend.app.db.database import (
    init_db,
    get_connection,
)

from TracePilot.backend.app.pipelines.pipeline_runner import PipelineRunner

from TracePilot.backend.app.tracing.trace_manager import (
    get_traces,
    get_trace_by_id,
    save_trace,
    delete_all_traces,
)

from TracePilot.backend.app.tracing.replay import (
    replay_trace as run_replay,
)

from TracePilot.backend.app.analytics.failure_detector import (
    detect_failures,
)

from TracePilot.backend.app.models.trace import (
    Trace,
    RetrievedChunk,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


class QueryRequest(BaseModel):
    query: str
    prompt_mode: str = "strict"


class IngestChunk(BaseModel):
    chunk_id: str
    text: str
    score: float
    rank: int


class IngestRequest(BaseModel):
    trace_id: str
    query: str
    response: str
    prompt: str
    latency: float
    model_name: str
    retrieved_chunks: List[IngestChunk]
    retrieval_score_avg: float
    top_retrieval_score: float
    chunk_count: int
    response_length: int
    retrieval_quality: str
    grounded: bool
    evaluation: Optional[dict] = None
    spans: list = []
    failure_types: list = []
    prompt_mode: str = "strict"
    parent_trace_id: Optional[str] = None
    user_id: Optional[str] = None
    source: Optional[str] = None
    evaluator_version: Optional[str] = "1.0"
    prompt_version: Optional[str] = "1.0"
    retriever_version: Optional[str] = "vector_v1"


class EventRequest(BaseModel):
    event_type: str
    payload: dict


class IngestDocumentRequest(BaseModel):
    document_id: str
    user_id: str
    filename: str
    chunk_count: int
    char_count: int
    latency_ms: float
    status: str


@app.post("/ingest/document")
def ingest_document(request: IngestDocumentRequest):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO ingestion_traces
        (
            document_id,
            user_id,
            filename,
            chunk_count,
            char_count,
            latency_ms,
            status,
            timestamp
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            request.document_id,
            request.user_id,
            request.filename,
            request.chunk_count,
            request.char_count,
            request.latency_ms,
            request.status,
            str(datetime.utcnow()),
        ),
    )

    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "document_id": request.document_id,
    }


@app.get("/ingestion-traces")
def get_ingestion_traces():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM ingestion_traces ORDER BY timestamp DESC")

    rows = cursor.fetchall()

    conn.close()

    return [dict(row) for row in rows]


@app.post("/ingest")
def ingest_trace(request: IngestRequest):

    trace = Trace(
        trace_id=request.trace_id,
        query=request.query,
        retrieved_chunks=[RetrievedChunk(**c.dict()) for c in request.retrieved_chunks],
        prompt=request.prompt,
        response=request.response,
        latency=request.latency,
        timestamp=datetime.utcnow(),
        model_name=request.model_name,
        retrieval_score_avg=request.retrieval_score_avg,
        response_length=request.response_length,
        chunk_count=request.chunk_count,
        parent_trace_id=request.parent_trace_id,
        retrieval_quality=request.retrieval_quality,
        grounded=request.grounded,
        top_retrieval_score=request.top_retrieval_score,
        spans=request.spans,
        failure_types=request.failure_types,
        prompt_mode=request.prompt_mode,
        evaluation=request.evaluation or {},
        user_id=request.user_id,
        source=request.source,
        evaluator_version=request.evaluator_version or "1.0",
        prompt_version=request.prompt_version or "1.0",
        retriever_version=request.retriever_version or "vector_v1",
    )

    save_trace(trace)

    return {
        "status": "ok",
        "trace_id": trace.trace_id,
    }


@app.post("/events")
def receive_event(request: EventRequest):

    return {
        "status": "ok",
    }


@app.post("/ask")
def ask_question(request: QueryRequest):

    runner = PipelineRunner()

    return runner.run(
        request.query,
        prompt_mode=request.prompt_mode,
    )


@app.get("/analytics/failures")
def get_failures():

    return detect_failures()


@app.get("/traces")
def get_all_traces(retrieval_quality: str | None = None):

    return get_traces(retrieval_quality)


@app.delete("/traces")
def clear_all_traces():

    delete_all_traces()
    return {"status": "ok", "message": "All traces cleared."}


@app.delete("/traces/reset")
def reset_traces():

    delete_all_traces()
    return {"status": "ok", "message": "TracePilot reset complete."}


@app.get("/traces/compare")
def compare_traces(trace_id_1: str, trace_id_2: str):

    trace_1 = get_trace_by_id(trace_id_1)
    trace_2 = get_trace_by_id(trace_id_2)

    if isinstance(trace_1, dict):
        raise HTTPException(status_code=404, detail="First trace not found")

    if isinstance(trace_2, dict):
        raise HTTPException(status_code=404, detail="Second trace not found")

    return {
        "trace_1": {
            "trace_id": trace_1.trace_id,
            "model_name": trace_1.model_name,
            "latency": trace_1.latency,
            "retrieval_score_avg": trace_1.retrieval_score_avg,
            "response_length": trace_1.response_length,
            "chunk_count": trace_1.chunk_count,
        },
        "trace_2": {
            "trace_id": trace_2.trace_id,
            "model_name": trace_2.model_name,
            "latency": trace_2.latency,
            "retrieval_score_avg": trace_2.retrieval_score_avg,
            "response_length": trace_2.response_length,
            "chunk_count": trace_2.chunk_count,
        },
        "differences": {
            "latency_delta": round(trace_2.latency - trace_1.latency, 2),
            "retrieval_score_delta": round(
                trace_2.retrieval_score_avg - trace_1.retrieval_score_avg, 2
            ),
            "response_length_delta": trace_2.response_length - trace_1.response_length,
            "response_changed": trace_1.response != trace_2.response,
        },
    }


@app.get("/traces/{trace_id}")
def fetch_trace(trace_id: str):

    return get_trace_by_id(trace_id)


@app.post("/traces/{trace_id}/replay")
def replay_trace_endpoint(trace_id: str):

    result = run_replay(trace_id)

    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    return result
