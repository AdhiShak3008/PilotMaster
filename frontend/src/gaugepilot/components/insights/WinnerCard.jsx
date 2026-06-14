 
export default function WinnerCard({
  config,
  averageRank,
}) {
  return (
    <div>
      <h3>Best Overall</h3>

      <p>{config}</p>

      <small>
        Average Rank: {averageRank}
      </small>
    </div>
  );
}