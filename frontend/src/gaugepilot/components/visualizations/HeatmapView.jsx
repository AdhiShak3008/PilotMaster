 
import { useMemo } from "react";

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "grounding",    label: "Grounding" },
  { key: "quality",      label: "Quality" },
  { key: "coverage",     label: "Coverage" },
  { key: "latency",      label: "Latency" },
];

// Latency is "lower is better" — every other metric here is "higher is better".
const LOWER_IS_BETTER = new Set(["latency"]);

function buildNormalizer(values) {
  const valid = values.filter((v) => v != null && !Number.isNaN(v));
  if (valid.length === 0) return () => null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min;
  return (v) => (v == null ? null : range === 0 ? 1 : (v - min) / range);
}

export default function HeatmapView({ data }) {
  const rows = data ?? [];

  const normalizers = useMemo(() => {
    const map = {};
    METRICS.forEach(({ key }) => {
      map[key] = buildNormalizer(rows.map((r) => r[key]));
    });
    return map;
  }, [rows]);

  const goodness = (key, value) => {
    if (value == null) return null;
    const t = normalizers[key](value);
    if (t == null) return null;
    return LOWER_IS_BETTER.has(key) ? 1 - t : t;
  };

 const cellColor = (g) => {
  if (g == null) {
    return "rgba(255,255,255,0.03)";
  }

  if (g < 0.33) {
    const alpha = 0.25 + g * 0.5;
    return `rgba(239,68,68,${alpha})`; // red
  }

  if (g < 0.66) {
    const alpha = 0.25 + g * 0.5;
    return `rgba(245,158,11,${alpha})`; // amber
  }

  const alpha = 0.25 + g * 0.5;
  return `rgba(34,197,94,${alpha})`; // green
};

  if (rows.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        No configurations to compare yet.
      </p>
    );
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                Configuration
              </th>
              {METRICS.map((m) => (
                <th key={m.key} style={{ textAlign: "center", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.config}>
                <td style={{ padding: "8px 12px", color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {row.config?.replaceAll("_", " ") ?? "—"}
                </td>
                {METRICS.map((m) => {
                  const value = row[m.key];
                  const g = goodness(m.key, value);
                  return (
                    <td key={m.key} style={{ padding: "6px" }}>
                      <div style={{
                        background: cellColor(g),
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        textAlign: "center",
                        color: "white",
                        fontWeight: 600,
                      }}>
                        {value != null ? Number(value).toFixed(2) : "—"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Worse</span>
        <div style={{ display: "flex", flex: 1, maxWidth: "160px", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((g) => (
            <div key={g} style={{ flex: 1, background: cellColor(g) }} />
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Better</span>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginLeft: "12px" }}>
          (latency inverted — lower is greener)
        </span>
      </div>
    </div>
  );
}