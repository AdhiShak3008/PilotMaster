import time
import json
import re
from groq import Groq
from pilotcore.config import GROQ_API_KEY, GROQ_FAST_MODEL
from pilotcore.enhancements.models import TechniqueTrace

client = Groq(api_key=GROQ_API_KEY)


def extract_metadata_filters(query: str) -> tuple[dict, TechniqueTrace]:
    start_time = time.perf_counter()
    if not query:
        return {}, TechniqueTrace(
            technique="metadata_filter_extraction",
            phase="Phase 3: Structure",
            input_text=query or "",
            output_text={},
            latency_ms=0.0,
            status="success",
        )

    system_prompt = """You are a structured metadata extraction engine for document retrieval.
Analyze the user's query and extract any explicit or strongly implied metadata filters.

Return a valid JSON object with the following fields (omit null/empty keys or set to null):
- "date_from": ISO date string (YYYY-MM-DD) or quarter representation if specified
- "date_to": ISO date string (YYYY-MM-DD)
- "category": topic or document category (e.g. "finance", "engineering", "legal", "hr", "architecture")
- "author": person or creator name if mentioned
- "department": organization unit if mentioned
- "file_type": document type (e.g. "pdf", "docx", "csv", "json") if requested

Rules:
- Return ONLY the raw JSON object.
- Do NOT include markdown code fences (no ```json).
- If no metadata filters can be extracted, return {}
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
        # Clean JSON fences if present
        content = re.sub(r"^```json\s*", "", content)
        content = re.sub(r"^```\s*", "", content)
        content = re.sub(r"\s*```$", "", content)
        
        try:
            filters = json.loads(content)
            if not isinstance(filters, dict):
                filters = {}
        except Exception:
            filters = {}

        # Remove null values for cleanliness
        filters = {k: v for k, v in filters.items() if v is not None and v != ""}

        latency = (time.perf_counter() - start_time) * 1000
        return filters, TechniqueTrace(
            technique="metadata_filter_extraction",
            phase="Phase 3: Structure",
            input_text=query,
            output_text=filters,
            latency_ms=latency,
            status="success",
        )
    except Exception as e:
        latency = (time.perf_counter() - start_time) * 1000
        return {}, TechniqueTrace(
            technique="metadata_filter_extraction",
            phase="Phase 3: Structure",
            input_text=query,
            output_text={},
            latency_ms=latency,
            status="fallback",
            error_message=str(e),
        )
