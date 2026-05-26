from pydantic import BaseModel


class ChatRequest(BaseModel):

    question: str

    source: str | None = None

    session_id: int | None = None
