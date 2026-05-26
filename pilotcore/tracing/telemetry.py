import requests
from pilotcore.config import TRACEPILOT_URL


def emit_event(event_type: str, payload: dict):
    try:
        requests.post(
            f"{TRACEPILOT_URL}/tracepilot/events",
            json={"event_type": event_type, "payload": payload},
            timeout=1,
        )
    except Exception:
        pass
