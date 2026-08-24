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
        "subtitle": "High-Precision Reasoning & Context",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "llama-3.3-70b-versatile",
        "label": "Llama 3.3 70B",
        "subtitle": "Best Overall & Intelligence",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "llama-3.1-8b-instant",
        "label": "Llama 3.1 8B",
        "subtitle": "Ultra-fast & Efficient",
        "provider": "groq",
        "category": "fast",
    },

    {
        "id": "llama-3.2-3b-preview",
        "label": "Llama 3.2 3B",
        "subtitle": "Compact & Fast",
        "provider": "groq",
        "category": "fast",
    },
    {
        "id": "llama-3.2-1b-preview",
        "label": "Llama 3.2 1B",
        "subtitle": "Ultra-compact Edge",
        "provider": "groq",
        "category": "fast",
    },
    {
        "id": "llama-3.2-11b-vision-preview",
        "label": "Llama 3.2 11B Vision",
        "subtitle": "Multimodal & Vision Capable",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "mixtral-8x7b-32768",
        "label": "Mixtral 8x7B",
        "subtitle": "32k High-Speed MoE",
        "provider": "groq",
        "category": "general",
    },
    {
        "id": "gemma2-9b-it",
        "label": "Gemma 2 9B",
        "subtitle": "Google Efficient Instruction",
        "provider": "groq",
        "category": "fast",
    },
    {
        "id": "deepseek-r1-distill-llama-70b",
        "label": "DeepSeek R1 70B",
        "subtitle": "Advanced Reasoning",
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

# Aliases for convenience
SUPPORTED_MODELS["llama-3.1-8b"] = SUPPORTED_MODELS["llama-3.1-8b-instant"]
SUPPORTED_MODELS["llama-3.3-70b"] = SUPPORTED_MODELS["llama-3.3-70b-versatile"]

