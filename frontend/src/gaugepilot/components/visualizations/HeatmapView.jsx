import Plot from "react-plotly.js";

const METRICS = [
  {
    key: "faithfulness",
    label: "Faithfulness",
  },
  {
    key: "grounding",
    label: "Grounding",
  },
  {
    key: "quality",
    label: "Quality",
  },
  {
    key: "coverage",
    label: "Coverage",
  },
  {
    key: "latency",
    label: "Latency",
  },
];

const LOWER_IS_BETTER = new Set([
  "latency",
]);

function normalizeColumn(values, invert = false) {
  const valid = values.filter(
    (v) => v != null && !Number.isNaN(v)
  );

  if (!valid.length) {
    return values.map(() => null);
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min;

  return values.map((v) => {
    if (v == null) return null;

    let score =
      range === 0
        ? 1
        : (v - min) / range;

    if (invert) {
      score = 1 - score;
    }

    return score;
  });
}

export default function HeatmapView({
  data,
}) {
  const rows = data ?? [];

  if (!rows.length) {
    return (
      <p
        style={{
          color:
            "rgba(255,255,255,0.4)",
          margin: 0,
        }}
      >
        No configurations to compare
        yet.
      </p>
    );
  }

  const z = rows.map((row, i) => {
    return METRICS.map(
      ({ key }) => {
        const values = rows.map(
          (r) => r[key]
        );

        const normalized =
          normalizeColumn(
            values,
            LOWER_IS_BETTER.has(key)
          );

        return normalized[i];
      }
    );
  });

  const annotations = [];

  rows.forEach((row, rowIndex) => {
    METRICS.forEach(
      ({ key, label }, colIndex) => {
        const value = row[key];

        annotations.push({
          x: label,
          y:
            row.config
              ?.replaceAll("_", " ")
              ?.replaceAll("+", " + ") ??
            "",
          text:
            value != null
              ? Number(value).toFixed(
                  2
                )
              : "—",
          showarrow: false,
          font: {
            color: "white",
            size: 13,
          },
        });
      }
    );
  });

  return (
    <Plot
      data={[
        {
          z,
          x: METRICS.map(
            (m) => m.label
          ),
          y: rows.map(
            (r) =>
              r.config
                ?.replaceAll(
                  "_",
                  " "
                )
                ?.replaceAll(
                  "+",
                  " + "
                ) ?? ""
          ),
          type: "heatmap",
          colorscale: "RdYlGn",
          reversescale: false,
          showscale: true,
          hoverongaps: false,
          hovertemplate:
            "<b>%{y}</b><br>%{x}<br>%{z:.2f}<extra></extra>",
        },
      ]}
      layout={{
        height:
          120 +
          rows.length * 70,
        margin: {
          l: 220,
          r: 50,
          t: 30,
          b: 70,
        },
        paper_bgcolor:
          "rgba(0,0,0,0)",
        plot_bgcolor:
          "rgba(0,0,0,0)",
        font: {
          color: "white",
        },
        annotations,
        xaxis: {
          side: "top",
          tickfont: {
            size: 14,
          },
        },
        yaxis: {
          tickfont: {
            size: 14,
          },
          autorange: "reversed",
        },
      }}
      style={{
        width: "100%",
      }}
      config={{
        displayModeBar: false,
        responsive: true,
      }}
    />
  );
}