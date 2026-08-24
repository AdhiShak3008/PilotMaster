from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from groq import AuthenticationError

from sqlalchemy.orm import Session

from DocPilot.backend.app.services.rag import (
    ask_question,
)

from DocPilot.backend.app.core.dependencies import (
    get_current_user,
)

from DocPilot.backend.app.db.session import get_db

from DocPilot.backend.app.schemas.chat import ChatRequest

from DocPilot.backend.app.models.chat import (
    ChatSession,
    ChatMessage,
)
from DocPilot.backend.app.models.document import Document

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
            mode=query.mode,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        session_id = session.id

        # Associate documents uploaded during this new conversation staging to the created session
        if query.document_ids:
            db.query(Document).filter(
                Document.id.in_(query.document_ids),
                Document.owner_id == current_user.id,
                Document.session_id.is_(None),
            ).update({"session_id": session_id}, synchronize_session=False)
            db.commit()
        else:
            db.query(Document).filter(
                Document.owner_id == current_user.id,
                Document.session_id.is_(None),
            ).update({"session_id": session_id}, synchronize_session=False)
            db.commit()


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
            document_ids=query.document_ids,
            model_name=query.model_name,
            retrieval_strategy=query.retrieval_strategy,
            reranker=query.reranker,
            enhancements=query.enhancements,
            mode=query.mode,
            chunker=query.chunker,
            embedding_model=query.embedding_model,
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
        "trace_id": rag_response.get("trace_id"),
    }
