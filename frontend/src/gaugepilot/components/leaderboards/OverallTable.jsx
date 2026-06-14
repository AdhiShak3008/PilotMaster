export default function OverallTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: "60px 24px", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "12px", textAlign: "center",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "14px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
        }}>📭</div>
        <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>No data for this metric</p>
        <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>Run a benchmark to populate this leaderboard.</p>
      </div>
    );
  }

  const isOverall = data[0]?.metrics !== undefined;

  const formatConfigName = (name) =>
    name?.replaceAll("_", " ").replaceAll("+", " + ")
      .replace("NoRewrite", "(No Rewrite)").replace("NoReranker", "(No Reranker)") ?? "";

  const getMedal = (rank) => {
    if (rank === 1) return { label: "🥇", color: "#f59e0b" };
    if (rank === 2) return { label: "🥈", color: "#94a3b8" };
    if (rank === 3) return { label: "🥉", color: "#cd7c3a" };
    return { label: String(rank), color: "rgba(255,255,255,0.3)" };
  };

  const rowHighlight = (index) => {
    if (index === 0) return "rgba(245,158,11,0.04)";
    if (index === 1) return "rgba(148,163,184,0.03)";
    if (index === 2) return "rgba(205,124,58,0.03)";
    return "transparent";
  };

  const th = {
    padding: "14px 20px",
    background: "rgba(255,255,255,0.025)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontWeight: 600, fontSize: "11px", letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.72)", textAlign: "left",
    whiteSpace: "nowrap", textTransform: "uppercase",
    position: "sticky", top: 0, zIndex: 1,
  };

  const td = {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    fontSize: "13px", color: "rgba(255,255,255,0.8)",
    transition: "background 0.15s",
  };

  const latencyColor = (ms) => {
    if (!ms) return "rgba(255,255,255,0.5)";
    if (ms < 900)  return "#7CFF6B";
    if (ms < 1200) return "#FFC857";
    return "#FF6B6B";
  };

  const metricCell = (value) => (
    <span style={{
      fontFamily: "'Courier New', monospace", fontSize: "13px",
      fontWeight: 600, color: "rgba(255,255,255,0.75)",
    }}>
      {typeof value === "number" ? value.toFixed(3) : "—"}
    </span>
  );

  if (!isOverall) {
    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: "600px" }}>
          <thead>
            <tr>
              <th style={{ ...th, width: "70px", textAlign: "center" }}>Rank</th>
              <th style={th}>Configuration</th>
              <th style={{ ...th, textAlign: "right" }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const medal = getMedal(i + 1);
              return (
                <tr
                  key={row.config_name}
                  style={{ background: rowHighlight(i), transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(79,110,247,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = rowHighlight(i)}
                >
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: "8px",
                      background: i < 3 ? `${medal.color}18` : "rgba(255,255,255,0.04)",
                      fontSize: i < 3 ? "16px" : "12px",
                      fontWeight: 700, color: medal.color,
                    }}>{medal.label}</span>
                  </td>
                  <td style={td}>
                    <span style={{ fontWeight: i === 0 ? 600 : 400 }}>{formatConfigName(row.config_name)}</span>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {metricCell(row.value)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "center", width: "60px" }}>Rank</th>
            <th style={th}>Configuration</th>
            <th style={{ ...th, textAlign: "right" }}>Avg Rank</th>
            <th style={{ ...th, textAlign: "right" }}>Faithfulness</th>
            <th style={{ ...th, textAlign: "right" }}>Grounding</th>
            <th style={{ ...th, textAlign: "right" }}>Retrieval</th>
            <th style={{ ...th, textAlign: "right" }}>Coverage</th>
            <th style={{ ...th, textAlign: "right" }}>Latency</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const medal = getMedal(i + 1);
            return (
              <tr
                key={row.config_name}
                style={{ background: rowHighlight(i), transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(79,110,247,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = rowHighlight(i)}
              >
                <td style={{ ...td, textAlign: "center" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: "8px",
                    background: i < 3 ? `${medal.color}18` : "rgba(255,255,255,0.04)",
                    fontSize: i < 3 ? "16px" : "12px",
                    fontWeight: 700, color: medal.color,
                  }}>{medal.label}</span>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {i === 0 && (
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "2px 6px",
                        borderRadius: "4px", background: "rgba(245,158,11,0.15)",
                        border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b",
                        letterSpacing: "0.05em", textTransform: "uppercase",
                      }}>Best</span>
                    )}
                    <span style={{ fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "white" : "rgba(255,255,255,0.75)" }}>
                      {formatConfigName(row.config_name)}
                    </span>
                  </div>
                </td>
                <td style={{ ...td, textAlign: "right" }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                    {row.average_rank}
                  </span>
                </td>
                <td style={{ ...td, textAlign: "right" }}>{metricCell(row.metrics?.faithfulness)}</td>
                <td style={{ ...td, textAlign: "right" }}>{metricCell(row.metrics?.semantic_grounding)}</td>
                <td style={{ ...td, textAlign: "right" }}>{metricCell(row.metrics?.retrieval_quality_score)}</td>
                <td style={{ ...td, textAlign: "right" }}>{metricCell(row.metrics?.semantic_query_coverage)}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <span style={{
                    fontFamily: "'Courier New', monospace", fontWeight: 700,
                    color: latencyColor(row.metrics?.latency),
                    textShadow: `0 0 8px ${latencyColor(row.metrics?.latency)}55`,
                  }}>
                    {Math.round(row.metrics?.latency || 0)} ms
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}