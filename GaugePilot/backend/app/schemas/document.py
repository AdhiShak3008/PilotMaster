from pydantic import BaseModel
from datetime import datetime


class DocumentResponse(BaseModel):
    id: int

    filename: str

    filepath: str

    file_size: int | None = None

    page_count: int | None = None

    chunk_count: int | None = None

    ocr_used: bool

    status: str

    created_at: datetime

    class Config:
        from_attributes = True
