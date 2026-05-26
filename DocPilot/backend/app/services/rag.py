from pilotcore.retrieval.embeddings import get_embedding
from pilotcore.retrieval.vector_store import add_vector
from pilotcore.runtime.pipeline import run_pipeline


def add_chunks(chunks, user_id):
    for chunk in chunks:
        embedding = get_embedding(chunk["text"])
        add_vector(
            user_id=user_id,
            embedding=embedding,
            text=chunk["text"],
            source=chunk["source"],
            page=chunk["page"],
            chunk_id=chunk["chunk_id"],
            document_id=chunk["document_id"],
        )


def ask_question(question, user_id, source=None):
    trace = run_pipeline(
        query=question,
        user_id=user_id,
        source=source,
    )

    retrieved = trace.retrieval_result.retrieved_chunks

    if not retrieved:
        return {"answer": "No relevant context found.", "sources": []}

    sources = []
    seen = set()
    for item in retrieved:
        key = (item.chunk.source, item.chunk.page_number)
        if key not in seen:
            seen.add(key)
            sources.append({"source": item.chunk.source, "page": item.chunk.page_number})

    return {
        "answer": trace.final_response,
        "sources": sources,
    }
