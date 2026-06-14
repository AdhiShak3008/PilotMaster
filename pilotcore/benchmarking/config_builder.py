from pilotcore.runtime.experiment_config import (
    ExperimentConfig,
)


def build_experiment_config(
    retrieval_strategy=None,
    reranker=None,
    enhancements=None,
    mode="production",
):
    config = ExperimentConfig()

    config.mode = mode

    if mode != "experimental":
        return config

    strategy_map = {
        "FAISS": "vector",
        "BM25": "lexical",
        "Hybrid": "hybrid",
    }

    selected = strategy_map.get(retrieval_strategy)

    if selected:
        config.retrieval_method = selected

    if reranker == "none":
        config.reranker = False

    elif reranker:
        config.reranker = True
        config.reranker_model = reranker

    config.query_rewrite = False
    config.hyde = False
    config.multi_query = False
    config.context_compression = False

    if enhancements:

        if "Query Rewrite" in enhancements:
            config.query_rewrite = True

        if "HyDE" in enhancements:
            config.hyde = True

        if "Multi Query" in enhancements:
            config.multi_query = True

        if "Context Compression" in enhancements:
            config.context_compression = True

    return config
