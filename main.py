from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from DocPilot.backend.app.main import app as docpilot_app
from TracePilot.backend.app.main import app as tracepilot_app

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
        },
    }
