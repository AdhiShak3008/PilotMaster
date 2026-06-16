from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

import json

from GaugePilot.backend.app.core.dependencies import (
    get_current_user,
)

from GaugePilot.backend.app.schemas.benchmark import (
    BenchmarkRequest,
)

from GaugePilot.backend.app.db.session import (
    get_db,
)

from GaugePilot.backend.app.models.benchmark_run import (
    BenchmarkRun,
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
    db: Session = Depends(get_db),
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
        source=None,
    )

    leaderboard = generate_leaderboard(results)

    run = BenchmarkRun(
        owner_id=current_user.id,
        name="Benchmark Run",
        leaderboard_json=json.dumps(leaderboard),
    )

    db.add(run)
    db.commit()
    db.refresh(run)

    return {
        "benchmark_run_id": run.id,
        "leaderboard": leaderboard,
    }


@router.get("/runs")
def get_runs(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    runs = (
        db.query(BenchmarkRun)
        .filter(BenchmarkRun.owner_id == current_user.id)
        .order_by(BenchmarkRun.created_at.desc())
        .all()
    )

    return runs
