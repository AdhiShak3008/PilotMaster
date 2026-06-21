from dataclasses import dataclass


@dataclass
class ExperimentConfig:
    name: str

    model: str | None = None
    retriever: str
    reranker: str
    enhancements: list[str] = []
    evaluator: str
