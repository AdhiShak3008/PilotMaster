import { useMemo } from "react";

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "grounding",    label: "Grounding" },
  { key: "quality",      label: "Quality" },
  { key: "coverage",     label: "Coverage" },
  { key: "latency",      label: "Latency" },
];

const accent = "#4f6ef7";
const PLOT_HEIGHT = 200;
const PLOT_WIDTH = 110;

function quartiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const pct = (p) => {
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  return {
    min: sorted[0],
    q1: pct(0.25),
    median: pct(0.5),
    q3: pct(0.75),
    max: sorted[n - 1],
  };
}

function BoxColumn({ label, values }) {
  if (values.length === 0) {
    return (
      <div style={{ width: PLOT_WIDTH, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>No data</p>
        <p style={{ margin: "6px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{label}</p>
      </div>
    );
  }

  const { min, q1, median, q3, max } = quartiles(values);
  const range = max - min || 1;
  // SVG y grows downward, and a higher metric value should sit higher on the
  // plot, so the scale is inverted: y(min) is near the bottom, y(max) near the top.
  const padding = 14;
  const y = (v) => padding + (1 - (v - min) / range) * (PLOT_HEIGHT - padding * 2);

  const boxX = PLOT_WIDTH / 2 - 22;
  const boxWidth = 44;

  return (
    <div style={{ width: PLOT_WIDTH, textAlign: "center" }}>
      <svg width={PLOT_WIDTH} height={PLOT_HEIGHT}>
        {/* Whisker line, min to max */}
        <line x1={PLOT_WIDTH / 2} x2={PLOT_WIDTH / 2} y1={y(min)} y2={y(max)} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        {/* Caps */}
        <line x1={PLOT_WIDTH / 2 - 12} x2={PLOT_WIDTH / 2 + 12} y1={y(min)} y2={y(min)} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        <line x1={PLOT_WIDTH / 2 - 12} x2={PLOT_WIDTH / 2 + 12} y1={y(max)} y2={y(max)} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        {/* Box, q1 to q3 */}
        <rect x={boxX} y={y(q3)} width={boxWidth} height={Math.max(y(q1) - y(q3), 1)} fill={`${accent}33`} stroke={accent} strokeWidth={1.5} rx={4} />
        {/* Median line */}
        <line x1={boxX} x2={boxX + boxWidth} y1={y(median)} y2={y(median)} stroke={accent} strokeWidth={2.5} />
      </svg>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
        <div>max {max.toFixed(2)}</div>
        <div style={{ color: accent, fontWeight: 700 }}>med {median.toFixed(2)}</div>
        <div>min {min.toFixed(2)}</div>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{label}</p>
    </div>
  );
}

export default function BoxPlotView({ data }) {
  const rows = data ?? [];

  const columns = useMemo(
    () =>
      METRICS.map(({ key, label }) => ({
        label,
        values: rows.map((r) => r[key]).filter((v) => v != null && !Number.isNaN(v)),
      })),
    [rows]
  );

  if (rows.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        No configurations to chart yet.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "16px" }}>
        {columns.map((col) => <BoxColumn key={col.label} label={col.label} values={col.values} />)}
      </div>
      <p style={{ margin: "16px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
        Each box plot is scaled to its own metric's range, spanning {rows.length} configuration{rows.length !== 1 ? "s" : ""}: box = interquartile range, line = median, whiskers = min/max.
      </p>
    </div>
  );
}
