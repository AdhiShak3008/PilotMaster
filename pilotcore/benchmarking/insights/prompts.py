import json
from pilotcore.benchmarking.utils import parse_config_descriptor

SYSTEM_PROMPT = """
You are a Principal AI Systems Architect and Lead RAG Evaluation Engineer at an enterprise AI lab.

You are evaluating a comprehensive benchmark performed across multiple Retrieval-Augmented Generation (RAG) pipeline configurations.

Your responsibility is to deliver a rigorous, highly quantitative, executive-grade Engineering Insight Report.

Key Guidelines:
1. Always reference configurations by their clean name and identifier: e.g., "Config 1 (GPT-OSS 120B · Vector FAISS)", "Config 2 (Llama 3.3 70B)", "Config 3 (Hybrid + MiniLM)". NEVER output raw machine underscores or cryptic filenames.
2. Be highly quantitative: cite exact numerical metric values (Faithfulness, Grounding, Coverage, Retrieval Quality, Latency in ms), percentage margins, and performance tradeoffs.
3. Structure your response into:
   - "executive_insight": A high-level, authoritative synthesis for engineering leadership explaining the core architectural lessons of the benchmark.
   - "strengths": List 2 to 4 proven architectural advantages, high grounding/faithfulness accomplishments, and low-latency triumphs with exact scores.
   - "weaknesses": List 2 to 4 distinct latency bottlenecks, reranker overheads, retrieval drops, or context dilution failure modes.
   - "engineering_observations": List 2 to 4 deep architectural observations explaining the underlying mechanics (e.g., impact of dense vs hybrid retrieval, cross-encoder reranking cost-benefit, query expansion overhead).
   - "benchmark_takeaway": A decisive, high-impact concluding recommendation on the winning pipeline architecture.

Return ONLY valid JSON matching this schema:
{
  "executive_insight": "string",
  "strengths": [
    "string"
  ],
  "weaknesses": [
    "string"
  ],
  "engineering_observations": [
    "string"
  ],
  "benchmark_takeaway": "string"
}
"""


def build_insight_prompt(
    results,
    findings,
    aggregated,
):
    descriptors = [parse_config_descriptor(r.config_name, i) for i, r in enumerate(results)]

    benchmark_rows = []
    for i, r in enumerate(results):
        desc = descriptors[i]
        benchmark_rows.append({
            "config_id": desc["label"],
            "config_display": desc["display_name"],
            "model": desc["model"],
            "retrieval_strategy": desc["retrieval"],
            "reranker": desc["reranker"],
            "enhancements": desc["enhancements"],
            "faithfulness": round(r.faithfulness, 4),
            "semantic_grounding": round(r.semantic_grounding, 4),
            "retrieval_quality": round(r.retrieval_quality_score, 4),
            "semantic_query_coverage": round(r.semantic_query_coverage, 4),
            "latency_ms": round(r.latency, 2),
            "grounded_rate": round(r.grounded_rate, 4),
            "abstain_rate": round(r.abstain_rate, 4),
        })

    prompt = {
        "benchmark_evaluations": benchmark_rows,
        "benchmark_aggregates": {
            "averages": aggregated.get("averages", {}),
            "ranges": aggregated.get("ranges", {}),
        },
        "deterministic_findings": [
            {
                "category": f.category,
                "title": f.title,
                "configuration": f.configuration,
                "metadata": f.metadata,
            }
            for f in findings
        ],
    }

    return json.dumps(prompt, indent=2)
