import requests
from pilotcore.config import TRACEPILOT_URL


def emit_event(event_type: str, payload: dict):
    try:
        resp = requests.post(
            f"{TRACEPILOT_URL}/tracepilot/events",
            json={"event_type": event_type, "payload": payload},
            timeout=5,
        )
        print(f"[TracePilot] events status={resp.status_code}")
        print(f"[TracePilot] events response={resp.text}")
    except Exception as e:
        print(f"[TracePilot] events failed: {repr(e)}")
