from pilotcore.runtime.pipeline import run_pipeline
from pilotcore.runtime.experiment_config import ExperimentConfig

run_pipeline(
    query="what kind of projects has he done",
    user_id=2,
    experiment_config=ExperimentConfig(retrieval_method="hybrid"),
)
