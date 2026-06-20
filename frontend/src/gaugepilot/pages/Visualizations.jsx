import { useVisualizations } from "../hooks/useVisualizations";
import ScatterView from "../components/visualizations/ScatterView";
import HeatmapView from "../components/visualizations/HeatmapView";
import RadarView from "../components/visualizations/RadarView";
import ParallelCoordinatesView from "../components/visualizations/ParallelCoordinatesView";
import RankingBarView from "../components/visualizations/RankingBarView";
import BoxPlotView from "../components/visualizations/BoxPlotView";
import CorrelationMatrix from "../components/visualizations/CorrelationMatrix";
import ParetoView from "../components/visualizations/ParetoView";
import PerformanceProfile from "../components/visualizations/PerformanceProfile";

const SECTIONS = [
  { Component: ScatterView,             title: "Scatter Comparison",  desc: "Plot any two metrics against each other to spot correlations." },
  { Component: HeatmapView,             title: "Metric Heatmap",      desc: "Relative performance across every metric, configuration by configuration." },
  { Component: RadarView,               title: "Radar Profile",       desc: "Every configuration's shape across all five metrics, overlaid." },
  { Component: ParallelCoordinatesView, title: "Parallel Coordinates",desc: "Tradeoffs between metrics, one line per configuration." },
  { Component: RankingBarView,          title: "Ranking Distribution",desc: "Average rank per configuration, sorted best to worst." },
  { Component: BoxPlotView,             title: "Metric Distribution", desc: "Spread of each metric across all configurations." },
  { Component: CorrelationMatrix,       title: "Correlation Matrix",  desc: "How strongly each pair of metrics moves together." },
  { Component: ParetoView,              title: "Pareto Frontier",     desc: "Configurations that aren't dominated on both selected metrics." },
  { Component: PerformanceProfile,      title: "Performance Profile", desc: "How many metrics each configuration wins outright." },
];

export default function Visualizations({ leaderboard }) {
  const data = useVisualizations(leaderboard);

  const accent = "#4f6ef7";
  const green = "#22c55e";

  const card = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "24px",
  };

  const chip = (color = accent) => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "3px 10px", borderRadius: "999px",
    background: `${color}22`, border: `1px solid ${color}44`,
    color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
  });

  if (!data || data.length === 0) {
    return (
      <div id="visualizations" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <span style={{ fontSize: "30px", lineHeight: 1 }}>📈</span>
          <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 700, letterSpacing: "-0.5px", color: "white" }}>Visualizations</h1>
        </div>
        <div style={{
          ...card, minHeight: "260px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "16px", textAlign: "center",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "20px",
            background: "rgba(79,110,247,0.1)", border: "1px solid rgba(79,110,247,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
          }}>📈</div>
          <div>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white" }}>No Data To Visualize</p>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.35)", maxWidth: "360px", lineHeight: 1.6 }}>
              Run a benchmark to unlock scatter, heatmap, radar, parallel coordinates, ranking, distribution, correlation, Pareto, and performance comparisons.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="visualizations" style={{ maxWidth: "1240px", margin: "0 auto", padding: "28px 24px", fontFamily: "inherit" }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "30px", lineHeight: 1 }}>📈</span>
            <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 700, letterSpacing: "-0.5px", color: "white" }}>Visualizations</h1>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            Explore relationships, gaps, and tradeoffs across every benchmarked configuration.
          </p>
        </div>
        <div style={chip(green)}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: green, boxShadow: `0 0 6px ${green}`, display: "inline-block" }} />
          {data.length} Configuration{data.length !== 1 ? "s" : ""} Compared
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {SECTIONS.map(({ Component, title, desc }) => (
          <div key={title} style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{
              padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "white" }}>{title}</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{desc}</p>
            </div>
            <div style={{ padding: "24px" }}>
              <Component data={data} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
