from datetime import datetime

from pilotcore.schemas.trace import Trace


def create_trace(
    trace_id: str,
    user_query: str,
):

    return Trace(
        trace_id=trace_id,
        user_query=user_query,
        created_at=datetime.utcnow(),
    )
