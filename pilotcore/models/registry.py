MODELS = [
    {
        "id": "openai/gpt-oss-120b",
        "label": "GPT-OSS 120B",
        "subtitle": "High-Intelligence Frontier LLM",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "openai/gpt-oss-20b",
        "label": "GPT-OSS 20B",
        "subtitle": "Ultra-Fast & Efficient RAG Engine",
        "provider": "groq",
        "category": "fast",
    },
    {
        "id": "qwen/qwen3.6-27b",
        "label": "Qwen 3.6 27B",
        "subtitle": "High-Precision Reasoning & Vision",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "deepseek-r1-distill-llama-70b",
        "label": "DeepSeek R1 70B",
        "subtitle": "Advanced Chain-of-Thought Reasoning",
        "provider": "groq",
        "category": "reasoning",
    },
]


def get_models():
    return MODELS


SUPPORTED_MODELS = {
    model["id"]: {
        "provider": model["provider"],
        "display_name": model["label"],
    }
    for model in MODELS
}

# Compatibility aliases
SUPPORTED_MODELS["gpt-oss-120b"] = SUPPORTED_MODELS["openai/gpt-oss-120b"]
SUPPORTED_MODELS["gpt-oss-20b"] = SUPPORTED_MODELS["openai/gpt-oss-20b"]
SUPPORTED_MODELS["qwen-3.6-27b"] = SUPPORTED_MODELS["qwen/qwen3.6-27b"]
SUPPORTED_MODELS["deepseek-r1"] = SUPPORTED_MODELS["deepseek-r1-distill-llama-70b"]


