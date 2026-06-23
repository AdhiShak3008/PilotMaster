from .insights.aggregator import aggregate
from .insights.insights_engine import generate_insights

from .recommendations.diagnostics_engine import (
    generate_diagnoses,
)

from .recommendations.recommendation_engine import (
    generate_recommendations,
)

from .recommendations.llm_summarizer import (
    generate_llm_summary,
)

from .schemas.analysis import BenchmarkAnalysis


def generate_benchmark_analysis(
    results,
    leaderboard,
):

    aggregated = aggregate(results)

    insights = generate_insights(
        results,
        aggregated,
    )

    diagnoses = generate_diagnoses(
        results,
    )

    recommendations = generate_recommendations(
        results,
    )

    llm_summary = generate_llm_summary(
        leaderboard,
        insights,
        diagnoses,
        recommendations,
    )

    return BenchmarkAnalysis(
        insights=insights,
        diagnoses=diagnoses,
        recommendations=recommendations,
        llm_summary=llm_summary,
    )
