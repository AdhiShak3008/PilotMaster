from typing import List

from benchmarking.schemas.result import BenchmarkResult


def generate_overall_leaderboard(results: List[BenchmarkResult]):
    return sorted(
        results,
        key=lambda r: (
            r.grounding
            + r.faithfulness
            + r.relevancy
            + r.retrieval_quality
            + r.answerability
        ),
        reverse=True,
    )
