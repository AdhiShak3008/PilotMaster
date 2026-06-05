MODELS = [
    {
        "id": "llama-3.1-8b-instant",
        "label": "Llama 3.1 8B",
        "subtitle": "Fast & Efficient",
        "provider": "groq",
        "category": "fast",
    },
    {
        "id": "llama-3.3-70b-versatile",
        "label": "Llama 3.3 70B",
        "subtitle": "Best Overall",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "meta-llama/llama-4-scout-17b-16e-instruct",
        "label": "Llama 4 Scout",
        "subtitle": "Large Context Window",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "qwen/qwen3-32b",
        "label": "Qwen 3 32B",
        "subtitle": "Reasoning & Analysis",
        "provider": "groq",
        "category": "reasoning",
    },
    {
        "id": "openai/gpt-oss-20b",
        "label": "GPT OSS 20B",
        "subtitle": "Fast Reasoning",
        "provider": "groq",
        "category": "reasoning",
    },
    {
        "id": "openai/gpt-oss-120b",
        "label": "GPT OSS 120B",
        "subtitle": "Deep Reasoning",
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
