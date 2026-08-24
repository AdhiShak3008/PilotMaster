from pydantic import BaseModel, Field, field_validator
from typing import Literal, List, Optional


class ExperimentConfig(BaseModel):

    mode: str = "production"
    model_name: Optional[str] = None
    retrieval_method: Literal[
        "vector",
        "lexical",
        "hybrid",
    ] = "hybrid"

    @field_validator("retrieval_method", mode="before")
    @classmethod
    def normalize_retrieval_method(cls, v):
        if not v:
            return "hybrid"
        v_str = str(v).strip().lower()
        if v_str in ("vector", "faiss", "dense"):
            return "vector"
        if v_str in ("lexical", "bm25", "sparse"):
            return "lexical"
        if v_str in ("hybrid", "rrf"):
            return "hybrid"
        return v_str

    # Multi-Select Query Enhancements Array
    enhancements: List[str] = Field(default_factory=list)

    # Context Enhancements
    query_condensation: bool = False
    coreference_resolution: bool = False
    query_rewrite: bool = False

    # Structuring & Routing Enhancements
    sub_query_generation: bool = False
    metadata_filter_extraction: bool = False
    query_routing: bool = False

    # Transformation & Expansion Enhancements
    step_back: bool = False
    keyword_expansion: bool = False
    query_expansion: bool = False
    multi_query: bool = False
    hyde: bool = False
    rag_fusion: bool = False

    # Fusion & Reranking
    rrf: bool = True
    reranker: bool = True
    reranker_model: str = "minilm"
    deduplication: bool = True

    # Retrieval Enhancements
    parent_child: bool = False
    contextual_retrieval: bool = False
    graph_rag: bool = False
    context_compression: bool = False

    # Chunking & Embeddings
    chunker: str = "parent_child"
    embedding_model: str = "all-mpnet-base-v2"

    experiment_name: str = "default"
    emit_trace: bool = True


