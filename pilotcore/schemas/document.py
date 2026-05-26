from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentMetadata(BaseModel):
    document_id: str

    user_id: str

    filename: str

    uploaded_at: datetime

    file_type: Optional[str] = None
