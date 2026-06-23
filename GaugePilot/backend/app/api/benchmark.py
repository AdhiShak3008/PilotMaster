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
from pilotcore.benchmarking.benchmark_models import BenchmarkResult

from pilotcore.benchmarking.leaderboard import (
    generate_leaderboard,
)

from pilotcore.runtime.experiment_config import (
    ExperimentConfig,
)

from sqlalchemy.orm import Session

from GaugePilot.backend.app.db.session import get_db

from GaugePilot.backend.app.models.benchmark_run import BenchmarkRun
from pilotcore.benchmarking.analysis_service import (
    generate_benchmark_analysis,
)

router = APIRouter()


@router.post("/run")
def run_benchmark_endpoint(
    request: BenchmarkRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enhancements = request.enhancements or []

    enhancement_name = (
        "_".join(sorted(request.enhancements)) if request.enhancements else "Default"
    )

    experiment_name = (
        f"{request.model}_"
        f"{request.retrieval_method}_"
        f"{request.reranker}_"
        f"{enhancement_name}"
    )

    config = ExperimentConfig(
        experiment_name=experiment_name,
        retrieval_method=request.retrieval_method,
    )

    # Optional model benchmarking
    if getattr(request, "model", None):
        config.model_name = request.model

    # Reranker
    if request.reranker == "none":
        config.reranker = False
    else:
        config.reranker = True
        config.reranker_model = request.reranker

    # Enhancements
    enhancements = {e.lower().replace(" ", "_") for e in enhancements}

    if "all" in enhancements:
        config.query_rewrite = True
        config.hyde = True
        config.multi_query = True
        config.query_expansion = True
    else:
        config.query_rewrite = "query_rewrite" in enhancements

        config.hyde = "hyde" in enhancements

        config.multi_query = "multi_query" in enhancements

        config.query_expansion = "query_expansion" in enhancements
    results = run_benchmark(
        questions=request.questions,
        configs=[config],
        user_id=current_user.id,
        source=None,
    )

    leaderboard = generate_leaderboard(results)
    analysis = generate_benchmark_analysis(results, leaderboard)
    from DocPilot.backend.app.models.document import (
        Document as PilotDocument,
    )

    uploaded_document = (
        db.query(PilotDocument)
        .filter(PilotDocument.owner_id == current_user.id)
        .order_by(PilotDocument.created_at.desc())
        .first()
    )

    benchmark_name = (
        uploaded_document.filename if uploaded_document else experiment_name
    )

    existing_run = (
        db.query(BenchmarkRun)
        .filter(
            BenchmarkRun.owner_id == current_user.id,
            BenchmarkRun.name == benchmark_name,
        )
        .first()
    )

    if existing_run:
        existing_results = json.loads(existing_run.results_json or "[]")

        existing_names = {r["config_name"] for r in existing_results}

        for result in results:
            row = result.model_dump()

            if row["config_name"] not in existing_names:
                existing_results.append(row)

        all_results = [BenchmarkResult(**r) for r in existing_results]

        leaderboard = generate_leaderboard(all_results)
        analysis = generate_benchmark_analysis(
            all_results,
            leaderboard,
        )
        existing_run.results_json = json.dumps(existing_results)

        existing_run.leaderboard_json = json.dumps(leaderboard)

        db.commit()
        db.refresh(existing_run)

        run = existing_run

    else:
        serialized_results = [r.model_dump() for r in results]

        run = BenchmarkRun(
            owner_id=current_user.id,
            name=benchmark_name,
            results_json=json.dumps(serialized_results),
            leaderboard_json=json.dumps(leaderboard),
        )

        db.add(run)
        db.commit()
        db.refresh(run)

    return {
        "benchmark_run_id": run.id,
        "leaderboard": leaderboard,
        "analysis": analysis.model_dump(),
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
