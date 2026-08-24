import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

    if (values.length === 0) {
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

export default function ParallelCoordinatesView({ data }) {
  const rows = data ?? [];

  const displayRows = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => (a.averageRank ?? 999) - (b.averageRank ?? 999)
    );
    return sorted.slice(0, 8);
  }, [rows]);

  const normalizers = useMemo(() => buildNormalizers(displayRows), [displayRows]);

  const chartData = useMemo(
    () =>
      METRICS.map(({ key, label }) => {
        const point = { metric: label };
        displayRows.forEach((row) => {
          const cLabel = row.configLabel || row.config;
          point[cLabel] = normalizers[key](row[key]) ?? null;
        });
        return point;
      }),
    [displayRows, normalizers]
  );

  const rawByConfigAndMetric = useMemo(() => {
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
          borderRadius: "14px",
          padding: "12px 16px",
          fontSize: "12px",
          minWidth: "260px",
          boxShadow: "0 16px 36px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ color: "white", fontWeight: 700, marginBottom: 10, fontSize: "13px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
          📊 {label} Coordinate Trajectory
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {payload.map((entry) => {
            const info = rawByConfigAndMetric[entry.dataKey];
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
                  <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
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
      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
        No configurations to plot yet.
      </p>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="metric"
            stroke="rgba(255,255,255,0.35)"
            tick={{ fill: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.35)"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            label={{
              value: "Normalized Score",
              angle: -90,
              position: "insideLeft",
              fill: "rgba(255,255,255,0.45)",
              fontSize: 11,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{
              maxHeight: 70,
              overflowY: "auto",
              fontSize: 12,
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
              <Line
                key={cLabel}
                type="monotone"
                name={cLabel}
                dataKey={cLabel}
                stroke={getColor(i)}
                strokeWidth={3}
                dot={{ r: 5, fill: getColor(i), strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      <p style={{ margin: "16px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
        Each metric is normalized from 0–100 across displayed configurations. Latency is inverted so higher represents better performance.
      </p>
    </div>
  );
}