// ─── GAUGEPILOT CONFIGURATION PARSER & LABELING UTILITIES ─────────────────────

/**
 * Parses raw configuration names (e.g., "gpt-oss-120b vector none Default",
 * "gpt-oss-120b_hybrid_minilm_parent_child_all-mpnet-base-v2_Multi_Query_Query_Rewrite",
 * "Hybrid+MiniLM", "BM25", "Vector_Only") into a structured architectural breakdown.
 */
export function parseConfigDetails(configName) {
  if (!configName || typeof configName !== "string") {
    return {
      model: "Standard LLM",
      retrieval: "Hybrid (Dense + BM25)",
      reranker: "None",
      chunker: "Parent-Child (1200/300)",
      embedding: "all-mpnet-base-v2",
      enhancements: ["Default (Baseline)"],
      rawName: configName || "—",
    };
  }

  const raw = configName;
  const lower = configName.toLowerCase().replaceAll("_", " ");

  // 1. Detect Model
  let model = "GPT-OSS 120B";
  if (lower.includes("llama-3.3-70b") || lower.includes("llama 3.3 70b") || lower.includes("llama3")) {
    model = "Llama 3.3 70B";
  } else if (lower.includes("gpt-oss-120b") || lower.includes("gpt oss 120b") || lower.includes("gptoss")) {
    model = "GPT-OSS 120B";
  } else if (lower.includes("gemini-1.5-flash") || lower.includes("gemini 1.5 flash") || lower.includes("gemini")) {
    model = "Gemini 1.5 Flash";
  } else if (lower.includes("mixtral")) {
    model = "Mixtral 8x7B";
  }

  // 2. Detect Retrieval Method
  let retrieval = "Hybrid (Dense + BM25)";
  if (lower.includes("vector only") || (lower.includes("vector") && !lower.includes("hybrid"))) {
    retrieval = "Vector (Dense FAISS)";
  } else if (lower.includes("lexical") || lower.includes("bm25") && !lower.includes("hybrid")) {
    retrieval = "Lexical (BM25 Keyword)";
  } else if (lower.includes("hybrid")) {
    retrieval = "Hybrid (Dense + BM25)";
  }

  // 3. Detect Reranker
  let reranker = "None (Direct First-Stage)";
  if (lower.includes("minilm")) {
    reranker = "MiniLM Cross-Encoder";
  } else if (lower.includes("tinybert")) {
    reranker = "TinyBERT (Low-Latency)";
  } else if (lower.includes("bge large") || lower.includes("bge-large")) {
    reranker = "BGE Large Cross-Encoder";
  } else if (lower.includes("bge m3") || lower.includes("bge-m3")) {
    reranker = "BGE M3 Reranker";
  } else if (lower.includes("noreranker") || lower.includes("none")) {
    reranker = "None (Direct First-Stage)";
  }

  // 4. Detect Chunker
  let chunker = "Parent-Child (1200/300)";
  if (lower.includes("contextual")) {
    chunker = "Contextual Chunking";
  } else if (lower.includes("structure")) {
    chunker = "Structure-Aware";
  } else if (lower.includes("semantic")) {
    chunker = "Semantic Boundary";
  } else if (lower.includes("recursive")) {
    chunker = "Recursive Splitter";
  } else if (lower.includes("fixed")) {
    chunker = "Fixed Window (500c)";
  } else if (lower.includes("token")) {
    chunker = "Fixed Token (512)";
  } else if (lower.includes("parent child") || lower.includes("parent_child")) {
    chunker = "Parent-Child (1200/300)";
  }

  // 5. Detect Embedding Model
  let embedding = "all-mpnet-base-v2";
  if (lower.includes("bge-large-en") || lower.includes("bge large en")) {
    embedding = "bge-large-en-v1.5";
  } else if (lower.includes("text-embedding-3-small")) {
    embedding = "text-embedding-3-small";
  } else if (lower.includes("all-mpnet-base-v2") || lower.includes("mpnet")) {
    embedding = "all-mpnet-base-v2";
  }

  // 6. Detect Enhancements
  const enhancements = [];
  if (lower.includes("query rewrite") || lower.includes("query_rewrite")) enhancements.push("Query Rewrite");
  if (lower.includes("multi query") || lower.includes("multi_query")) enhancements.push("Multi-Query");
  if (lower.includes("hyde")) enhancements.push("HyDE");
  if (lower.includes("step back") || lower.includes("step_back")) enhancements.push("Step-Back Prompting");
  if (lower.includes("query expansion") || lower.includes("query_expansion")) enhancements.push("Query Expansion");
  if (lower.includes("sub query") || lower.includes("sub_query")) enhancements.push("Sub-Query Decomposition");
  if (lower.includes("metadata")) enhancements.push("Metadata Filtering");
  if (lower.includes("routing")) enhancements.push("Intent Routing");
  if (lower.includes("graph")) enhancements.push("GraphRAG");
  if (lower.includes("compression")) enhancements.push("Context Compression");

  if (enhancements.length === 0) {
    enhancements.push("Default (Baseline Pipeline)");
  }

  return {
    model,
    retrieval,
    reranker,
    chunker,
    embedding,
    enhancements,
    rawName: raw,
  };
}

/**
 * Builds a deterministic mapping from raw config name -> "Config 1", "Config 2", etc.
 * Orders configs by overall leaderboard rank when available, or by appearance.
 */
export function buildConfigLabelMap(leaderboardOrConfigs) {
  const map = new Map();
  let index = 1;

  if (!leaderboardOrConfigs) return map;

  // Case 1: Leaderboard object with overall array
  if (leaderboardOrConfigs.overall && Array.isArray(leaderboardOrConfigs.overall)) {
    leaderboardOrConfigs.overall.forEach((row) => {
      const name = row?.config_name || row?.config;
      if (name && !map.has(name)) {
        map.set(name, `Config ${index++}`);
      }
    });
  }

  // Case 2: Array of rows/configs or visualization items
  if (Array.isArray(leaderboardOrConfigs)) {
    leaderboardOrConfigs.forEach((item) => {
      const name = typeof item === "string" ? item : (item?.config_name || item?.config);
      if (name && !map.has(name)) {
        map.set(name, `Config ${index++}`);
      }
    });
  }

  // Also check other categories in leaderboard object
  if (typeof leaderboardOrConfigs === "object" && !Array.isArray(leaderboardOrConfigs)) {
    Object.values(leaderboardOrConfigs).forEach((categoryRows) => {
      if (Array.isArray(categoryRows)) {
        categoryRows.forEach((row) => {
          const name = row?.config_name || row?.config;
          if (name && !map.has(name)) {
            map.set(name, `Config ${index++}`);
          }
        });
      }
    });
  }

  return map;
}

/**
 * Helper to resolve a config's display label ("Config 1", "Config 2", etc.).
 */
export function getConfigDisplayLabel(configName, labelMap = null, fallbackIndex = null) {
  if (labelMap && labelMap.has(configName)) {
    return labelMap.get(configName);
  }
  if (fallbackIndex != null) {
    return `Config ${fallbackIndex + 1}`;
  }
  return configName || "Config";
}
