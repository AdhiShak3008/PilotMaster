import uuid
import time
import faiss
import numpy as np
import pickle
import os

from pilotcore.config import VECTOR_STORE_DIR
from pilotcore.retrieval.bm25 import (
    build_bm25,
    load_bm25,
    save_bm25,
)
from pilotcore.retrieval.embeddings import get_embedding
from pilotcore.schemas.chunk import Chunk
from pilotcore.schemas.retrieval import RetrievedChunk, RetrievalResult
from pilotcore.tracing.telemetry import emit_event

DIMENSION = 768


def get_user_vector_dir(user_id: int):

    user_dir = os.path.join(VECTOR_STORE_DIR, f"user_{user_id}")

    os.makedirs(user_dir, exist_ok=True)

    return user_dir


def get_index_path(user_id: int):

    return os.path.join(get_user_vector_dir(user_id), "faiss.index")


def get_docs_path(user_id: int):

    return os.path.join(get_user_vector_dir(user_id), "documents.pkl")


def get_bm25_path(user_id: int):

    return os.path.join(
        get_user_vector_dir(user_id),
        "bm25.pkl",
    )


def load_user_index(user_id: int):

    index_path = get_index_path(user_id)

    if os.path.exists(index_path):

        return faiss.read_index(index_path)

    # Using normalized embeddings + IndexFlatIP approximates cosine similarity.
    # Higher scores now mean better semantic similarity.
    return faiss.IndexFlatIP(DIMENSION)


def load_user_documents(user_id: int):

    docs_path = get_docs_path(user_id)

    if os.path.exists(docs_path):

        with open(docs_path, "rb") as f:
            return pickle.load(f)

    return []


def load_user_bm25(user_id: int):

    return load_bm25(get_bm25_path(user_id))


def save_index(user_id, index, documents):

    faiss.write_index(index, get_index_path(user_id))

    with open(get_docs_path(user_id), "wb") as f:

        pickle.dump(documents, f)

    try:
        bm25 = build_bm25(documents)

        save_bm25(
            bm25,
            get_bm25_path(user_id),
        )

    except Exception as e:
        print(f"BM25 save failed: {e}")


def add_vector(
    user_id,
    embedding,
    text,
    source,
    page,
    chunk_id,
    document_id,
    metadata=None,
):

    index = load_user_index(user_id)

    documents = load_user_documents(user_id)

    vector = np.array([embedding], dtype="float32")

    # Defensive normalization at the FAISS boundary.
    # Embeddings are already normalized upstream, but this guarantees
    # unit-length vectors before insertion.
    faiss.normalize_L2(vector)

    index.add(vector)

    print("FAISS INDEX SIZE:", index.ntotal)

    documents.append(
        {
            "document_id": document_id,
            "text": text,
            "source": source,
            "page": page,
            "chunk_id": chunk_id,
            "metadata": metadata or {},
        }
    )
    save_index(user_id, index, documents)


def search_vectors(
    user_id,
    query_embedding,
    trace_id: str,
    source=None,
    top_k=10,
):

    start_time = time.perf_counter()

    index = load_user_index(user_id)

    documents = load_user_documents(user_id)

    if index.ntotal == 0:

        return RetrievalResult(
            trace_id=trace_id,
            query="embedding_query",
            retrieved_chunks=[],
            latency_ms=0,
            retriever_version="vector_v1",
        )

    vector = np.array([query_embedding], dtype="float32")

    # Normalize query vector before cosine similarity search.
    faiss.normalize_L2(vector)

    # With IndexFlatIP + normalized vectors:
    # higher score = higher cosine similarity
    similarities, indices = index.search(vector, min(index.ntotal, 100))

    retrieved_chunks = []

    for similarity, idx in zip(similarities[0], indices[0]):

        if idx >= len(documents):
            continue

        doc = documents[idx]

        if source:

            if source != doc["source"]:
                continue

        retrieved_chunks.append(
            RetrievedChunk(
                chunk=Chunk(
                    chunk_id=str(
                        doc.get(
                            "chunk_id",
                            uuid.uuid4(),
                        )
                    ),
                    document_id=str(
                        doc.get(
                            "document_id",
                            "unknown_document",
                        )
                    ),
                    user_id=str(user_id),
                    text=doc["text"],
                    source=doc.get("source"),
                    page_number=doc.get("page"),
                    metadata=doc.get("metadata", {}),
                ),
                score=float(similarity),
            )
        )

        if len(retrieved_chunks) >= top_k:
            break

    latency_ms = (time.perf_counter() - start_time) * 1000

    emit_event(
        "vector_retrieval.completed",
        {
            "trace_id": trace_id,
            "latency_ms": latency_ms,
            "retrieved_chunks": len(retrieved_chunks),
            "user_id": user_id,
        },
    )

    return RetrievalResult(
        trace_id=trace_id,
        query="embedding_query",
        retrieved_chunks=retrieved_chunks,
        latency_ms=latency_ms,
        retriever_version="vector_v1",
    )


def reset_vector_store(user_id: int):

    index_path = get_index_path(user_id)

    docs_path = get_docs_path(user_id)

    bm25_path = get_bm25_path(user_id)

    if os.path.exists(index_path):
        os.remove(index_path)

    if os.path.exists(docs_path):
        os.remove(docs_path)

    if os.path.exists(bm25_path):
        os.remove(bm25_path)

    print(f"Vector store reset for user {user_id}")


def rebuild_index_without_document(
    user_id: int,
    document_id: int,
):

    documents = load_user_documents(user_id)

    filtered_documents = [doc for doc in documents if doc["document_id"] != document_id]

    new_index = faiss.IndexFlatIP(DIMENSION)

    for doc in filtered_documents:

        embedding = get_embedding(doc["text"])

        vector = np.array([embedding], dtype="float32")

        faiss.normalize_L2(vector)

        new_index.add(vector)

    save_index(
        user_id,
        new_index,
        filtered_documents,
    )

    print(f"Rebuilt vector index for user {user_id} " f"without document {document_id}")
