from pydantic import BaseModel
from typing import Optional


class Citation(BaseModel):
    chunk_id: str

    document_id: str

    quoted_text: Optional[str] = None
