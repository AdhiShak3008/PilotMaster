from fastapi import APIRouter, Depends

from DocPilot.backend.app.core.dependencies import (
    get_current_user,
)

from DocPilot.backend.app.schemas.benchmark import (
    BenchmarkRequest,
)

from pilotcore.benchmarking.benchmark_runner import (
    run_benchmark,
)

from pilotcore.benchmarking.leaderboard import (
    generate_leaderboard,
)

from pilotcore.runtime.experiment_config import (
    ExperimentConfig,
)

router = APIRouter()


@router.post("/run")
def run_benchmark_endpoint(
    request: BenchmarkRequest,
    current_user=Depends(get_current_user),
):

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
        ExperimentConfig(
            experiment_name="Hybrid_NoRewrite",
            retrieval_method="hybrid",
            reranker=True,
            reranker_model="minilm",
            query_rewrite=False,
        ),
        ExperimentConfig(
            experiment_name="Hybrid_NoReranker",
            retrieval_method="hybrid",
            reranker=False,
        ),
        ExperimentConfig(
            experiment_name="Vector_Only",
            retrieval_method="vector",
            reranker=True,
            reranker_model="minilm",
        ),
    ]

    results = run_benchmark(
        questions=request.questions,
        configs=configs,
        user_id=current_user.id,
        source=request.source,
    )

    leaderboard = generate_leaderboard(results)

    return {"leaderboard": leaderboard}
