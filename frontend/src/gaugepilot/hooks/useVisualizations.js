// Normalizes the leaderboard payload (separate ranked arrays per metric —
// overall / faithfulness / grounding / retrieval_quality / query_coverage /
// latency, each shaped like [{ config_name, value, ... }]) into one flat row
// per configuration:
//
//   { config, faithfulness, grounding, quality, coverage, latency }
//
// This is the shape every visualization component consumes, so charts never
// need to know about the underlying leaderboard structure.
//
// Defensive by design: if a row already carries a nested `metrics` object
// (e.g. { config_name, metrics: { faithfulness, semantic_grounding, ... } }),
// that takes priority over the per-category `value` field, so this keeps
// working if the API response shape evolves either way.

const CATEGORY_TO_METRIC = {
  faithfulness: "faithfulness",
  grounding: "grounding",
  retrieval_quality: "quality",
  query_coverage: "coverage",
  latency: "latency",
};

const NESTED_METRICS_KEY = {
  faithfulness: "faithfulness",
  grounding: "semantic_grounding",
  retrieval_quality: "retrieval_quality_score",
  query_coverage: "semantic_query_coverage",
  latency: "latency",
};

function extractValue(row, category) {
  if (row == null) return null;

  if (row.metrics && typeof row.metrics === "object") {
    const nestedKey = NESTED_METRICS_KEY[category];
    const nestedValue = row.metrics[nestedKey];
    if (nestedValue != null) return nestedValue;
  }

  return row.value ?? row.score ?? null;
}

export function useVisualizations(leaderboard) {
  if (!leaderboard) return [];

  const configMap = new Map();
  const ensureConfig = (name) => {
    if (!configMap.has(name)) configMap.set(name, { config: name });
    return configMap.get(name);
  };

  // Seed every config that appears anywhere in the leaderboard first, so a
  // configuration missing one metric still shows up with the rest filled in.
  Object.values(leaderboard).forEach((rows) => {
    (rows ?? []).forEach((row) => {
      if (row?.config_name) ensureConfig(row.config_name);
    });
  });

  Object.entries(CATEGORY_TO_METRIC).forEach(([category, metricKey]) => {
    (leaderboard[category] ?? []).forEach((row) => {
      if (!row?.config_name) return;
      const target = ensureConfig(row.config_name);
      target[metricKey] = extractValue(row, category);
    });
  });

  return Array.from(configMap.values());
}

export default useVisualizations;