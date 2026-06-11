from pydantic import BaseModel
from typing import Literal


class ExperimentConfig(BaseModel):
    retrieval_method: Literal[
        "vector",
        "lexical",
        "hybrid",
    ] = "hybrid"

    query_rewrite: bool = False

    rrf: bool = True
    reranker: bool = True
    deduplication: bool = True
    # Experimental enhancements
    hyde: bool = False
    multi_query: bool = False
    context_compression: bool = False
    experiment_name: str = "default"
