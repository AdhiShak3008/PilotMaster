import ScatterView from "../components/visualizations/ScatterView";
import HeatmapView from "../components/visualizations/HeatmapView";
import useVisualizations from "../hooks/useVisualizations";

export default function Visualizations({
  leaderboard,
}) {
  const data =
    useVisualizations(leaderboard);

  return (
    <div
      style={{
        marginTop: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <div
        style={{
          background:
            "rgba(255,255,255,0.07)",
          border:
            "1px solid rgba(255,255,255,0.15)",
          borderRadius: "20px",
          padding: "24px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "white",
          }}
        >
          Scatter Analysis
        </h2>

        <ScatterView data={data} />
      </div>

      <div
        style={{
          background:
            "rgba(255,255,255,0.07)",
          border:
            "1px solid rgba(255,255,255,0.15)",
          borderRadius: "20px",
          padding: "24px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "white",
          }}
        >
          Metric Heatmap
        </h2>

        <HeatmapView data={data} />
      </div>
    </div>
  );
}