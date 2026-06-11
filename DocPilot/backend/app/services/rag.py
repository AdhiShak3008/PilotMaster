from pilotcore.retrieval.embeddings import get_embedding
from pilotcore.retrieval.vector_store import add_vector
from pilotcore.runtime.pipeline import run_pipeline
from pilotcore.runtime.experiment_config import ExperimentConfig


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
            metadata=chunk.get("metadata"),
        )


def ask_question(
    question,
    user_id,
    source=None,
    model_name=None,
    retrieval_strategy=None,
    reranker=None,
    enhancements=None,
):
    config = ExperimentConfig()

    if retrieval_strategy:

        strategy_map = {
            "FAISS": "vector",
            "BM25": "lexical",
            "Hybrid": "hybrid",
        }

        if reranker:

            if reranker == "none":
                config.reranker = False

            else:
                config.reranker = True
                config.reranker_model = reranker

        if enhancements:

            config.query_rewrite = False
            if "Query Rewrite" in enhancements:
                config.query_rewrite = True

            if "HyDE" in enhancements:
                config.hyde = True

            if "Multi Query" in enhancements:
                config.multi_query = True

            if "Context Compression" in enhancements:
                config.context_compression = True
    selected = strategy_map.get(retrieval_strategy)

    if selected:
        config.retrieval_method = selected
    print("\n===== EXPERIMENT CONFIG =====")
    print("retrieval_strategy =", retrieval_strategy)
    print("retrieval_method   =", config.retrieval_method)
    print("reranker           =", config.reranker)
    print("reranker_model     =", config.reranker_model)
    print("hyde               =", config.hyde)
    print("multi_query        =", config.multi_query)
    print("compression        =", config.context_compression)
    print("=============================\n")
    trace = run_pipeline(
        query=question,
        user_id=user_id,
        source=source,
        model_name=model_name,
        experiment_config=config,
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
            sources.append(
                {"source": item.chunk.source, "page": item.chunk.page_number}
            )

    return {
        "answer": trace.final_response,
        "sources": sources,
        "trace_id": trace.trace_id,
    }
