import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import ExperimentSelector from "../ExperimentSelector";

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
        .map((row) => ({ config: row.config, x: row[xMetric], y: row[yMetric] })),
    [data, xMetric, yMetric]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div style={{
        background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px", padding: "10px 14px", fontSize: "12px",
      }}>
        <div style={{ fontWeight: 700, color: "white", marginBottom: "4px" }}>
          {p.config?.replaceAll("_", " ")}
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)" }}>
          {metricLabel(xMetric)}: <span style={{ color: "white" }}>{Number(p.x).toFixed(2)}</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)" }}>
          {metricLabel(yMetric)}: <span style={{ color: "white" }}>{Number(p.y).toFixed(2)}</span>
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