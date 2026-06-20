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

    if (!values.length) {
      map[key] = () => null;
      return;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    map[key] = (v) => {
      if (v == null) {
        return null;
      }

      const t =
        range === 0
          ? 1
          : (v - min) / range;

      const goodness =
        LOWER_IS_BETTER.has(key)
          ? 1 - t
          : t;

      return Math.round(
        goodness * 100
      );
    };
  });

  return map;
}

export default function RadarView({
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
    () =>
      buildNormalizers(
        displayRows
      ),
    [displayRows]
  );

  const chartData = useMemo(
    () =>
      METRICS.map(
        ({ key, label }) => {
          const point = {
            metric: label,
          };

          displayRows.forEach(
            (row) => {
              point[row.config] =
                normalizers[key](
                  row[key]
                ) ?? 0;
            }
          );

          return point;
        }
      ),
    [displayRows, normalizers]
  );

  const rawMap = useMemo(() => {
    const map = {};

    displayRows.forEach((row) => {
      map[row.config] = {};

      METRICS.forEach(
        ({ key }) => {
          map[row.config][key] =
            row[key];
        }
      );
    });

    return map;
  }, [displayRows]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }) => {
    if (
      !active ||
      !payload?.length
    ) {
      return null;
    }

    const metricKey =
      METRICS.find(
        (m) =>
          m.label === label
      )?.key;

    return (
      <div
        style={{
          background:
            "rgba(15,15,25,0.97)",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding:
            "12px 14px",
          fontSize: 12,
          minWidth: 220,
        }}
      >
        <div
          style={{
            color: "white",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {label}
        </div>

        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              gap: 14,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                color:
                  entry.color,
              }}
            >
              {entry.dataKey}
            </div>

            <div
              style={{
                textAlign:
                  "right",
                color:
                  "rgba(255,255,255,0.9)",
              }}
            >
              <div>
                Score:{" "}
                {entry.value}
              </div>

              <div
                style={{
                  color:
                    "rgba(255,255,255,0.55)",
                  fontSize: 11,
                }}
              >
                Raw:{" "}
                {rawMap[
                  entry.dataKey
                ]?.[
                  metricKey
                ] != null
                  ? Number(
                      rawMap[
                        entry
                          .dataKey
                      ][
                        metricKey
                      ]
                    ).toFixed(
                      2
                    )
                  : "—"}
              </div>
            </div>
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
          fontSize: 13,
          color:
            "rgba(255,255,255,0.35)",
        }}
      >
        No configurations to
        profile yet.
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
          Showing top 7 of{" "}
          {rows.length} configurations.
        </div>
      )}

      <ResponsiveContainer
        width="100%"
        height={550}
      >
        <RadarChart
          data={chartData}
          outerRadius="82%"
        >
          <PolarGrid
            stroke="rgba(255,255,255,0.08)"
          />

          <PolarAngleAxis
            dataKey="metric"
            tick={{
              fill:
                "rgba(255,255,255,0.7)",
              fontSize: 13,
            }}
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{
              fill:
                "rgba(255,255,255,0.3)",
              fontSize: 11,
            }}
          />

          <Tooltip
            content={
              <CustomTooltip />
            }
          />

          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{
              fontSize: 12,
              maxHeight: 70,
              overflowY: "auto",
            }}
            formatter={(
              value
            ) => (
              <span
                style={{
                  color:
                    "rgba(255,255,255,0.7)",
                }}
              >
                {value}
              </span>
            )}
          />

          {displayRows.map(
            (row, i) => (
              <Radar
                key={row.config}
                name={
                  row.config
                }
                dataKey={
                  row.config
                }
                stroke={getColor(
                  i
                )}
                fill={getColor(i)}
                fillOpacity={
                  0.12
                }
                strokeWidth={2}
              />
            )
          )}
        </RadarChart>
      </ResponsiveContainer>

      <p
        style={{
          margin:
            "16px 0 0",
          fontSize: 11,
          color:
            "rgba(255,255,255,0.3)",
        }}
      >
        Each axis is
        normalized from 0–100
        across all displayed
        configurations.
        Latency is inverted so
        further outward always
        means better.
      </p>
    </div>
  );
}