import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { parseConfigDetails } from "../../utils/configUtils";

export default function RankingBarView({ data }) {
  const rows = data ?? [];

  const accent = "#4f6ef7";

  const ranked = useMemo(
    () =>
      rows
        .filter((r) => r.averageRank != null)
        .map((r) => ({
          config: r.config,
          configLabel: r.configLabel || r.config,
          configDetails: r.configDetails || parseConfigDetails(r.config),
          averageRank: r.averageRank,
        }))
        .sort((a, b) => a.averageRank - b.averageRank),
    [rows]
  );

  const best = ranked[0]?.averageRank;
  const worst = ranked[ranked.length - 1]?.averageRank;
  const range = best != null && worst != null ? worst - best : 0;

  const barColor = (value) => {
    if (range === 0) return accent;
    const t = (value - best) / range; // 0 = best, 1 = worst
    const r = Math.round(34 + t * (239 - 34));
    const g = Math.round(197 + t * (68 - 197));
    const b = Math.round(94 + t * (68 - 94));
    return `rgb(${r},${g},${b})`;
  };

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
        <div style={{ fontWeight: 700, color: "#ffffff", fontSize: "13px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🏷️ {p.configLabel}</span>
          <span style={{ color: "#38bdf8", fontSize: "12px" }}>Rank: {Number(p.averageRank).toFixed(2)}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "12px", color: "rgba(255,255,255,0.75)", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "6px" }}>
          <div><strong style={{ color: "rgba(255,255,255,0.5)" }}>Model:</strong> {details.model}</div>
          <div><strong style={{ color: "rgba(255,255,255,0.5)" }}>Retrieval:</strong> {details.retrieval}</div>
          <div><strong style={{ color: "rgba(255,255,255,0.5)" }}>Reranker:</strong> {details.reranker}</div>
          <div><strong style={{ color: "rgba(255,255,255,0.5)" }}>Enhancements:</strong> {details.enhancements?.join(", ")}</div>
        </div>
      </div>
    );
  };

  if (ranked.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        No ranked configurations to show yet.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={ranked} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="configLabel"
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600 }}
            interval={0} angle={-20} textAnchor="end" height={60}
          />
          <YAxis
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
            label={{ value: "Average rank (lower is better)", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="averageRank" radius={[6, 6, 0, 0]}>
            {ranked.map((row, i) => <Cell key={i} fill={barColor(row.averageRank)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ margin: "14px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
        Sorted best to worst; greener bars indicate a stronger average rank across all metrics. Hover to inspect configuration parameters.
      </p>
    </div>
  );
}
