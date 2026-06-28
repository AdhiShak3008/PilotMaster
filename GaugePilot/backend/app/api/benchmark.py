from fastapi import APIRouter, Depends
from DocPilot.backend.app.models.document import (
    Document as PilotDocument,
)
from sqlalchemy.orm import Session
from fastapi import HTTPException
import json
from dataclasses import asdict
from GaugePilot.backend.app.core.dependencies import (
    get_current_user,
)

from GaugePilot.backend.app.schemas.benchmark import (
    BenchmarkRequest,
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


from GaugePilot.backend.app.db.session import get_db

from GaugePilot.backend.app.models.benchmark_run import BenchmarkRun
from pilotcore.benchmarking.analysis_service import (
    generate_deterministic_analysis,
    generate_ai_analysis,
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
    analysis = generate_deterministic_analysis(results, leaderboard)

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
            row = asdict(result)

            if row["config_name"] not in existing_names:
                existing_results.append(row)

        all_results = [BenchmarkResult(**r) for r in existing_results]

        leaderboard = generate_leaderboard(all_results)
        analysis = generate_deterministic_analysis(
            all_results,
            leaderboard,
        )
        existing_run.results_json = json.dumps(existing_results)

        existing_run.leaderboard_json = json.dumps(leaderboard)

        existing_run.analysis_json = json.dumps(analysis.dict())

        db.commit()
        db.refresh(existing_run)

        run = existing_run
        results_to_return = all_results
    else:
        serialized_results = [asdict(r) for r in results]

        run = BenchmarkRun(
            owner_id=current_user.id,
            name=benchmark_name,
            results_json=json.dumps(serialized_results),
            leaderboard_json=json.dumps(leaderboard),
            analysis_json=json.dumps(analysis.dict()),
        )

        db.add(run)
        db.commit()
        db.refresh(run)
        results_to_return = results
    return {
        "benchmark_run_id": run.id,
        "results": [asdict(r) for r in results_to_return],
        "leaderboard": leaderboard,
        "analysis": analysis.dict(),
    }


@router.post("/runs/{run_id}/generate-analysis")
def generate_ai_analysis_endpoint(
    run_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
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

    results = [BenchmarkResult(**r) for r in json.loads(run.results_json or "[]")]

    leaderboard = json.loads(run.leaderboard_json or "{}")

    analysis = generate_ai_analysis(
        results=results,
        leaderboard=leaderboard,
    )

    run.analysis_json = json.dumps(analysis.model_dump())

    db.commit()
    db.refresh(run)

    return {
        "message": "AI analysis generated successfully",
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

    return [
        {
            "id": run.id,
            "name": run.name,
            "created_at": run.created_at,
            "results": json.loads(run.results_json or "[]"),
            "leaderboard": json.loads(run.leaderboard_json or "{}"),
            "analysis": json.loads(run.analysis_json or "{}"),
        }
        for run in runs
    ]


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
