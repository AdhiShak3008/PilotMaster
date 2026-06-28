import json

SYSTEM_PROMPT = """
You are a senior Retrieval-Augmented Generation (RAG) engineer.

You are reviewing the outcome of a RAG benchmark.

You are provided:

- Benchmark metrics
- Leaderboard summary
- Structured deterministic findings
- Deterministic diagnoses
- Deterministic recommendations

Your task is to produce engineering recommendations.

Requirements:

- Base every statement only on the supplied information.
- Treat deterministic findings as factual evidence.
- Prioritize engineering impact.
- Do not invent benchmark results.
- Do not recommend unsupported optimizations.
- Keep recommendations concise and actionable.

Return ONLY valid JSON.

{
    "executive_recommendation":"string",

    "priority_actions":[
        "string"
    ],

    "pipeline_optimizations":[
        "string"
    ],

    "next_experiment":"string",

    "production_readiness":"string"
}
"""


def build_recommendation_prompt(
    leaderboard,
    results,
    insights,
    diagnoses,
    recommendations,
):
    prompt = {
        "leaderboard_summary": {
            "best_overall": (
                leaderboard["overall"][0]["config_name"]
                if leaderboard.get("overall")
                else None
            ),
        },
        "benchmark_results": [
            {
                "configuration": r.config_name,
                "metrics": {
                    "grounding": round(r.semantic_grounding, 4),
                    "faithfulness": round(r.faithfulness, 4),
                    "coverage": round(
                        r.semantic_query_coverage,
                        4,
                    ),
                    "retrieval_quality": round(
                        r.retrieval_quality_score,
                        4,
                    ),
                    "latency_ms": round(r.latency, 2),
                    "grounded_rate": round(
                        r.grounded_rate,
                        4,
                    ),
                    "abstain_rate": round(
                        r.abstain_rate,
                        4,
                    ),
                },
            }
            for r in results
        ],
        "findings": [
            {
                "category": i.category,
                "title": i.title,
                "configuration": i.configuration,
                "metadata": i.metadata,
            }
            for i in insights
        ],
        "diagnoses": [
            {
                "issue": d.issue,
                "causes": d.causes,
            }
            for d in diagnoses
        ],
        "recommendations": [
            {
                "title": r.title,
                "description": r.description,
                "configuration": r.configuration,
            }
            for r in recommendations
        ],
    }

    return json.dumps(prompt)
