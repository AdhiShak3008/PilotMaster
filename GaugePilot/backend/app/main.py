from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from .api import benchmark
from .api import documents

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(benchmark.router, prefix="/benchmark", tags=["benchmark"])

app.include_router(
    documents.router,
    prefix="/docs",
)


@app.get("/")
def root():
    return {"status": "running", "service": "gaugepilot"}
