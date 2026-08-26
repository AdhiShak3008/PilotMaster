from pilotcore.retrieval.vector_store import add_chunks_batch
from pilotcore.runtime.pipeline import run_pipeline
from pilotcore.benchmarking.config_builder import (
    build_experiment_config,
)


def add_chunks(chunks, user_id, embedding_model=None):
    add_chunks_batch(user_id=user_id, chunks=chunks, embedding_model=embedding_model)


def ask_question(
    question,
    user_id,
    source=None,
    document_ids=None,
    model_name=None,
    retrieval_strategy=None,
    reranker=None,
    enhancements=None,
    mode="production",
    chunker=None,
    embedding_model=None,
    chat_history=None,
):
    print("RAG document_ids =", document_ids)
    print("\n===== FRONTEND VALUES =====")
    print("mode =", mode)
    print("enhancements =", enhancements)
    print("chunker =", chunker)
    print("embedding_model =", embedding_model)
    print("===========================\n")
    config = build_experiment_config(
        retrieval_strategy=retrieval_strategy,
        reranker=reranker,
        enhancements=enhancements,
        mode=mode,
        chunker=chunker,
        embedding_model=embedding_model,
    )


    print("\n===== EXPERIMENT CONFIG =====")
    print("mode               =", config.mode)
    print("retrieval_strategy =", retrieval_strategy)
    print("retrieval_method   =", config.retrieval_method)
    print("reranker           =", config.reranker)
    print("reranker_model     =", getattr(config, "reranker_model", None))

    print("query_rewrite      =", config.query_rewrite)
    print("hyde               =", config.hyde)
    print("multi_query        =", config.multi_query)
    print("query_expansion    =", config.query_expansion)

    print("parent_child       =", config.parent_child)
    print("contextual_ret     =", config.contextual_retrieval)
    print("graph_rag          =", config.graph_rag)

    print("context_compress   =", config.context_compression)
    print("=============================\n")

    trace = run_pipeline(
        query=question,
        user_id=user_id,
        source=source,
        document_ids=document_ids,
        model_name=model_name,
        experiment_config=config,
        chat_history=chat_history,
    )

    retrieved = (
        getattr(trace.retrieval_result, "retrieved_chunks", [])
        if trace.retrieval_result
        else []
    ) or []

    if not retrieved:
        return {
            "answer": getattr(trace, "final_response", None) or "No relevant context found.",
            "sources": [],
            "trace_id": getattr(trace, "trace_id", None),
        }

    sources = []
    seen = set()

    for item in retrieved:
        chunk_obj = getattr(item, "chunk", item)
        meta = getattr(chunk_obj, "metadata", {}) or {}
        
        source = (
            getattr(chunk_obj, "source", None)
            or meta.get("document_name")
            or meta.get("source_file")
            or meta.get("source")
            or "Document"
        )
        page = (
            getattr(chunk_obj, "page_number", None)
            or getattr(chunk_obj, "page", None)
            or meta.get("page")
            or meta.get("page_number")
        )

        key = (source, page)

        if key not in seen:
            seen.add(key)
            sources.append(
                {
                    "source": source,
                    "page": page,
                }
            )

    return {
        "answer": getattr(trace, "final_response", "No response generated."),
        "sources": sources,
        "trace_id": getattr(trace, "trace_id", None),
    }
