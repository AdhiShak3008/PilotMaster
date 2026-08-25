import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import ExperimentSelector from "../ExperimentSelector";
import { parseConfigDetails } from "../../utils/configUtils";

const METRICS = [
  { value: "faithfulness", label: "Faithfulness", description: "Answer accuracy" },
  { value: "grounding",    label: "Grounding",     description: "Evidence support" },
  { value: "quality",      label: "Quality",        description: "Retrieval precision/recall" },
  { value: "coverage",     label: "Coverage",       description: "Question coverage" },
  { value: "latency",      label: "Latency",        description: "Response speed" },
];

const metricLabel = (key) => METRICS.find((m) => m.value === key)?.label ?? key;

export default function ScatterView({ data }) {
  const [xMetric, setXMetric] = useState("latency");
  const [yMetric, setYMetric] = useState("faithfulness");

  const accent = "#4f6ef7";

  const points = useMemo(
    () =>
      (data ?? [])
        .filter((row) => row[xMetric] != null && row[yMetric] != null)
        .map((row) => ({
          config: row.config,
          configLabel: row.configLabel || row.config,
          configDetails: row.configDetails || parseConfigDetails(row.config),
          x: row[xMetric],
          y: row[yMetric],
        })),
    [data, xMetric, yMetric]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    const details = p.configDetails || parseConfigDetails(p.config);

    return (
      <div style={{
        background: "rgba(15, 20, 36, 0.97)",
        border: "1px solid rgba(168, 85, 247, 0.35)",
        borderRadius: "14px",
        padding: "12px 16px",
        fontSize: "12px",
        boxShadow: "0 16px 36px rgba(0,0,0,0.6)",
        maxWidth: "300px",
      }}>
        <div style={{ fontWeight: 700, color: "white", fontSize: "13px", marginBottom: "6px" }}>
          🏷️ {p.configLabel}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>
          <div>{metricLabel(xMetric)}: <strong style={{ color: "#38bdf8" }}>{Number(p.x).toFixed(2)}</strong></div>
          <div>{metricLabel(yMetric)}: <strong style={{ color: "#c084fc" }}>{Number(p.y).toFixed(2)}</strong></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "12px", color: "rgba(255,255,255,0.65)", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px", marginTop: "6px" }}>
          <div>Model: {details.model}</div>
          <div>Retrieval: {details.retrieval} · {details.reranker}</div>
          <div>Enhancements: {details.enhancements?.join(", ")}</div>
        </div>
      </div>
    );
  };

  if (points.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        Not enough data with both selected metrics to plot.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "20px" }}>
        <ExperimentSelector label="X Axis" value={xMetric} onChange={setXMetric} options={METRICS} />
        <ExperimentSelector label="Y Axis" value={yMetric} onChange={setYMetric} options={METRICS} />
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="x" name={metricLabel(xMetric)} type="number"
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            label={{ value: metricLabel(xMetric), position: "insideBottom", offset: -6, fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          />
          <YAxis
            dataKey="y" name={metricLabel(yMetric)} type="number"
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            label={{ value: metricLabel(yMetric), angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
          <Scatter data={points}>
            {points.map((_, i) => <Cell key={i} fill={accent} fillOpacity={0.85} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}