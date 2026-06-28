from ..schemas.diagnosis import Diagnosis


def generate_diagnoses(results):
    diagnoses = []
    seen = set()

    for r in results:

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
                        "Retrieved chunks do not adequately answer benchmark questions.",
                        "Semantic query coverage is critically low.",
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
                        "Retrieval pipeline incurs significant processing overhead.",
                        "Generation or reranking is computationally expensive.",
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
                        "The pipeline frequently lacks sufficient evidence to answer.",
                    ],
                )
            )
            seen.add("Frequent Abstention")

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
                        "Relevant evidence may be diluted within excessive retrieved context.",
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
                        "Retriever is failing to locate semantically relevant evidence.",
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
                        "Additional computation is not translating into better answer quality.",
                    ],
                )
            )
            seen.add("Inefficient Reranking")

    return diagnoses
