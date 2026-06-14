from dataclasses import dataclass


@dataclass
class BenchmarkResult:
    config_name: str

    grounding: float
    faithfulness: float
    relevancy: float
    retrieval_quality: float
    answerability: float

    latency: float
    abstain_rate: float
