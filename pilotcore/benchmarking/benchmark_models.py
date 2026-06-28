from dataclasses import dataclass


@dataclass
class BenchmarkResult:
    config_name: str

    faithfulness: float = 0.0
    semantic_grounding: float = 0.0
    semantic_query_coverage: float = 0.0
    retrieval_quality_score: float = 0.0

    latency: float = 0.0

    grounded_rate: float = 0.0
    abstain_rate: float = 0.0
