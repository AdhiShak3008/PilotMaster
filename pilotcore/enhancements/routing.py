import time
import json
import re
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)



def route_query(query: str) -> tuple[dict, TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        fallback_route = {"route": "general_knowledge", "confidence": 1.0, "reason": "empty query"}
        return fallback_route, TechniqueTrace(
            technique="query_routing",
            phase="Phase 3: Structure",
            input_text=query or "",
            output_text=fallback_route,
            latency_ms=0.0,
            status="success",
        )

    system_prompt = """You are an intelligent query routing engine for an enterprise document retrieval platform.
Analyze the query topic and assign the primary retrieval domain and confidence score.

Available routes:
- "financial_reports": corporate earnings, budgets, quarterly statements, revenue, costs, ROI, fiscal forecasts
- "technical_specifications": system architectures, API docs, code, infrastructure, database schemas, DevOps
- "legal_compliance": contracts, terms of service, privacy policies, regulatory frameworks, licenses, governance
- "operational_handbooks": HR policies, onboarding, employee guides, process workflows, standard operating procedures
- "general_knowledge": general summaries, cross-domain queries, comparative overviews

Return a valid JSON object:
{
  "route": "<selected_route>",
  "confidence": <float between 0.0 and 1.0>,
  "reasoning": "<concise 1-sentence explanation>"
}

Rules:
- Return ONLY the raw JSON object.
- Do NOT include markdown code blocks.
"""

    try:
        completion = client.chat.completions.create(
            model=GROQ_FAST_MODEL,
            temperature=0.0,

            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
        )
        content = completion.choices[0].message.content.strip()
        content = re.sub(r"^```json\s*", "", content)
        content = re.sub(r"^```\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

        try:
            route_info = json.loads(content)
            if not isinstance(route_info, dict) or "route" not in route_info:
                route_info = {"route": "general_knowledge", "confidence": 0.85, "reasoning": "Standard knowledge base retrieval"}
        except Exception:
            route_info = {"route": "general_knowledge", "confidence": 0.85, "reasoning": "Default route"}

        latency = (time.perf_counter() - start_time) * 1000
        return route_info, TechniqueTrace(
            technique="query_routing",
            phase="Phase 3: Structure",
            input_text=query,
            output_text=route_info,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        fallback = {"route": "general_knowledge", "confidence": 0.8, "reasoning": "Fallback routing"}
        return fallback, TechniqueTrace(
            technique="query_routing",
            phase="Phase 3: Structure",
            input_text=query,
            output_text=fallback,
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
