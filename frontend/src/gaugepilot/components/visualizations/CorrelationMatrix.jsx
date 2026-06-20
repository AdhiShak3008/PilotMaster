import { useMemo } from "react";

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "grounding",    label: "Grounding" },
  { key: "quality",      label: "Quality" },
  { key: "coverage",     label: "Coverage" },
  { key: "latency",      label: "Latency" },
];

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? null : num / den;
}

function correlationMatrix(rows) {
  return METRICS.map(({ key: keyA }) =>
    METRICS.map(({ key: keyB }) => {
      const pairs = rows
        .map((r) => [r[keyA], r[keyB]])
        .filter(([a, b]) => a != null && b != null && !Number.isNaN(a) && !Number.isNaN(b));
      if (keyA === keyB) return 1;
      return pearson(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
    })
  );
}

// Diverging scale: blue for positive correlation, red for negative,
// intensity scaling with |r| — a seaborn "coolwarm"-style read.
function cellColor(r) {
  if (r == null) return "rgba(255,255,255,0.03)";
  const intensity = Math.min(Math.abs(r), 1);
  const alpha = (0.1 + intensity * 0.7).toFixed(2);
  return r >= 0 ? `rgba(79,110,247,${alpha})` : `rgba(239,68,68,${alpha})`;
}

export default function CorrelationMatrix({ data }) {
  const rows = data ?? [];

  const matrix = useMemo(() => correlationMatrix(rows), [rows]);

  if (rows.length < 2) {
    return (
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        Need at least two configurations to compute correlations.
      </p>
    );
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }} />
              {METRICS.map((m) => (
                <th key={m.key} style={{ textAlign: "center", padding: "8px 12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((rowMetric, i) => (
              <tr key={rowMetric.key}>
                <td style={{ padding: "8px 12px", color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {rowMetric.label}
                </td>
                {METRICS.map((colMetric, j) => {
                  const r = matrix[i][j];
                  return (
                    <td key={colMetric.key} style={{ padding: "6px" }}>
                      <div style={{
                        background: cellColor(r),
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        textAlign: "center",
                        color: "white",
                        fontWeight: 600,
                      }}>
                        {r != null ? r.toFixed(2) : "—"}
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
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>−1 (inverse)</span>
        <div style={{ display: "flex", flex: 1, maxWidth: "200px", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((r) => (
            <div key={r} style={{ flex: 1, background: cellColor(r) }} />
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>+1 (in step)</span>
      </div>
    </div>
  );
}
