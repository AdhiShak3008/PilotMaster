from sqlalchemy import (
    Column,
    Integer,
    Text,
    String,
    ForeignKey,
    DateTime,
)

from sqlalchemy.sql import func

from DocPilot.backend.app.db.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    title = Column(
        String,
        default="New Chat",
    )

    mode = Column(
        String,
        nullable=False,
        default="production",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    session_id = Column(
        Integer,
        ForeignKey("chat_sessions.id"),
        nullable=False,
    )

    role = Column(
        Text,
        nullable=False,
    )

    content = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
