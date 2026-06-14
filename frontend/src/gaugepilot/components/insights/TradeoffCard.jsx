 
export default function TradeoffCard({
  config,
  latency,
}) {
  return (
    <div>
      <h3>Fastest Configuration</h3>

      <p>{config}</p>

      <small>
        Latency: {Math.round(latency)} ms
      </small>
    </div>
  );
}