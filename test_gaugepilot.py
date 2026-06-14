from pilotcore.benchmarking.benchmark_runner import run_benchmark
from pilotcore.benchmarking.leaderboard import generate_leaderboard
from pilotcore.runtime.experiment_config import ExperimentConfig

configs = [
    ExperimentConfig(
        experiment_name="Hybrid+MiniLM",
        retrieval_method="hybrid",
        reranker=True,
        reranker_model="minilm",
    ),
    ExperimentConfig(
        experiment_name="BM25",
        retrieval_method="lexical",
        reranker=False,
    ),
]

questions = [
    "What is attention?",
    "Explain self-attention",
]

results = run_benchmark(
    questions=questions,
    configs=configs,
    user_id="test",
    source="attention.pdf",
)

leaderboard = generate_leaderboard(results)

for rank, result in enumerate(leaderboard, start=1):
    print(rank, result.config_name)
