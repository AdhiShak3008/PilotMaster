from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.models.chat import (
    ChatSession,
    ChatMessage,
)

from app.core.dependencies import (
    get_current_user,
)

router = APIRouter()


@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.owner_id == current_user.id)
        .order_by(ChatSession.id.desc())
        .all()
    )

    return sessions


@router.get("/{session_id}")
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.owner_id == current_user.id,
        )
        .first()
    )

    if not session:

        return {"detail": "Session not found"}

    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).all()

    return messages


@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.owner_id == current_user.id,
        )
        .first()
    )

    if not session:

        return {"detail": "Session not found"}

    db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()

    db.delete(session)

    db.commit()

    return {"message": "Chat deleted"}
