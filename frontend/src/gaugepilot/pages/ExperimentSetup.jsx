import { useState } from "react";

import { useBenchmark } from "../hooks/useBenchmark";
import Leaderboards from "./Leaderboards";
import ExperimentSelector from "../components/ExperimentSelector";

export default function ExperimentSetup() {
  const {
    loading,
    results,
    error,
    executeBenchmark,
  } = useBenchmark();

  const [source, setSource] = useState("");
  const [questions, setQuestions] = useState("");

  const [model, setModel] =
    useState("llama-3.1-8b");

  const [
    retrievalMethod,
    setRetrievalMethod,
  ] = useState("hybrid");

  const [reranker, setReranker] =
    useState("minilm");

  const [
    enhancement,
    setEnhancement,
  ] = useState("default");

  const handleRun = async () => {
    const payload = {
      source,
      model,
      retrieval_method:
        retrievalMethod,
      reranker,
      enhancement,

      questions: questions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean),
    };

    const token =
      localStorage.getItem("token");

    await executeBenchmark(
      payload,
      token,
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="gauge-card">
        <h2
          style={{
            fontSize: "42px",
            marginBottom: "32px",
          }}
        >
          Experiment Setup
        </h2>

        <div
          style={{
            display: "flex",
            gap: "40px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          <ExperimentSelector
            label="Active Model"
            value={model}
            onChange={setModel}
            options={[
              {
                value:
                  "llama-3.1-8b",
                label:
                  "Llama 3.1 8B",
                description:
                  "Fast & Efficient",
              },
            ]}
          />

          <ExperimentSelector
            label="Retrieval Strategy"
            value={
              retrievalMethod
            }
            onChange={
              setRetrievalMethod
            }
            options={[
              {
                value: "hybrid",
                label: "Hybrid",
                description:
                  "Vector + BM25",
              },
              {
                value: "vector",
                label: "Vector",
                description:
                  "Embedding Search",
              },
              {
                value: "lexical",
                label: "BM25",
                description:
                  "Keyword Search",
              },
            ]}
          />

          <ExperimentSelector
            label="Reranker"
            value={reranker}
            onChange={
              setReranker
            }
            options={[
              {
                value:
                  "minilm",
                label: "MiniLM",
                description:
                  "Fast balanced baseline",
              },
            ]}
          />

          <ExperimentSelector
            label="Enhancements"
            value={enhancement}
            onChange={
              setEnhancement
            }
            options={[
              {
                value:
                  "default",
                label:
                  "Default",
                description:
                  "Standard pipeline",
              },
            ]}
          />
        </div>

        <input
          type="text"
          placeholder="Document name"
          value={source}
          onChange={(e) =>
            setSource(
              e.target.value,
            )
          }
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "14px 18px",
            borderRadius: "14px",
            border:
              "1px solid var(--border)",
            background:
              "var(--bg-primary)",
            color:
              "var(--text-primary)",
            marginBottom: "24px",
          }}
        />

        <textarea
          rows={10}
          placeholder="One question per line"
          value={questions}
          onChange={(e) =>
            setQuestions(
              e.target.value,
            )
          }
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "16px",
            border:
              "1px solid var(--border)",
            background:
              "var(--bg-primary)",
            color:
              "var(--text-primary)",
            marginBottom: "24px",
          }}
        />

        <button
          className="gauge-button"
          onClick={handleRun}
          disabled={loading}
          style={{
            padding:
              "14px 24px",
            borderRadius:
              "12px",
            border:
              "1px solid var(--border)",
            background:
              "var(--surface)",
            color:
              "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Running..."
            : "Run Benchmark"}
        </button>

        {error && (
          <p
            style={{
              color: "#ef4444",
              marginTop: "16px",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {results && (
        <div
          style={{
            marginTop: "24px",
          }}
        >
          <Leaderboards
            leaderboard={
              results.leaderboard
            }
          />
        </div>
      )}
    </div>
  );
}