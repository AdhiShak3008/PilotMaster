export default function OverallTable({
  data,
}) {
  if (!data || data.length === 0) {
    return (
      <div>
        No leaderboard data.
      </div>
    );
  }

  const isOverall =
    data[0]?.metrics !== undefined;

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle = {
    textAlign: "left",
    padding: "16px",
    borderBottom:
      "1px solid var(--border)",
    color: "var(--text-secondary)",
  };

  const tdStyle = {
    padding: "14px 16px",
  };

  const rowStyle = {
    borderBottom:
      "1px solid var(--border)",
  };

  if (!isOverall) {
    return (
      <div
        style={{
          overflowX: "auto",
        }}
      >
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>
                Rank
              </th>

              <th style={thStyle}>
                Config
              </th>

              <th style={thStyle}>
                Value
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((row) => (
              <tr
                key={row.config_name}
                style={rowStyle}
              >
                <td style={tdStyle}>
                  {row.rank}
                </td>

                <td style={tdStyle}>
                  {row.config_name}
                </td>

                <td style={tdStyle}>
                  {typeof row.value ===
                  "number"
                    ? row.value.toFixed(
                        4,
                      )
                    : row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
      }}
    >
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>
              Rank
            </th>

            <th style={thStyle}>
              Config
            </th>

            <th style={thStyle}>
              Average Rank
            </th>

            <th style={thStyle}>
              Faithfulness
            </th>

            <th style={thStyle}>
              Grounding
            </th>

            <th style={thStyle}>
              Retrieval
            </th>

            <th style={thStyle}>
              Coverage
            </th>

            <th style={thStyle}>
              Latency
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map(
            (
              row,
              index,
            ) => (
              <tr
                key={
                  row.config_name
                }
                style={rowStyle}
              >
                <td style={tdStyle}>
                  {index + 1}
                </td>

                <td style={tdStyle}>
                  {
                    row.config_name
                  }
                </td>

                <td style={tdStyle}>
                  {row.average_rank}
                </td>

                <td style={tdStyle}>
                  {row.metrics.faithfulness?.toFixed(
                    4,
                  )}
                </td>

                <td style={tdStyle}>
                  {row.metrics.semantic_grounding?.toFixed(
                    4,
                  )}
                </td>

                <td style={tdStyle}>
                  {row.metrics.retrieval_quality_score?.toFixed(
                    4,
                  )}
                </td>

                <td style={tdStyle}>
                  {row.metrics.semantic_query_coverage?.toFixed(
                    4,
                  )}
                </td>

                <td style={tdStyle}>
                  {Math.round(
                    row.metrics
                      .latency,
                  )}
                  ms
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}