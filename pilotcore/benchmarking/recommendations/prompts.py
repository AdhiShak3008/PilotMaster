import json
from pilotcore.benchmarking.utils import parse_config_descriptor

SYSTEM_PROMPT = """
You are a Principal AI Infrastructure Architect and Lead Production RAG Engineer.

You are evaluating benchmark evaluation results across multiple RAG configurations to deliver an actionable, production-grade Engineering Recommendation Report.

Key Guidelines:
1. Always reference configurations by their clean name and identifier: e.g. "Config 1 (GPT-OSS 120B · Vector)", "Config 2 (Llama 3.3 70B)", "Config 3 (Hybrid + MiniLM)". NEVER use raw underscores or machine filenames.
2. Prioritize production reality: Latency SLA budgets (<800ms for real-time interactive apps), accuracy thresholds (Grounding >0.70, Faithfulness >0.75), and cost/token efficiency.
3. Structure your response into:
   - "executive_recommendation": High-level strategic recommendation for production deployment, summarizing the optimal balance of accuracy and latency.
   - "priority_actions": 2 to 4 immediate, high-priority engineering tasks (e.g. tuning top-k, implementing asynchronous query expansion, caching hot embeddings).
   - "pipeline_optimizations": 2 to 4 concrete algorithmic and indexing optimizations (e.g. adjusting BM25 vs dense hybrid weighting, cross-encoder batching, parent-child chunk boundary tuning).
   - "next_experiment": A specific, hypothesis-driven benchmark blueprint to run next (e.g. testing context compression and HyDE query rewriting on Config 1).
   - "production_readiness": An authoritative production deployment verdict with SLA compliance status (e.g. "PRODUCTION READY: Config 1 achieves 0.83 faithfulness with 540ms latency, meeting strict <800ms SLA requirements with high statistical confidence.").

Return ONLY valid JSON matching this schema:
{
    "executive_recommendation": "string",
    "priority_actions": [
        "string"
    ],
    "pipeline_optimizations": [
        "string"
    ],
    "next_experiment": "string",
    "production_readiness": "string"
}
"""


def build_recommendation_prompt(
    leaderboard,
    results,
    insights,
    diagnoses,
    recommendations,
):
    best_config_raw = None
    if leaderboard and isinstance(leaderboard, dict) and leaderboard.get("overall"):
        best_config_raw = leaderboard["overall"][0].get("config_name")

    best_desc = parse_config_descriptor(best_config_raw) if best_config_raw else None

    benchmark_rows = []
    for i, r in enumerate(results):
        desc = parse_config_descriptor(r.config_name, i)
        benchmark_rows.append({
            "config_id": desc["label"],
            "config_display": desc["display_name"],
            "model": desc["model"],
            "retrieval_strategy": desc["retrieval"],
            "reranker": desc["reranker"],
            "enhancements": desc["enhancements"],
            "metrics": {
                "faithfulness": round(r.faithfulness, 4),
                "semantic_grounding": round(r.semantic_grounding, 4),
                "retrieval_quality": round(r.retrieval_quality_score, 4),
                "semantic_query_coverage": round(r.semantic_query_coverage, 4),
                "latency_ms": round(r.latency, 2),
                "grounded_rate": round(r.grounded_rate, 4),
                "abstain_rate": round(r.abstain_rate, 4),
            },
        })

    prompt = {
        "leaderboard_summary": {
            "top_ranked_pipeline": best_desc["display_name"] if best_desc else "Config 1",
        },
        "benchmark_results": benchmark_rows,
        "deterministic_findings": [
            {
                "category": getattr(i, "category", ""),
                "title": getattr(i, "title", ""),
                "configuration": getattr(i, "configuration", ""),
            }
            for i in insights
        ],
        "diagnoses": [
            {
                "issue": getattr(d, "issue", ""),
                "causes": getattr(d, "causes", []),
            }
            for d in diagnoses
        ],
        "deterministic_recommendations": [
            {
                "title": getattr(r, "title", ""),
                "description": getattr(r, "description", ""),
                "configuration": getattr(r, "configuration", ""),
            }
            for r in recommendations
        ],
    }

    return json.dumps(prompt, indent=2)
