import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { parseConfigDetails } from "../../utils/configUtils";

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "grounding", label: "Grounding" },
  { key: "quality", label: "Quality" },
  { key: "coverage", label: "Coverage" },
  { key: "latency", label: "Latency" },
];

const LOWER_IS_BETTER = new Set(["latency"]);

const getColor = (index) => `hsl(${(index * 137.508) % 360}, 70%, 55%)`;

function buildNormalizers(rows) {
  const map = {};

  METRICS.forEach(({ key }) => {
    const values = rows
      .map((r) => r[key])
      .filter((v) => v != null && !Number.isNaN(v));

    if (!values.length) {
      map[key] = () => null;
      return;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    map[key] = (v) => {
      if (v == null) return null;
      const t = range === 0 ? 1 : (v - min) / range;
      const goodness = LOWER_IS_BETTER.has(key) ? 1 - t : t;
      return Math.round(goodness * 100);
    };
  });

  return map;
}

export default function RadarView({ data }) {
  const rows = data ?? [];

  const displayRows = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => (a.averageRank ?? 999) - (b.averageRank ?? 999)
    );
    return sorted.slice(0, 8);
  }, [rows]);

  const normalizers = useMemo(() => buildNormalizers(displayRows), [displayRows]);

  const chartData = useMemo(() => {
    return METRICS.map(({ key, label }) => {
      const point = { metric: label };
      displayRows.forEach((row) => {
        const cLabel = row.configLabel || row.config;
        point[cLabel] = normalizers[key](row[key]) ?? 0;
      });
      return point;
    });
  }, [displayRows, normalizers]);

  const rawMap = useMemo(() => {
    const map = {};
    displayRows.forEach((row) => {
      const cLabel = row.configLabel || row.config;
      map[cLabel] = {
        details: row.configDetails || parseConfigDetails(row.config),
        metrics: {},
      };
      METRICS.forEach(({ key }) => {
        map[cLabel].metrics[key] = row[key];
      });
    });
    return map;
  }, [displayRows]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const metricKey = METRICS.find((m) => m.label === label)?.key;

    return (
      <div
        style={{
          background: "rgba(15, 20, 36, 0.97)",
          border: "1px solid rgba(168, 85, 247, 0.35)",
          borderRadius: 14,
          padding: "12px 16px",
          fontSize: 12,
          minWidth: 260,
          boxShadow: "0 16px 36px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ color: "white", fontWeight: 700, marginBottom: 10, fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
          📊 {label} Comparison
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {payload.map((entry) => {
            const info = rawMap[entry.dataKey];
            const rawVal = info?.metrics?.[metricKey];
            const details = info?.details;

            return (
              <div
                key={entry.dataKey}
                style={{
                  padding: "6px 8px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: `3px solid ${entry.color}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: entry.color, fontWeight: 700 }}>{entry.dataKey}</span>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>
                    Score: {entry.value}/100 {rawVal != null ? `(${Number(rawVal).toFixed(2)})` : ""}
                  </span>
                </div>
                {details && (
                  <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                    {details.model} · {details.retrieval} · {details.reranker}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (displayRows.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
        No configurations to plot yet.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.2)"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{
              fontSize: 12,
              maxHeight: 70,
              overflowY: "auto",
              paddingTop: "10px",
            }}
            formatter={(value) => (
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, marginRight: 8 }}>
                {value}
              </span>
            )}
          />

          {displayRows.map((row, i) => {
            const cLabel = row.configLabel || row.config;
            return (
              <Radar
                key={cLabel}
                name={cLabel}
                dataKey={cLabel}
                stroke={getColor(i)}
                fill={getColor(i)}
                fillOpacity={0.12}
                strokeWidth={2}
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>

      <p style={{ margin: "16px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
        Each axis is normalized from 0–100 across displayed configurations. Latency is inverted so outward represents better speed.
      </p>
    </div>
  );
}