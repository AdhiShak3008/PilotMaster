from pilotcore.benchmarking.benchmark_runner import run_benchmark
from pilotcore.benchmarking.leaderboard import (
    generate_overall_leaderboard,
)

results = run_benchmark()

leaderboard = generate_overall_leaderboard(results)

print("\n=== OVERALL LEADERBOARD ===\n")

for rank, result in enumerate(leaderboard, start=1):
    print(f"{rank}. " f"{result.config_name}")
