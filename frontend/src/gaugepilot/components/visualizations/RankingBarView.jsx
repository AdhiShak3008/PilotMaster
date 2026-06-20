import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function RankingBarView({ data }) {
  const rows = data ?? [];

  const accent = "#4f6ef7";
  const green = "#22c55e";

  const ranked = useMemo(
    () =>
      rows
        .filter((r) => r.averageRank != null)
        .map((r) => ({ config: r.config, averageRank: r.averageRank }))
        // Lower average rank is better, so the best configuration sorts first.
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
    return (
      <div style={{
        background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "10px", padding: "10px 14px", fontSize: "12px",
      }}>
        <div style={{ fontWeight: 700, color: "white", marginBottom: "4px" }}>
          {p.config?.replaceAll("_", " ")}
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)" }}>
          Average rank: <span style={{ color: "white" }}>{Number(p.averageRank).toFixed(2)}</span>
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
            dataKey="config" tickFormatter={(v) => v?.replaceAll("_", " ")}
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            interval={0} angle={-20} textAnchor="end" height={60}
          />
          <YAxis
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            label={{ value: "Average rank (lower is better)", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="averageRank" radius={[6, 6, 0, 0]}>
            {ranked.map((row, i) => <Cell key={i} fill={barColor(row.averageRank)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ margin: "14px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
        Sorted best to worst; greener bars indicate a stronger average rank across all metrics.
      </p>
    </div>
  );
}
