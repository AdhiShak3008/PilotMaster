import uuid
import time
import faiss
import numpy as np
import pickle
import os
import re

from pilotcore.config import VECTOR_STORE_DIR
from pilotcore.retrieval.bm25 import (
    build_bm25,
    load_bm25,
    save_bm25,
)
from pilotcore.retrieval.embeddings import get_embedding, get_embeddings_batch
from pilotcore.schemas.chunk import Chunk
from pilotcore.schemas.retrieval import RetrievedChunk, RetrievalResult
from pilotcore.tracing.telemetry import emit_event

DEFAULT_DIMENSION = 768


def _get_model_slug(model_name: str | None) -> str:
    if not model_name:
        return "default"
    clean = re.sub(r"[^a-zA-Z0-9_-]", "_", model_name.split("/")[-1].lower())
    return clean


def get_user_vector_dir(user_id: int):
    user_dir = os.path.join(VECTOR_STORE_DIR, f"user_{user_id}")
    os.makedirs(user_dir, exist_ok=True)
    return user_dir


def get_index_path(user_id: int, model_name: str | None = None):
    slug = _get_model_slug(model_name)
    if slug == "default" or slug == "all_mpnet_base_v2":
        return os.path.join(get_user_vector_dir(user_id), "faiss.index")
    return os.path.join(get_user_vector_dir(user_id), f"faiss_{slug}.index")


def get_docs_path(user_id: int):
    return os.path.join(get_user_vector_dir(user_id), "documents.pkl")


def get_bm25_path(user_id: int):
    return os.path.join(
        get_user_vector_dir(user_id),
        "bm25.pkl",
    )


def load_user_index(user_id: int, dimension: int = DEFAULT_DIMENSION, model_name: str | None = None):
    index_path = get_index_path(user_id, model_name)
    if os.path.exists(index_path):
        try:
            index = faiss.read_index(index_path)
            if index.d == dimension:
                return index
        except Exception:
            pass
    return faiss.IndexFlatIP(dimension)


def load_user_documents(user_id: int):
    docs_path = get_docs_path(user_id)
    if os.path.exists(docs_path):
        try:
            with open(docs_path, "rb") as f:
                return pickle.load(f)
        except Exception:
            return []
    return []


def load_user_bm25(user_id: int):
    return load_bm25(get_bm25_path(user_id))


def save_index(user_id, index, documents, model_name: str | None = None):
    faiss.write_index(index, get_index_path(user_id, model_name))
    with open(get_docs_path(user_id), "wb") as f:
        pickle.dump(documents, f)

    try:
        bm25 = build_bm25(documents)
        if bm25 is not None:
            save_bm25(bm25, get_bm25_path(user_id))
    except Exception as e:
        print(f"BM25 save failed: {e}")


def add_chunks_batch(user_id, chunks: list[dict], embedding_model: str | None = None):
    """
    Fast batch insertion of document chunks into FAISS and BM25.
    """
    if not chunks:
        return

    texts = [chunk["text"] for chunk in chunks]
    embeddings = get_embeddings_batch(texts, embedding_model)
    if not embeddings:
        return

    dimension = len(embeddings[0])
    index = load_user_index(user_id, dimension=dimension, model_name=embedding_model)
    documents = load_user_documents(user_id)

    vectors = np.array(embeddings, dtype="float32")
    faiss.normalize_L2(vectors)
    index.add(vectors)

    for chunk in chunks:
        documents.append(
            {
                "document_id": chunk["document_id"],
                "text": chunk["text"],
                "source": chunk.get("source") or chunk.get("source_file"),
                "page": chunk.get("page"),
                "chunk_id": chunk.get("chunk_id"),
                "metadata": chunk.get("metadata") or {},
            }
        )

    save_index(user_id, index, documents, model_name=embedding_model)
    print(f"Batch saved {len(chunks)} chunks for user {user_id}. Total FAISS: {index.ntotal}")


def add_vector(
    user_id,
    embedding,
    text,
    source,
    page,
    chunk_id,
    document_id,
    metadata=None,
    embedding_model=None,
):
    dimension = len(embedding) if hasattr(embedding, "__len__") else DEFAULT_DIMENSION
    index = load_user_index(user_id, dimension=dimension, model_name=embedding_model)
    documents = load_user_documents(user_id)

    vector = np.array([embedding], dtype="float32")
    faiss.normalize_L2(vector)
    index.add(vector)

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
    save_index(user_id, index, documents, model_name=embedding_model)


def search_vectors(
    user_id,
    query_embedding,
    trace_id: str | None = None,
    source=None,
    document_ids=None,
    top_k=10,
    embedding_model=None,
):
    trace_id = trace_id or "default_trace"
    start_time = time.perf_counter()
    dimension = len(query_embedding) if hasattr(query_embedding, "__len__") else DEFAULT_DIMENSION
    index = load_user_index(user_id, dimension=dimension, model_name=embedding_model)
    documents = load_user_documents(user_id)

    if index.ntotal == 0 or len(documents) == 0:
        return RetrievalResult(
            trace_id=trace_id,
            query="embedding_query",
            retrieved_chunks=[],
            latency_ms=0,
            retriever_version="vector_v1",
        )


    vector = np.array([query_embedding], dtype="float32")
    faiss.normalize_L2(vector)

    search_k = min(index.ntotal, 100)
    similarities, indices = index.search(vector, search_k)

    retrieved_chunks = []
    doc_id_set = set(document_ids) if document_ids else None
    if doc_id_set:
        # Normalize to both string and int matching
        doc_id_set = {str(d) for d in doc_id_set}

    for rank, (similarity, idx) in enumerate(
        zip(similarities[0], indices[0]),
        start=1,
    ):
        if idx < 0 or idx >= len(documents):
            continue

        doc = documents[idx]
        doc_id = str(doc.get("document_id", ""))

        if doc_id_set and doc_id not in doc_id_set:
            continue

        if (
            source
            and not doc_id_set
            and not source.endswith("documents")
            and source != "All Documents"
            and source != doc.get("source")
        ):
            continue

        retrieved_chunks.append(
            RetrievedChunk(
                chunk=Chunk(
                    chunk_id=str(
                        doc.get(
                            "chunk_id",
                            f"{doc_id}_{idx}",
                        )
                    ),
                    document_id=doc_id,
                    user_id=str(user_id),
                    text=doc.get("text", ""),
                    source=doc.get("source"),
                    page_number=doc.get("page"),
                    metadata=doc.get("metadata", {}),
                ),
                score=float(similarity),
                dense_score=float(similarity),
                dense_rank=rank,
                retrieval_sources=["dense"],
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
    user_dir = get_user_vector_dir(user_id)
    if os.path.exists(user_dir):
        for f in os.listdir(user_dir):
            try:
                os.remove(os.path.join(user_dir, f))
            except Exception:
                pass
    print(f"Vector store reset for user {user_id}")


def rebuild_index_without_document(
    user_id: int,
    document_id: int,
    embedding_model: str | None = None,
):
    documents = load_user_documents(user_id)
    filtered_documents = [
        doc for doc in documents if str(doc.get("document_id")) != str(document_id)
    ]

    if not filtered_documents:
        reset_vector_store(user_id)
        return

    texts = [doc["text"] for doc in filtered_documents]
    embeddings = get_embeddings_batch(texts, embedding_model)
    dimension = len(embeddings[0]) if embeddings else DEFAULT_DIMENSION

    new_index = faiss.IndexFlatIP(dimension)
    if embeddings:
        vectors = np.array(embeddings, dtype="float32")
        faiss.normalize_L2(vectors)
        new_index.add(vectors)

    save_index(
        user_id,
        new_index,
        filtered_documents,
        model_name=embedding_model,
    )
    print(f"Rebuilt vector index for user {user_id} without document {document_id}")

