import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from "recharts";

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "grounding",    label: "Grounding" },
  { key: "quality",      label: "Quality" },
  { key: "coverage",     label: "Coverage" },
  { key: "latency",      label: "Latency" },
];

const LOWER_IS_BETTER = new Set(["latency"]);
const accent = "#4f6ef7";

function computeWins(rows) {
  const wins = {};
  rows.forEach((r) => { wins[r.config] = 0; });

  METRICS.forEach(({ key }) => {
    const valid = rows.filter((r) => r[key] != null);
    if (valid.length === 0) return;
    const best = LOWER_IS_BETTER.has(key)
      ? valid.reduce((a, b) => (b[key] < a[key] ? b : a))
      : valid.reduce((a, b) => (b[key] > a[key] ? b : a));
    wins[best.config] = (wins[best.config] ?? 0) + 1;
  });

  return rows
    .map((r) => ({ config: r.config, wins: wins[r.config] ?? 0 }))
    .sort((a, b) => b.wins - a.wins);
}

export default function PerformanceProfile({ data }) {
  const rows = data ?? [];
  const profile = useMemo(() => computeWins(rows), [rows]);

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
          Metrics won: <span style={{ color: "white" }}>{p.wins} / {METRICS.length}</span>
        </div>
      </div>
    );
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return <Dot cx={cx} cy={cy} r={payload.wins > 0 ? 5 : 3} fill={accent} stroke="white" strokeWidth={payload.wins > 0 ? 1 : 0} />;
  };

  if (profile.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        No configurations to profile yet.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={profile} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="config" tickFormatter={(v) => v?.replaceAll("_", " ")}
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            interval={0} angle={-20} textAnchor="end" height={60}
          />
          <YAxis
            allowDecimals={false} domain={[0, METRICS.length]}
            stroke="rgba(255,255,255,0.35)" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            label={{ value: "Metrics won", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
          <Line type="monotone" dataKey="wins" stroke={accent} strokeWidth={2} dot={<CustomDot />} />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ margin: "14px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
        Counts how many of the {METRICS.length} metrics each configuration leads on (latency counts a win for the lowest value).
      </p>
    </div>
  );
}
