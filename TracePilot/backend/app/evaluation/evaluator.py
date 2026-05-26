from pilotcore.evaluation.evaluator import run_evaluation


class Evaluator:

    def evaluate(self, query, response, chunks):
        scores = [c.get("score", 0) if isinstance(c, dict) else c.score for c in chunks]
        result = run_evaluation(query=query, response=response, chunks=chunks, scores=scores)
        # Map to legacy keys pipeline_runner still uses
        return {
            "grounded": result.get("grounded", False),
            "hallucination_score": 1.0 - result.get("faithfulness_score", 0.0),
            "faithfulness_score": result.get("faithfulness_score", 0.0),
            "abstained": result.get("abstained", False),
            **result,
        }
