import RecommendationCard from "../components/insights/RecommendationCard";

import WinnerCard from "../components/insights/WinnerCard";

import TradeoffCard from "../components/insights/TradeoffCard";

export default function Insights({
  leaderboard,
}) {
  if (
    !leaderboard ||
    !leaderboard.overall ||
    leaderboard.overall.length === 0
  ) {
    return (
      <div id="insights">
        <h2>Insights</h2>

        <div className="gauge-card">
          Run a benchmark to see
          insights.
        </div>
      </div>
    );
  }

  const winner =
    leaderboard.overall[0];

  const fastest =
    leaderboard.latency?.[0];

  return (
    <div id="insights">
      <h2>Insights</h2>

      <WinnerCard
        config={winner.config_name}
        averageRank={
          winner.average_rank
        }
      />

      {fastest && (
        <TradeoffCard
          config={
            fastest.config_name
          }
          latency={fastest.value}
        />
      )}

      <RecommendationCard
        title="Recommended Setup"
        value={
          winner.config_name
        }
      />
    </div>
  );
}