import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ExperimentSelector from "../ExperimentSelector";
import { parseConfigDetails } from "../../utils/configUtils";

const METRICS = [
  { value: "faithfulness", label: "Faithfulness" },
  { value: "grounding",    label: "Grounding" },
  { value: "quality",      label: "Quality" },
  { value: "coverage",     label: "Coverage" },
  { value: "latency",      label: "Latency" },
];

const LOWER_IS_BETTER = new Set(["latency"]);
const metricLabel = (key) => METRICS.find((m) => m.value === key)?.label ?? key;

function computeFrontier(points, xMetric, yMetric) {
  const oriented = points.map((p) => ({
    ...p,
    ox: LOWER_IS_BETTER.has(xMetric) ? -p.x : p.x,
    oy: LOWER_IS_BETTER.has(yMetric) ? -p.y : p.y,
  }));

  return oriented.map((p) => {
    const dominated = oriented.some(
      (q) => q !== p && q.ox >= p.ox && q.oy >= p.oy && (q.ox > p.ox || q.oy > p.oy)
    );
    return { ...p, dominated };
  });
}

export default function ParetoView({ data }) {
  const [xMetric, setXMetric] = useState("latency");
  const [yMetric, setYMetric] = useState("faithfulness");

  const accent = "#4f6ef7";
  const muted = "rgba(255,255,255,0.22)";

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

  const scored = useMemo(() => computeFrontier(points, xMetric, yMetric), [points, xMetric, yMetric]);
  const frontier = useMemo(
    () => scored.filter((p) => !p.dominated).sort((a, b) => a.x - b.x),
    [scored]
  );
  const dominated = scored.filter((p) => p.dominated);

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
        <div style={{ fontWeight: 700, color: "white", fontSize: "13px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🏷️ {p.configLabel}</span>
          <span style={{
            fontSize: "12px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "4px",
            background: p.dominated ? "rgba(255,255,255,0.06)" : "rgba(34, 197, 94, 0.2)",
            color: p.dominated ? "rgba(255,255,255,0.5)" : "#22c55e",
          }}>
            {p.dominated ? "Dominated" : "Pareto Optimal"}
          </span>
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
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="x" type="number" stroke="rgba(255,255,255,0.35)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            label={{ value: metricLabel(xMetric), position: "insideBottom", offset: -6, fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          />
          <YAxis
            dataKey="y" type="number" stroke="rgba(255,255,255,0.35)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            label={{ value: metricLabel(yMetric), angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
          <Legend
            verticalAlign="top" align="right" height={30}
            payload={[
              { value: "Pareto Frontier (Optimal)", type: "circle", color: "#22c55e" },
              { value: "Dominated", type: "circle", color: muted },
            ]}
          />
          <Scatter name="Dominated" data={dominated} fill={muted} />
          <Scatter name="Pareto Optimal" data={frontier} fill="#22c55e" line={{ stroke: "#22c55e", strokeWidth: 1.5, strokeDasharray: "4 4" }} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
