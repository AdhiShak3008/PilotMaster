import sys
import os
import importlib.util
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def load_app(app_path: str, app_module: str, attr: str):
    """Load a FastAPI app from a path without polluting sys.path."""
    # Temporarily set sys.path to the specific backend dir
    original_path = sys.path.copy()
    sys.path.insert(0, app_path)

    # Remove any cached 'app' module to avoid collisions
    to_remove = [k for k in sys.modules if k == "app" or k.startswith("app.")]
    for k in to_remove:
        del sys.modules[k]

    spec = importlib.util.spec_from_file_location(
        app_module,
        os.path.join(app_path, "app", "main.py"),
        submodule_search_locations=[os.path.join(app_path, "app")]
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[app_module] = module
    spec.loader.exec_module(module)

    sys.path = original_path
    return getattr(module, attr)


DOCPILOT_BACKEND = os.path.join(os.path.dirname(__file__), "DocPilot", "backend")
TRACEPILOT_BACKEND = os.path.join(os.path.dirname(__file__), "TracePilot", "backend")

docpilot_app = load_app(DOCPILOT_BACKEND, "docpilot_app", "app")
tracepilot_app = load_app(TRACEPILOT_BACKEND, "tracepilot_app", "app")

app = FastAPI(title="PilotMaster")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/docpilot", docpilot_app)
app.mount("/tracepilot", tracepilot_app)


@app.get("/")
def root():
    return {
        "platform": "PilotMaster",
        "services": {
            "docpilot": "/docpilot",
            "tracepilot": "/tracepilot",
        }
    }
