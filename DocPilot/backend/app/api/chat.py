from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from groq import AuthenticationError

from sqlalchemy.orm import Session

from app.services.rag import (
    ask_question,
)

from app.core.dependencies import (
    get_current_user,
)

from app.db.session import get_db

from app.schemas.chat import ChatRequest

from app.models.chat import (
    ChatSession,
    ChatMessage,
)

router = APIRouter()


@router.post("/ask")
def ask(
    query: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    session_id = query.session_id

    if not session_id:

        session = ChatSession(
            owner_id=current_user.id,
            title=query.question.strip()[:40],
        )

        db.add(session)

        db.commit()

        db.refresh(session)

        session_id = session.id

    user_message = ChatMessage(
        session_id=session_id,
        role="user",
        content=query.question,
    )

    db.add(user_message)

    db.commit()

    try:
        rag_response = ask_question(
            question=query.question,
            user_id=current_user.id,
            source=query.source,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=502,
            detail="Groq authentication failed. Check GROQ_API_KEY in .env and restart the server.",
        ) from exc

    assistant_message = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=rag_response["answer"],
    )

    db.add(assistant_message)

    db.commit()

    return {
        "session_id": session_id,
        "answer": rag_response["answer"],
        "sources": rag_response["sources"],
    }
