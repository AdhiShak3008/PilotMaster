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

const METRICS = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "grounding", label: "Grounding" },
  { key: "quality", label: "Quality" },
  { key: "coverage", label: "Coverage" },
  { key: "latency", label: "Latency" },
];

const LOWER_IS_BETTER = new Set(["latency"]);

const getColor = (index) =>
  `hsl(${(index * 137.508) % 360}, 70%, 55%)`;

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

      const t =
        range === 0 ? 1 : (v - min) / range;

      const goodness = LOWER_IS_BETTER.has(key)
        ? 1 - t
        : t;

      return Math.round(goodness * 100);
    };
  });

  return map;
}

export default function ParallelCoordinatesView({
  data,
}) {
  const rows = data ?? [];

  const displayRows = useMemo(() => {
    if (rows.length <= 7) {
      return rows;
    }

    return [...rows]
      .sort(
        (a, b) =>
          (a.average_rank ?? 999) -
          (b.average_rank ?? 999)
      )
      .slice(0, 7);
  }, [rows]);

  const normalizers = useMemo(
    () => buildNormalizers(displayRows),
    [displayRows]
  );

  const chartData = useMemo(
    () =>
      METRICS.map(({ key, label }) => {
        const point = {
          metric: label,
        };

        displayRows.forEach((row) => {
          point[row.config] =
            normalizers[key](row[key]) ?? null;
        });

        return point;
      }),
    [displayRows, normalizers]
  );

  const rawByConfigAndMetric = useMemo(() => {
    const map = {};

    displayRows.forEach((row) => {
      map[row.config] = {};

      METRICS.forEach(({ key }) => {
        map[row.config][key] = row[key];
      });
    });

    return map;
  }, [displayRows]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const metricKey = METRICS.find(
      (m) => m.label === label
    )?.key;

    return (
      <div
        style={{
          background:
            "rgba(15,15,25,0.96)",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius: "12px",
          padding: "12px 14px",
          fontSize: "12px",
          minWidth: "200px",
        }}
      >
        <div
          style={{
            color: "white",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          {label}
        </div>

        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              color: entry.color,
              marginBottom: "4px",
            }}
          >
            <span>
              {String(entry.dataKey).replaceAll(
                "_",
                " "
              )}
            </span>

            <span style={{ color: "white" }}>
              {rawByConfigAndMetric[
                entry.dataKey
              ]?.[metricKey] != null
                ? Number(
                    rawByConfigAndMetric[
                      entry.dataKey
                    ][metricKey]
                  ).toFixed(2)
                : "—"}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!displayRows.length) {
    return (
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color:
            "rgba(255,255,255,0.35)",
        }}
      >
        No configurations to compare yet.
      </p>
    );
  }

  return (
    <div>
      {rows.length > 7 && (
        <div
          style={{
            marginBottom: 14,
            fontSize: 12,
            color:
              "rgba(255,255,255,0.45)",
          }}
        >
          Showing top 7 of {rows.length} configurations.
        </div>
      )}

      <ResponsiveContainer
        width="100%"
        height={450}
      >
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            bottom: 20,
            left: 10,
          }}
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
          />

          <XAxis
            dataKey="metric"
            stroke="rgba(255,255,255,0.35)"
            tick={{
              fill:
                "rgba(255,255,255,0.6)",
              fontSize: 12,
            }}
          />

          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.35)"
            tick={{
              fill:
                "rgba(255,255,255,0.6)",
              fontSize: 11,
            }}
            label={{
              value: "Normalized Score",
              angle: -90,
              position: "insideLeft",
              fill:
                "rgba(255,255,255,0.45)",
              fontSize: 11,
            }}
          />

          <Tooltip
            content={<CustomTooltip />}
          />

          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{
              maxHeight: 70,
              overflowY: "auto",
              fontSize: 12,
            }}
            formatter={(value) => (
              <span
                style={{
                  color:
                    "rgba(255,255,255,0.7)",
                }}
              >
                {value.replaceAll(
                  "_",
                  " "
                )}
              </span>
            )}
          />

          {displayRows
            .sort(
              (a, b) =>
                (a.average_rank ?? 999) -
                (b.average_rank ?? 999)
            )
            .map((row, i) => (
              <Line
                key={row.config}
                type="monotone"
                name={row.config}
                dataKey={row.config}
                stroke={getColor(i)}
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: getColor(i),
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 7,
                }}
                connectNulls
              />
            ))}
        </LineChart>
      </ResponsiveContainer>

      <p
        style={{
          margin: "16px 0 0",
          fontSize: "11px",
          color:
            "rgba(255,255,255,0.3)",
        }}
      >
        Each metric is normalized from
        0–100 across all displayed
        configurations. Latency is
        inverted so higher always means
        better.
      </p>
    </div>
  );
}