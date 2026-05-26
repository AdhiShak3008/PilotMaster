from datetime import datetime

from pilotcore.schemas.span import Span


def start_span(
    trace_id: str,
    name: str,
):

    return Span(
        span_id=f"{trace_id}:{name}",
        trace_id=trace_id,
        name=name,
        start_time=datetime.utcnow(),
    )


def end_span(span: Span):

    span.end_time = datetime.utcnow()

    return span
