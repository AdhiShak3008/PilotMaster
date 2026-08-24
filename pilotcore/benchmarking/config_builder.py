from pilotcore.runtime.experiment_config import ExperimentConfig
from pilotcore.enhancements.orchestrator import EnhancementOrchestrator


def build_experiment_config(
    retrieval_strategy=None,
    reranker=None,
    enhancements=None,
    mode="production",
    chunker=None,
    embedding_model=None,
):
    config = ExperimentConfig()

    config.mode = mode
    if chunker:
        config.chunker = chunker
    if embedding_model:
        config.embedding_model = embedding_model

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

    # Reset all enhancement flags
    config.query_condensation = False
    config.coreference_resolution = False
    config.query_rewrite = False
    config.sub_query_generation = False
    config.metadata_filter_extraction = False
    config.query_routing = False
    config.step_back = False
    config.keyword_expansion = False
    config.query_expansion = False
    config.multi_query = False
    config.hyde = False
    config.rag_fusion = False

    config.parent_child = False
    config.contextual_retrieval = False
    config.graph_rag = False
    config.context_compression = False

    if enhancements:
        normalized = EnhancementOrchestrator.normalize_enhancements(enhancements)
        config.enhancements = normalized

        if "query_condensation" in normalized:
            config.query_condensation = True
        if "coreference_resolution" in normalized:
            config.coreference_resolution = True
        if "query_rewrite" in normalized:
            config.query_rewrite = True
        if "sub_query_generation" in normalized:
            config.sub_query_generation = True
        if "metadata_filter_extraction" in normalized:
            config.metadata_filter_extraction = True
        if "query_routing" in normalized:
            config.query_routing = True
        if "step_back" in normalized:
            config.step_back = True
        if "keyword_expansion" in normalized:
            config.keyword_expansion = True
            config.query_expansion = True
        if "multi_query" in normalized:
            config.multi_query = True
        if "hyde" in normalized:
            config.hyde = True
        if "rag_fusion" in normalized:
            config.rag_fusion = True

    return config

