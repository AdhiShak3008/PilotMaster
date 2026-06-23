from ..schemas.diagnosis import Diagnosis


def generate_diagnoses(results):

    diagnoses = []
    seen = set()

    for r in results:

        # ------------------------------
        # Classic threshold diagnoses
        # ------------------------------

        if (
            r.semantic_grounding < 0.6
            and r.semantic_query_coverage < 0.5
            and "Low Grounding" not in seen
        ):
            diagnoses.append(
                Diagnosis(
                    issue="Low Grounding",
                    severity="warning",
                    causes=[
                        "Poor retrieval coverage.",
                        "Insufficient supporting context.",
                    ],
                    recommendations=[
                        "Try Hybrid retrieval.",
                        "Try Multi Query.",
                        "Enable Query Rewrite.",
                    ],
                )
            )
            seen.add("Low Grounding")

        if (
            r.abstain_rate > 0.5
            and r.semantic_query_coverage < 0.3
            and "Insufficient Context" not in seen
        ):
            diagnoses.append(
                Diagnosis(
                    issue="Insufficient Context",
                    severity="warning",
                    causes=[
                        "Retrieved chunks do not answer the question.",
                        "Coverage is extremely low.",
                    ],
                    recommendations=[
                        "Upload additional documents.",
                        "Try Hybrid retrieval.",
                        "Try Multi Query.",
                    ],
                )
            )
            seen.add("Insufficient Context")

        if r.latency > 10000 and "High Latency" not in seen:
            diagnoses.append(
                Diagnosis(
                    issue="High Latency",
                    severity="warning",
                    causes=[
                        "Expensive retrieval pipeline.",
                        "Large model or reranker overhead.",
                    ],
                    recommendations=[
                        "Disable Multi Query.",
                        "Use a lighter reranker.",
                        "Try a smaller model.",
                    ],
                )
            )
            seen.add("High Latency")

        if r.abstain_rate > 0.5 and "Frequent Abstention" not in seen:
            diagnoses.append(
                Diagnosis(
                    issue="Frequent Abstention",
                    severity="warning",
                    causes=[
                        "The system lacks sufficient evidence to answer.",
                    ],
                    recommendations=[
                        "Upload more relevant documents.",
                        "Improve retrieval coverage.",
                    ],
                )
            )
            seen.add("Frequent Abstention")

        # ------------------------------
        # Multi-variable failure modes
        # ------------------------------

        if (
            r.latency > 5000
            and r.retrieval_quality_score > 0.7
            and r.semantic_grounding < 0.5
            and "Lost in the Middle" not in seen
        ):
            diagnoses.append(
                Diagnosis(
                    issue="Lost in the Middle",
                    severity="warning",
                    causes=[
                        "Large amounts of context are being retrieved.",
                        "Important evidence may be buried in the middle.",
                    ],
                    recommendations=[
                        "Reduce context size.",
                        "Try LongContextReorder.",
                        "Reduce retrieved chunk count.",
                    ],
                )
            )
            seen.add("Lost in the Middle")

        if (
            r.semantic_query_coverage < 0.4
            and r.retrieval_quality_score < 0.4
            and r.abstain_rate > 0.3
            and "Semantic Drift" not in seen
        ):
            diagnoses.append(
                Diagnosis(
                    issue="Semantic Drift",
                    severity="warning",
                    causes=[
                        "Retriever is failing to find semantically relevant context.",
                        "Coverage and retrieval quality are critically low.",
                    ],
                    recommendations=[
                        "Increase dense retrieval weighting.",
                        "Try Hybrid retrieval.",
                        "Enable Query Rewrite.",
                    ],
                )
            )
            seen.add("Semantic Drift")

        if (
            r.latency > 8000
            and r.faithfulness < 0.6
            and "Inefficient Reranking" not in seen
        ):
            diagnoses.append(
                Diagnosis(
                    issue="Inefficient Reranking",
                    severity="warning",
                    causes=[
                        "High compute cost without proportional quality gains.",
                    ],
                    recommendations=[
                        "Reduce rerank pool size.",
                        "Use a lighter reranker.",
                        "Disable reranking and compare results.",
                    ],
                )
            )
            seen.add("Inefficient Reranking")

    return diagnoses
