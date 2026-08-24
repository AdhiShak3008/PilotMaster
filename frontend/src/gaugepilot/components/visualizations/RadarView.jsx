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
          borderRadius: 12,
          padding: "10px 14px",
          fontSize: 12,
          minWidth: 220,
          boxShadow: "0 16px 36px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ color: "white", fontWeight: 700, marginBottom: 8, fontSize: "12.5px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "5px" }}>
          📊 {label} Comparison
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {payload.map((entry) => {
            const info = rawMap[entry.dataKey];
            const rawVal = info?.metrics?.[metricKey];
            let rawFormatted = "";
            if (rawVal != null) {
              rawFormatted = metricKey === "latency" ? `(${Number(rawVal).toFixed(1)} ms)` : `(${Number(rawVal).toFixed(2)})`;
            }

            return (
              <div
                key={entry.dataKey}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "3px 6px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <span style={{ color: entry.color, fontWeight: 700 }}>{entry.dataKey}</span>
                <span style={{ color: "#ffffff", fontWeight: 600, fontSize: "11.5px", marginLeft: "10px" }}>
                  {entry.value}/100 {rawFormatted}
                </span>
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
      <ResponsiveContainer width="100%" height={480}>
        <RadarChart data={chartData} outerRadius="75%" margin={{ top: 25, right: 35, bottom: 25, left: 35 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600 }}
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
              paddingTop: "12px",
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
                fillOpacity={0.14}
                strokeWidth={2.5}
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>

      <p style={{ margin: "14px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
        Each axis is normalized from 0–100 across displayed configurations. Latency is inverted so outward represents better speed.
      </p>

      {/* Configuration Reference Bar */}
      <div style={{
        marginTop: "16px",
        padding: "14px 18px",
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "14px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "10px" }}>
          Configuration Reference (Hover any badge for full specifications)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {displayRows.map((r, i) => (
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