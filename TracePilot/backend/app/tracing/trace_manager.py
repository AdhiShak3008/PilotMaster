import json

from TracePilot.backend.app.db.database import get_connection
from TracePilot.backend.app.models.trace import Trace, RetrievedChunk


def save_trace(trace: Trace):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
    INSERT INTO traces (
        trace_id, query, retrieved_chunks, prompt, response, latency,
        timestamp, model_name, retrieval_score_avg, response_length,
        chunk_count, parent_trace_id, retrieval_quality, grounded,
        top_retrieval_score, spans, failure_types, prompt_mode, evaluation,
        user_id, source, evaluator_version, prompt_version, retriever_version
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """,
        (
            trace.trace_id,
            trace.query,
            json.dumps([chunk.dict() for chunk in trace.retrieved_chunks]),
            trace.prompt,
            trace.response,
            trace.latency,
            str(trace.timestamp),
            trace.model_name,
            trace.retrieval_score_avg,
            trace.response_length,
            trace.chunk_count,
            trace.parent_trace_id,
            trace.retrieval_quality,
            trace.grounded,
            trace.top_retrieval_score,
            json.dumps(trace.spans),
            json.dumps(trace.failure_types),
            trace.prompt_mode,
            json.dumps(trace.evaluation),
            trace.user_id,
            trace.source,
            trace.evaluator_version,
            trace.prompt_version,
            trace.retriever_version,
        ),
    )

    conn.commit()
    conn.close()


def _row_to_trace(row) -> Trace:
    return Trace(
        trace_id=row["trace_id"],
        query=row["query"],
        retrieved_chunks=[
            RetrievedChunk(**chunk) for chunk in json.loads(row["retrieved_chunks"])
        ],
        prompt=row["prompt"],
        response=row["response"],
        latency=row["latency"],
        timestamp=row["timestamp"],
        model_name=row["model_name"],
        retrieval_score_avg=row["retrieval_score_avg"],
        response_length=row["response_length"],
        chunk_count=row["chunk_count"],
        parent_trace_id=row["parent_trace_id"],
        retrieval_quality=row["retrieval_quality"],
        grounded=row["grounded"],
        top_retrieval_score=row["top_retrieval_score"],
        spans=json.loads(row["spans"] or "[]"),
        failure_types=json.loads(row["failure_types"] or "[]"),
        prompt_mode=row["prompt_mode"] or "strict",
        evaluation=json.loads(row["evaluation"] or "{}"),
        user_id=row["user_id"],
        source=row["source"],
        evaluator_version=row["evaluator_version"] or "1.0",
        prompt_version=row["prompt_version"] or "1.0",
        retriever_version=row["retriever_version"] or "vector_v1",
    )


def get_traces(retrieval_quality=None):

    conn = get_connection()
    cursor = conn.cursor()

    if retrieval_quality:
        cursor.execute(
            "SELECT * FROM traces WHERE retrieval_quality = %s ORDER BY timestamp DESC",
            (retrieval_quality,),
        )
    else:
        cursor.execute("SELECT * FROM traces ORDER BY timestamp DESC")

    rows = cursor.fetchall()
    conn.close()

    return [_row_to_trace(row) for row in rows]


def get_trace_by_id(trace_id: str):

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM traces WHERE trace_id = %s", (trace_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"error": "Trace not found"}

    return _row_to_trace(row)


def delete_all_traces():

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ingestion_traces")
    cursor.execute("DELETE FROM traces")
    conn.commit()
    conn.close()


def get_trace(trace_id: str) -> dict | None:

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM traces WHERE trace_id = %s", (trace_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "trace_id": row["trace_id"],
        "query": row["query"],
        "retrieved_chunks": json.loads(row["retrieved_chunks"]),
        "prompt": row["prompt"],
        "response": row["response"],
        "latency": row["latency"],
        "timestamp": row["timestamp"],
        "model_name": row["model_name"],
        "retrieval_score_avg": row["retrieval_score_avg"],
        "response_length": row["response_length"],
        "chunk_count": row["chunk_count"],
        "parent_trace_id": row["parent_trace_id"],
        "retrieval_quality": row["retrieval_quality"],
        "grounded": row["grounded"],
        "top_retrieval_score": row["top_retrieval_score"],
        "spans": json.loads(row["spans"] or "[]"),
        "failure_types": json.loads(row["failure_types"] or "[]"),
        "user_id": row["user_id"],
        "source": row["source"],
        "evaluator_version": row["evaluator_version"] or "1.0",
        "prompt_version": row["prompt_version"] or "1.0",
        "retriever_version": row["retriever_version"] or "vector_v1",
    }
