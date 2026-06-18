from pilotcore.retrieval.embeddings import get_embedding
from pilotcore.retrieval.vector_store import add_vector
from pilotcore.runtime.pipeline import run_pipeline
from pilotcore.benchmarking.config_builder import (
    build_experiment_config,
)


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
    mode="production",
):
    config = build_experiment_config(
        retrieval_strategy=retrieval_strategy,
        reranker=reranker,
        enhancements=enhancements,
        mode=mode,
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
        model_name=model_name,
        experiment_config=config,
    )

    retrieved = trace.retrieval_result.retrieved_chunks

    if not retrieved:
        return {
            "answer": "No relevant context found.",
            "sources": [],
        }

    sources = []
    seen = set()

    for item in retrieved:

        key = (
            item.chunk.source,
            item.chunk.page_number,
        )

        if key not in seen:
            seen.add(key)

            sources.append(
                {
                    "source": item.chunk.source,
                    "page": item.chunk.page_number,
                }
            )

    return {
        "answer": trace.final_response,
        "sources": sources,
        "trace_id": trace.trace_id,
    }
