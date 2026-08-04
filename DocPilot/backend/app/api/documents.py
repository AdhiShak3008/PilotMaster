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
import uuid

from DocPilot.backend.app.services.ingestion import (
    process_document,
    TextExtractionError,
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
    files: list[UploadFile] = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    document_count = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .count()
    )

    if (
        current_user.plan == "free"
        and document_count + len(files) > 3
    ):
        raise HTTPException(
            status_code=403,
            detail="Free plan upload limit reached.",
        )

    allowed_extensions = [
        ".pdf",
        ".docx",
        ".pptx",
        ".txt",
        ".md",
        ".csv",
        ".xlsx",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".java",
        ".cpp",
        ".c",
        ".h",
        ".go",
        ".rs",
        ".json",
        ".yaml",
        ".yml",
        ".sql",
        ".css",
        ".html",
    ]

    upload_dir = os.path.join(
        "storage",
        f"user_{current_user.id}",
    )

    os.makedirs(
        upload_dir,
        exist_ok=True,
    )

    uploaded_documents = []
    failed_documents = []

    for file in files:

        file_ext = os.path.splitext(file.filename)[1].lower()

        if file_ext not in allowed_extensions:

            failed_documents.append(
                {
                    "filename": file.filename,
                    "detail": "Unsupported file type.",
                }
            )

            continue

        unique_filename = (
            f"{uuid.uuid4()}_{file.filename}"
        )

        file_path = os.path.join(
            upload_dir,
            unique_filename,
        )

        with open(file_path, "wb") as buffer:

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

        try:

            process_document(
                file_path,
                current_user.id,
                document.id,
                mime_type=file.content_type,
            )

        except TextExtractionError as exc:

            db.delete(document)
            db.commit()

            if os.path.exists(file_path):
                os.remove(file_path)

            failed_documents.append(
                {
                    "filename": file.filename,
                    "detail": str(exc),
                }
            )

            continue

        uploaded_documents.append(
            {
                "document_id": document.id,
                "filename": document.filename,
            }
        )

    return {
        "message": (
            f"{len(uploaded_documents)} document(s) uploaded, "
            f"{len(failed_documents)} failed."
        ),
        "uploaded": uploaded_documents,
        "failed": failed_documents,
    }


@router.get(
    "/",
    response_model=list[DocumentResponse],
)
def get_documents(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .all()
    )

    return documents


@router.delete("/reset")
def reset_documents(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    reset_vector_store(current_user.id)

    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .all()
    )

    for document in documents:

        if os.path.exists(document.filepath):
            os.remove(document.filepath)

    db.query(Document).filter(
        Document.owner_id == current_user.id
    ).delete()

    db.commit()

    return {
        "message": "Vector store and documents cleared.",
    }


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