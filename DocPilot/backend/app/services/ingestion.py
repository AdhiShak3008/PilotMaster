from pypdf import PdfReader

from pdf2image import convert_from_path

from docx import Document

import pandas as pd

import markdown

import pytesseract

from PIL import Image

import os
import time
import requests

from DocPilot.backend.app.services.rag import add_chunks

from pilotcore.config import TRACEPILOT_URL

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
POPPLER_PATH = r"C:\Users\Adhi\Desktop\poppler-26.02.0\Library\bin"


def chunk_text(
    text,
    chunk_size=500,
    overlap=80,
):

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        if end < len(text):

            sentence_end = text.rfind(".", start, end)

            newline_end = text.rfind("\n", start, end)

            boundary = max(sentence_end, newline_end)

            if boundary != -1 and boundary > start:

                end = boundary + 1

        chunk = text[start:end].strip()

        if chunk:

            chunks.append(chunk)

        start = end - overlap

        if start < 0:

            start = 0

    return chunks


def extract_pdf_text(
    file_path,
):

    reader = PdfReader(file_path)

    full_text = ""

    for page in reader.pages:

        text = page.extract_text() or ""

        full_text += text + "\n"

    return full_text


def extract_pdf_ocr(
    file_path,
):

    images = convert_from_path(
        file_path,
        poppler_path=POPPLER_PATH,
    )

    text = ""

    for image in images:

        text += pytesseract.image_to_string(image)

    return text


def extract_docx_text(
    file_path,
):

    doc = Document(file_path)

    return "\n".join(para.text for para in doc.paragraphs)


def extract_txt_text(
    file_path,
):

    with open(
        file_path,
        "r",
        encoding="utf-8",
    ) as f:

        return f.read()


def extract_md_text(
    file_path,
):

    with open(
        file_path,
        "r",
        encoding="utf-8",
    ) as f:

        return markdown.markdown(f.read())


def extract_csv_text(
    file_path,
):

    df = pd.read_csv(file_path)

    return df.to_string()


def extract_xlsx_text(
    file_path,
):

    df = pd.read_excel(file_path)

    return df.to_string()


def extract_image_text(
    file_path,
):

    image = Image.open(file_path)

    return pytesseract.image_to_string(image)


def extract_text(
    file_path,
):

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":

        text = extract_pdf_text(file_path)

        if len(text.strip()) < 10:

            print("OCR triggered")

            text = extract_pdf_ocr(file_path)

        return text

    elif ext == ".docx":

        return extract_docx_text(file_path)

    elif ext == ".txt":

        return extract_txt_text(file_path)

    elif ext == ".md":

        return extract_md_text(file_path)

    elif ext == ".csv":

        return extract_csv_text(file_path)

    elif ext == ".xlsx":

        return extract_xlsx_text(file_path)

    elif ext in [
        ".png",
        ".jpg",
        ".jpeg",
    ]:

        return extract_image_text(file_path)

    else:

        raise Exception("Unsupported file type")


def process_document(
    file_path,
    user_id,
    document_id,
):

    start_time = time.perf_counter()

    text = extract_text(file_path)

    text = " ".join(text.split())

    if len(text.split()) < 5:
        return

    chunks = chunk_text(text)

    all_chunks = [
        {
            "document_id": document_id,
            "text": chunk,
            "source": os.path.basename(file_path),
            "page": 1,
            "chunk_id": i,
        }
        for i, chunk in enumerate(chunks)
    ]

    add_chunks(all_chunks, user_id)

    latency_ms = (time.perf_counter() - start_time) * 1000

    try:
        resp = requests.post(
            f"{TRACEPILOT_URL}/tracepilot/ingest/document",
            json={
                "document_id": str(document_id),
                "user_id": str(user_id),
                "filename": os.path.basename(file_path),
                "chunk_count": len(all_chunks),
                "char_count": len(text),
                "latency_ms": round(latency_ms, 2),
                "status": "success",
            },
            timeout=5,
        )

        print(f"[TracePilot] document ingest status={resp.status_code}")
        print(f"[TracePilot] response={resp.text}")

    except Exception as e:
        print(f"[TracePilot] document ingest failed: {repr(e)}")
