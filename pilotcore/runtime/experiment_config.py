from pydantic import BaseModel
from typing import Literal


class ExperimentConfig(BaseModel):

    mode: str = "production"

    retrieval_method: Literal[
        "vector",
        "lexical",
        "hybrid",
    ] = "hybrid"

    query_rewrite: bool = True

    rrf: bool = True

    reranker: bool = True
    reranker_model: str = "minilm"

    deduplication: bool = True

    # Query Enhancements
    hyde: bool = False
    multi_query: bool = False
    query_expansion: bool = False

    # Retrieval Enhancements
    parent_child: bool = False
    contextual_retrieval: bool = False
    graph_rag: bool = False

    # Context Enhancements
    context_compression: bool = False

    experiment_name: str = "default"
    emit_trace: bool = True
