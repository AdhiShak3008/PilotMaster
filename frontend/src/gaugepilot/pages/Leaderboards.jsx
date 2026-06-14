import { useState } from "react";

import OverallTable from "../components/leaderboards/OverallTable";
import ExperimentSelector from "../components/ExperimentSelector";
import Insights from "./Insights";

export default function Leaderboards({
  leaderboard,
}) {
  const [selectedMetric, setSelectedMetric] =
    useState("overall");

  if (!leaderboard) {
    return (
      <div className="gauge-card">
        <h2
          style={{
            marginBottom: "16px",
          }}
        >
          Leaderboards
        </h2>

        <p>
          No benchmark results yet.
        </p>
      </div>
    );
  }

  return (
    <div
      id="leaderboards"
      className="gauge-card"
    >
      <h2
        style={{
          marginBottom: "24px",
        }}
      >
        Leaderboards
      </h2>

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <ExperimentSelector
          value={selectedMetric}
          onChange={
            setSelectedMetric
          }
          options={[
            {
              value: "overall",
              label: "Overall",
              description:
                "Combined ranking",
            },
            {
              value:
                "faithfulness",
              label:
                "Faithfulness",
              description:
                "Answer accuracy",
            },
            {
              value:
                "grounding",
              label:
                "Grounding",
              description:
                "Evidence support",
            },
            {
              value:
                "retrieval_quality",
              label:
                "Retrieval Quality",
              description:
                "Retriever performance",
            },
            {
              value:
                "query_coverage",
              label:
                "Query Coverage",
              description:
                "Question coverage",
            },
            {
              value:
                "latency",
              label:
                "Latency",
              description:
                "Response speed",
            },
          ]}
        />
      </div>

      <OverallTable
        data={
          leaderboard[
            selectedMetric
          ]
        }
      />

      <div
        style={{
          marginTop: "32px",
        }}
      >
        <Insights
          leaderboard={
            leaderboard
          }
        />
      </div>
    </div>
  );
}