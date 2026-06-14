import ExperimentSetup from "./pages/ExperimentSetup";

export default function GaugePilot() {
  return (
    <div className="gauge-root">

      <aside className="gauge-sidebar">

        <h1 className="gauge-title">
          GaugePilot
        </h1>

        <div className="gauge-nav">

          <button className="gauge-nav-button">
            Experiment Setup
          </button>

          <button className="gauge-nav-button">
            Leaderboards
          </button>

          <button className="gauge-nav-button">
            Visualizations
          </button>

          <button className="gauge-nav-button">
            Insights
          </button>

          <button className="gauge-nav-button">
            Recommendations
          </button>

        </div>

      </aside>

      <main className="gauge-main">
        <ExperimentSetup />
      </main>

    </div>
  );
}