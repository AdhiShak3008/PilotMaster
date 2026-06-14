from dataclasses import dataclass


@dataclass
class ExperimentConfig:
    name: str

    model: str
    retriever: str
    reranker: str
    enhancement: str
    evaluator: str
