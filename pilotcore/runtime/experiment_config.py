from pydantic import BaseModel
from typing import Literal


class ExperimentConfig(BaseModel):
    retrieval_method: Literal[
        "vector",
        "lexical",
        "hybrid",
    ] = "hybrid"

    query_rewrite: bool = True

    rrf: bool = True
    reranker: bool = True
    deduplication: bool = True

    experiment_name: str = "default"
