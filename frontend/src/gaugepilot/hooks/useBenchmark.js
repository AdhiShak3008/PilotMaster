import { useState, useEffect } from "react";

import {
  runBenchmark,
  getBenchmarkRuns,
} from "../api";
export function useBenchmark() {
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState(null);

  const [error, setError] = useState(null);

  useEffect(() => {
  const loadLatestRun = async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) return;

      const runs =
        await getBenchmarkRuns(token);

      if (!runs.length) return;

      const latest =
  runs.sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  )[0];

      setResults({
        leaderboard:
          JSON.parse(
            latest.leaderboard_json
          ),
      });

    } catch (err) {
      console.error(err);
    }
  };

  loadLatestRun();
}, []);
  const executeBenchmark = async (
    payload,
    token,
  ) => {
    try {
      setLoading(true);

      setError(null);

      const data = await runBenchmark(
        payload,
        token,
      );

      setResults(data);

      return data;
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Benchmark failed",
      );

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    results,
    error,
    executeBenchmark,
  };
}
