import Plot from "react-plotly.js";
import ConfigBadge from "../ConfigBadge";
import { parseConfigDetails } from "../../utils/configUtils";

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "grounding",    label: "Grounding" },
  { key: "quality",      label: "Quality" },
  { key: "coverage",     label: "Coverage" },
  { key: "latency",      label: "Latency" },
];

const LOWER_IS_BETTER = new Set(["latency"]);

function normalizeColumn(values, invert = false) {
  const valid = values.filter((v) => v != null && !Number.isNaN(v));

  if (!valid.length) {
    return values.map(() => null);
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min;

  return values.map((v) => {
    if (v == null) return null;
    let score = range === 0 ? 1 : (v - min) / range;
    if (invert) score = 1 - score;
    return score;
  });
}

export default function HeatmapView({ data }) {
  const rows = data ?? [];

  if (!rows.length) {
    return (
      <p style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>
        No configurations to compare yet.
      </p>
    );
  }

  const z = rows.map((row, i) => {
    return METRICS.map(({ key }) => {
      const values = rows.map((r) => r[key]);
      const normalized = normalizeColumn(values, LOWER_IS_BETTER.has(key));
      return normalized[i];
    });
  });

  const customdata = rows.map((row) => {
    const details = row.configDetails || parseConfigDetails(row.config);
    return METRICS.map(({ key }) => {
      const val = row[key];
      let formattedVal = "—";
      if (val != null) {
        formattedVal = key === "latency" ? `${Number(val).toFixed(2)} ms` : Number(val).toFixed(2);
      }
      return [
        details.model,
        details.retrieval,
        details.reranker,
        details.enhancements?.join(", ") || "Default",
        formattedVal,
      ];
    });
  });

  const annotations = [];

  rows.forEach((row) => {
    const cLabel = row.configLabel || row.config;
    METRICS.forEach(({ key, label }) => {
      const value = row[key];
      annotations.push({
        x: label,
        y: cLabel,
        text: value != null ? Number(value).toFixed(2) : "—",
        showarrow: false,
        font: { color: "white", size: 13 },
      });
    });
  });

  return (
    <div>
      <Plot
        data={[
          {
            z,
            x: METRICS.map((m) => m.label),
            y: rows.map((r) => r.configLabel || r.config),
            customdata,
            type: "heatmap",
            colorscale: "RdYlGn",
            reversescale: false,
            showscale: true,
            hoverongaps: false,
            hovertemplate:
              "<b>%{y} Specifications</b><br>" +
              "<b>Metric:</b> %{x} = <b>%{customdata[4]}</b> (Score: %{z:.2f})<br>" +
              "<b>Model:</b> %{customdata[0]}<br>" +
              "<b>Retrieval:</b> %{customdata[1]}<br>" +
              "<b>Reranker:</b> %{customdata[2]}<br>" +
              "<b>Enhancements:</b> %{customdata[3]}<extra></extra>",
            hoverlabel: {
              bgcolor: "rgba(15, 20, 36, 0.97)",
              bordercolor: "rgba(168, 85, 247, 0.5)",
              font: { color: "#ffffff", size: 12, family: "inherit" },
              align: "left",
            },
          },
        ]}
        layout={{
          height: 120 + rows.length * 60,
          margin: { l: 120, r: 50, t: 30, b: 60 },
          paper_bgcolor: "rgba(0,0,0,0)",
          plot_bgcolor: "rgba(0,0,0,0)",
          font: { color: "white" },
          annotations,
          xaxis: {
            side: "top",
            tickfont: { size: 13, color: "rgba(255,255,255,0.85)" },
          },
          yaxis: {
            tickfont: { size: 13, color: "rgba(255,255,255,0.85)" },
            autorange: "reversed",
          },
        }}
        style={{ width: "100%" }}
        config={{ displayModeBar: false, responsive: true }}
      />

      {/* Configuration Reference Bar */}
      <div style={{
        marginTop: "16px",
        padding: "14px 18px",
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "14px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "10px" }}>
          Configuration Reference (Hover any badge for full specifications)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {rows.map((r, i) => (
            <ConfigBadge
              key={r.config || i}
              configName={r.config}
              label={r.configLabel || `Config ${i + 1}`}
              isBest={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}