 
import OverallTable from "../components/leaderboards/OverallTable";

export default function Leaderboards({
  leaderboard,
}) {
  if (!leaderboard) {
    return (
      <div>
        No benchmark results yet.
      </div>
    );
  }

  return (
    <div>
      <h2>Leaderboards</h2>

      <OverallTable
        data={leaderboard.overall}
      />
    </div>
  );
}