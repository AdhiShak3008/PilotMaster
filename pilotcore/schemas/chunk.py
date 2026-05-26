from pydantic import BaseModel
from typing import Optional, Dict, Any


class Chunk(BaseModel):
    chunk_id: str
    document_id: str
    user_id: str

    text: str

    source: Optional[str] = None
    page_number: Optional[int] = None

    embedding_model: Optional[str] = None
    embedding_version: Optional[str] = None

    metadata: Dict[str, Any] = {}
