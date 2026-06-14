from pilotcore.runtime.pipeline import run_pipeline
from .benchmark_models import BenchmarkResult


def run_benchmark(
    questions,
    configs,
    user_id,
    source,
):
    results = []

    for config in configs:
        config.emit_trace = False

        print(f"\n===== RUNNING CONFIG: {config.experiment_name} =====\n")

        evaluations = []
        latencies = []

        for question in questions:

            trace = run_pipeline(
                query=question,
                user_id=user_id,
                source=source,
                experiment_config=config,
            )

            chunk_count = 0

            if trace.retrieval_result and trace.retrieval_result.retrieved_chunks:
                chunk_count = len(trace.retrieval_result.retrieved_chunks)

            print(
                f"{config.experiment_name} | " f"{question} | " f"chunks={chunk_count}"
            )

            print("\n=== EVALUATION ===")
            print(trace.evaluation)
            print("==================\n")

            evaluations.append(trace.evaluation)

            latencies.append(trace.latency_ms or 0.0)

        total_questions = max(
            len(evaluations),
            1,
        )

        result = BenchmarkResult(
            config_name=config.experiment_name,
            faithfulness=sum(
                e.get(
                    "faithfulness_score",
                    0.0,
                )
                for e in evaluations
            )
            / total_questions,
            semantic_grounding=sum(
                e.get(
                    "semantic_grounding",
                    0.0,
                )
                for e in evaluations
            )
            / total_questions,
            semantic_query_coverage=sum(
                e.get(
                    "semantic_query_coverage",
                    0.0,
                )
                for e in evaluations
            )
            / total_questions,
            retrieval_quality_score=sum(
                e.get(
                    "retrieval_quality_score",
                    0.0,
                )
                for e in evaluations
            )
            / total_questions,
            latency=sum(latencies) / max(len(latencies), 1),
            grounded_rate=sum(
                1
                for e in evaluations
                if e.get(
                    "grounded",
                    False,
                )
            )
            / total_questions,
            abstain_rate=sum(
                1
                for e in evaluations
                if e.get(
                    "abstained",
                    False,
                )
            )
            / total_questions,
        )

        print(f"\nRESULT: {result.config_name}")

        print(f"Faithfulness: {result.faithfulness:.4f}")

        print(f"Grounding: {result.semantic_grounding:.4f}")

        print(f"Retrieval Quality: {result.retrieval_quality_score:.4f}")

        print(f"Latency: {result.latency:.2f} ms")

        results.append(result)

    return results
