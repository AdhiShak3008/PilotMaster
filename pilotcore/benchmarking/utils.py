import json
import re


def parse_config_descriptor(config_name: str, index: int = None) -> dict:
    if not config_name:
        label = f"Config {index + 1}" if index is not None else "Config"
        return {
            "label": label,
            "model": "Standard LLM",
            "retrieval": "Hybrid (Dense + BM25)",
            "reranker": "None",
            "enhancements": ["Default"],
            "display_name": label,
            "raw_signature": "unknown",
        }

    lower = config_name.lower().replace("_", " ")
    label = f"Config {index + 1}" if index is not None else "Config"

    # Model detection
    model = "GPT-OSS 120B"
    if "llama-3.3-70b" in lower or "llama 3.3 70b" in lower or "llama3" in lower:
        model = "Llama 3.3 70B"
    elif "gpt-oss-120b" in lower or "gpt oss 120b" in lower or "gptoss" in lower:
        model = "GPT-OSS 120B"
    elif "gemini-1.5-flash" in lower or "gemini" in lower:
        model = "Gemini 1.5 Flash"
    elif "mixtral" in lower:
        model = "Mixtral 8x7B"

    # Retrieval strategy
    retrieval = "Hybrid (Dense + BM25)"
    if "vector only" in lower or ("vector" in lower and "hybrid" not in lower):
        retrieval = "Vector (Dense FAISS)"
    elif "lexical" in lower or ("bm25" in lower and "hybrid" not in lower):
        retrieval = "Lexical (BM25 Keyword)"
    elif "hybrid" in lower:
        retrieval = "Hybrid (Dense + BM25)"

    # Reranker
    reranker = "None"
    if "minilm" in lower:
        reranker = "MiniLM Cross-Encoder"
    elif "tinybert" in lower:
        reranker = "TinyBERT (Low-Latency)"
    elif "bge-large" in lower or "bge large" in lower:
        reranker = "BGE Large Cross-Encoder"
    elif "bge-m3" in lower or "bge m3" in lower:
        reranker = "BGE M3 Reranker"
    elif "none" in lower or "noreranker" in lower:
        reranker = "None (Direct First-Stage)"

    # Enhancements
    enhancements = []
    if "query rewrite" in lower: enhancements.append("Query Rewrite")
    if "multi query" in lower: enhancements.append("Multi-Query")
    if "hyde" in lower: enhancements.append("HyDE")
    if "step back" in lower: enhancements.append("Step-Back")
    if "query expansion" in lower: enhancements.append("Query Expansion")
    if "sub query" in lower: enhancements.append("Sub-Query")
    if "metadata" in lower: enhancements.append("Metadata Filtering")
    if "routing" in lower: enhancements.append("Intent Routing")
    if "graph" in lower: enhancements.append("GraphRAG")
    if "compression" in lower: enhancements.append("Context Compression")

    if not enhancements:
        enhancements.append("Default (Baseline)")

    display_name = f"{label} ({model} · {retrieval} · {reranker} · {', '.join(enhancements)})"

    return {
        "label": label,
        "model": model,
        "retrieval": retrieval,
        "reranker": reranker,
        "enhancements": enhancements,
        "display_name": display_name,
        "raw_signature": config_name,
    }


def clean_json_response(response: str) -> dict:
    if not response or not isinstance(response, str):
        raise ValueError("Empty or invalid response from LLM generator")

    text = response.strip()

    # Remove markdown code blocks
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Match outermost { ... }
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise
