 
import { useState } from "react";

import { runBenchmark } from "../api";

export function useBenchmark() {
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState(null);

  const [error, setError] = useState(null);

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