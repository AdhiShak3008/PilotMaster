from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey

from sqlalchemy.sql import func

from DocPilot.backend.app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    filename = Column(String, nullable=False)

    filepath = Column(String, nullable=False)

    file_size = Column(Integer)

    page_count = Column(Integer)

    chunk_count = Column(Integer)

    ocr_used = Column(Boolean, default=False)

    status = Column(String, default="processed")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
