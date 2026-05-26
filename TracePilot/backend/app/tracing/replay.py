from app.tracing.trace_manager import get_trace


def replay_trace(trace_id: str):

    original_trace = get_trace(trace_id)

    if not original_trace:
        return {"error": "Trace not found"}

    from pilotcore.runtime.pipeline import run_pipeline

    trace = run_pipeline(
        query=original_trace["query"],
        user_id=original_trace.get("user_id"),
        source=original_trace.get("source"),
    )

    return {
        "trace_id": trace.trace_id,
        "query": trace.user_query,
        "response": trace.final_response,
        "parent_trace_id": trace_id,
    }
