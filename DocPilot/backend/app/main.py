from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from DocPilot.backend.app.api import (
    chat,
    documents,
    auth,
    billing,
    models,
    benchmark,
)

from DocPilot.backend.app.db.database import (
    engine,
    Base,
)

from DocPilot.backend.app.models import (
    User,
    Document,
    ChatSession,
    ChatMessage,
)
from DocPilot.backend.app.api import history

# Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(chat.router, prefix="/chat")

app.include_router(documents.router, prefix="/docs")

app.include_router(auth.router, prefix="/auth")

app.include_router(billing.router, prefix="/billing")
app.include_router(history.router, prefix="/history")
app.include_router(models.router, prefix="/models", tags=["models"])
app.include_router(
    benchmark.router,
    prefix="/benchmark",
    tags=["benchmark"],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():

    return {
        "status": "running",
    }
