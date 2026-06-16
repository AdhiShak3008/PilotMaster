from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session
from fastapi import HTTPException
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

from sqlalchemy.orm import Session

from GaugePilot.backend.app.db.session import get_db

from GaugePilot.backend.app.models.benchmark_run import BenchmarkRun

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

    # Use the most recently uploaded document name (from DocPilot) as the benchmark run name.
    from DocPilot.backend.app.models.document import Document as PilotDocument

    uploaded_document = (
        db.query(PilotDocument)
        .filter(PilotDocument.owner_id == current_user.id)
        .order_by(PilotDocument.created_at.desc())
        .first()
    )

    benchmark_name = (
        uploaded_document.filename if uploaded_document else "Benchmark Run"
    )

    run = BenchmarkRun(
        owner_id=current_user.id,
        name=benchmark_name,
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


@router.get("/runs")
def get_benchmark_runs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    runs = (
        db.query(BenchmarkRun)
        .filter(BenchmarkRun.owner_id == current_user.id)
        .order_by(BenchmarkRun.created_at.desc())
        .all()
    )

    return runs


@router.delete("/runs/reset")
def reset_benchmark_runs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    (db.query(BenchmarkRun).filter(BenchmarkRun.owner_id == current_user.id).delete())

    db.commit()

    return {"message": "All benchmark runs deleted"}


@router.delete("/runs/{run_id}")
def delete_benchmark_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    run = (
        db.query(BenchmarkRun)
        .filter(
            BenchmarkRun.id == run_id,
            BenchmarkRun.owner_id == current_user.id,
        )
        .first()
    )

    if not run:
        raise HTTPException(
            status_code=404,
            detail="Benchmark run not found",
        )

    db.delete(run)
    db.commit()

    return {
        "message": "Benchmark deleted",
    }
