def suggest_experiments(results):

    suggestions = []

    if len(results) < 3:
        suggestions.append("Benchmark additional configurations.")

    config_names = [r.config_name.lower() for r in results]

    if not any("hybrid" in c for c in config_names):
        suggestions.append("Benchmark Hybrid retrieval.")

    if not any("lexical" in c for c in config_names):
        suggestions.append("Benchmark BM25 retrieval.")

    if not any("vector" in c for c in config_names):
        suggestions.append("Benchmark Vector retrieval.")

    if not any("minilm" in c for c in config_names):
        suggestions.append("Benchmark MiniLM reranker.")

    if not any("query rewrite" in c for c in config_names):
        suggestions.append("Benchmark Query Rewrite.")

    return suggestions
