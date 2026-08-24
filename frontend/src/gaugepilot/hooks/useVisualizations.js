import { buildConfigLabelMap, parseConfigDetails } from "../utils/configUtils";

// Normalizes the leaderboard payload into one flat row per configuration:
//   { config, configLabel, configDetails, faithfulness, grounding, quality, coverage, latency, averageRank }

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

  const labelMap = buildConfigLabelMap(leaderboard);
  const configMap = new Map();

  const ensureConfig = (name) => {
    if (!configMap.has(name)) {
      configMap.set(name, {
        config: name,
        configLabel: labelMap.get(name) || `Config ${configMap.size + 1}`,
        configDetails: parseConfigDetails(name),
      });
    }
    return configMap.get(name);
  };

  // Seed every config that appears anywhere in the leaderboard first
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

  (leaderboard.overall ?? []).forEach((row) => {
    if (!row?.config_name) return;
    const target = ensureConfig(row.config_name);
    target.averageRank = row.average_rank ?? row.avg_rank ?? row.value ?? null;
  });

  return Array.from(configMap.values());
}

export default useVisualizations;
