from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

import shutil
import os

from DocPilot.backend.app.services.ingestion import (
    process_document,
)

from pilotcore.retrieval.vector_store import (
    reset_vector_store,
    rebuild_index_without_document,
)

from DocPilot.backend.app.core.dependencies import (
    get_current_user,
)

from DocPilot.backend.app.db.session import get_db

from DocPilot.backend.app.models.document import Document

from DocPilot.backend.app.schemas.document import (
    DocumentResponse,
)

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    document_count = (
        db.query(Document).filter(Document.owner_id == current_user.id).count()
    )

    if current_user.plan == "free" and document_count >= 3:

        raise HTTPException(
            status_code=403,
            detail="Free plan upload limit reached.",
        )

    os.makedirs(
        "temp",
        exist_ok=True,
    )

    allowed_extensions = [
        ".pdf",
        ".docx",
        ".txt",
        ".md",
        ".csv",
        ".xlsx",
        ".png",
        ".jpg",
        ".jpeg",
    ]

    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail="Unsupported file type.",
        )

    file_path = f"temp/{file.filename}"

    with open(
        file_path,
        "wb",
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer,
        )

    document = Document(
        owner_id=current_user.id,
        filename=file.filename,
        filepath=file_path,
        file_size=os.path.getsize(file_path),
    )

    db.add(document)

    db.commit()

    db.refresh(document)

    process_document(
        file_path,
        current_user.id,
        document.id,
    )

    return {
        "message": "Document uploaded",
        "document_id": document.id,
    }


@router.get(
    "/",
    response_model=list[DocumentResponse],
)
def get_documents(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    documents = db.query(Document).filter(Document.owner_id == current_user.id).all()

    return documents


@router.delete("/reset")
def reset_documents(
    current_user=Depends(get_current_user),
):

    reset_vector_store(current_user.id)

    return {"message": "Vector store cleared."}


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.owner_id == current_user.id,
        )
        .first()
    )

    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    if os.path.exists(document.filepath):

        os.remove(document.filepath)

    rebuild_index_without_document(
        current_user.id,
        document.id,
    )

    db.delete(document)

    db.commit()

    return {
        "message": "Document deleted",
    }
