from pilotcore.runtime.pipeline import run_pipeline


class PipelineRunner:

    def run(self, query, parent_trace_id=None, prompt_mode="strict"):
        trace = run_pipeline(query=query)
        return {
            "trace_id": trace.trace_id,
            "response": trace.final_response,
            "parent_trace_id": parent_trace_id,
        }
