import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import ExperimentSelector from "../ExperimentSelector";

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
  // Orient both axes so "higher is better" for the dominance comparison.
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
        .map((row) => ({ config: row.config, x: row[xMetric], y: row[yMetric] })),
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
        <div style={{ marginTop: "4px", fontWeight: 600, color: p.dominated ? "rgba(255,255,255,0.4)" : "#22c55e" }}>
          {p.dominated ? "Dominated" : "Pareto optimal"}
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
              { value: "Pareto optimal", type: "circle", color: accent },
              { value: "Dominated", type: "circle", color: muted },
            ]}
            formatter={(value) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{value}</span>}
          />
          <Scatter data={dominated} fill={muted} fillOpacity={0.6} />
          <Scatter data={frontier} fill={accent} line={{ stroke: accent, strokeWidth: 1.5, strokeDasharray: "4 4" }} lineType="joint" />
        </ScatterChart>
      </ResponsiveContainer>
      <p style={{ margin: "14px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
        Dashed line connects Pareto-optimal configurations; dominated configurations are faded.
      </p>
    </div>
  );
}
