from pydantic import BaseModel


class BenchmarkResult(BaseModel):
    config_name: str

    faithfulness: float
    semantic_grounding: float
    semantic_query_coverage: float
    retrieval_quality_score: float

    latency: float

    grounded_rate: float
    abstain_rate: float
