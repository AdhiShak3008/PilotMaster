---
title: PilotMaster
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🚀 PilotMaster

<p align="center">
  <h3 align="center">Retrieval Engineering • Document Intelligence • Benchmarking • AI Observability</h3>
</p>

<p align="center">
PilotMaster is an end-to-end platform for building, debugging, evaluating, benchmarking, and improving Retrieval-Augmented Generation (RAG) systems.
</p>

---

## Live Demo

🔗 [PilotMaster](https://pilot-master.vercel.app/)

# Table of Contents

- [The Story Behind PilotMaster](#the-story-behind-pilotmaster)
- [Why PilotMaster Exists](#why-pilotmaster-exists)
- [Platform Philosophy](#platform-philosophy)
- [Two Operating Modes](#two-operating-modes)
- [Platform Overview](#platform-overview)
- [Unified Workflow](#unified-workflow)
- [Architecture](#architecture)
- [Retrieval Pipeline](#retrieval-pipeline)
- [DocPilot](#docpilot)
- [TracePilot](#tracepilot)
- [GaugePilot](#gaugepilot)
- [PilotCore](#pilotcore)
- [Experimentation Framework](#experimentation-framework)
- [Evaluation Framework](#evaluation-framework)
- [Tech Stack](#tech-stack)
- [Roadmap](#roadmap)
- [Local Setup](#local-setup)
- [Contributing](#contributing)

---

# The Story Behind PilotMaster

PilotMaster did not begin as a single platform.

It started as two completely independent projects.

## 📄 DocPilot

DocPilot originally began as a simple **chat-with-your-documents RAG application**.

The goal was straightforward:

1. Upload a document.
2. Ask a question.
3. Receive a grounded answer.
4. Display citations.

Over time, it evolved into a far more capable document intelligence system supporting:

- OCR ingestion
- Runtime model selection
- Retrieval experimentation
- Multi-model comparisons
- Production and experimental workflows

---

## 🔍 TracePilot

TracePilot originally began as a lightweight **text-file based RAG evaluator**.

The original idea was simply:

> "What exactly happened inside my RAG pipeline?"

That tiny evaluator eventually evolved into an observability platform capable of:

- Retrieval diagnostics
- Ranking inspection
- Replayable traces
- Hallucination analysis
- Retrieval agreement analysis
- Evaluation metrics

---

## ⚙️ The Birth of PilotCore

As both projects matured, they started solving the exact same problems.

Both required:

- Retrieval
- Embeddings
- Reranking
- Prompt construction
- Generation
- Evaluation
- Tracing

Maintaining separate implementations became increasingly painful.

The solution was to extract everything shared into a common execution engine.

That engine became:

# ⚙️ PilotCore

PilotCore is the shared kernel powering every workflow inside the platform.

Today:

- DocPilot runs on PilotCore.
- TracePilot runs on PilotCore.
- GaugePilot runs on PilotCore.

---

## 🔬 The Emergence of GaugePilot

As experimentation increased, another question emerged:

> Which configuration actually performs best?

This eventually led to the creation of **GaugePilot**.

GaugePilot exists to benchmark and compare:

- Retrieval strategies
- Models
- Rerankers
- Query enhancements
- End-to-end configurations

GaugePilot currently exists exclusively inside **Experimental Mode**.

---

# Why PilotMaster Exists

Most RAG applications expose only the final answer.

A document is uploaded.

A question is asked.

An answer is returned.

Everything in between is hidden.

Questions that usually remain unanswered:

- What was retrieved?
- Why was it retrieved?
- Which retriever found the evidence?
- Was the answer grounded?
- Did the model hallucinate?
- Did reranking improve anything?
- Which configuration performs best?
- Which model is actually superior?

PilotMaster was built to answer those questions.

---

# Why PilotMaster is Different

Most RAG applications focus primarily on generating answers.

PilotMaster focuses on understanding, debugging, evaluating, and improving the entire retrieval process.

| Typical RAG App                             | PilotMaster                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Returns only the final answer               | Exposes the entire retrieval journey                                     |
| Hidden retrieval process                    | Full retrieval observability                                             |
| No explanation of why chunks were retrieved | Chunk lineage and provenance tracking                                    |
| Limited debugging capabilities              | Replayable traces and diagnostics                                        |
| Single retrieval strategy                   | Runtime retrieval experimentation                                        |
| Fixed model configuration                   | Runtime model switching                                                  |
| No benchmarking tools                       | Built-in benchmarking with GaugePilot                                    |
| Difficult to compare configurations         | Leaderboards and comparative evaluation                                  |
| Minimal evaluation metrics                  | Grounding, faithfulness, coverage, latency, hallucination risk, and more |
| Retrieval treated as a black box            | Retrieval treated as a first-class engineering problem                   |
| Little insight into reranking               | Reranker confidence, margin, and scoring analysis                        |
| No understanding of retriever agreement     | Retrieval agreement analysis                                             |
| Hard to reproduce failures                  | Replayable and inspectable executions                                    |
| Little support for research workflows       | Dedicated Experimental Mode                                              |
| Focuses only on generation                  | Focuses on retrieval, observability, and experimentation                 |
| One-size-fits-all interface                 | Separate Production and Experimental modes                               |
| No way to determine the best configuration  | Benchmarking and configuration ranking                                   |
| Usually a single application                | Unified platform of DocPilot, TracePilot, GaugePilot, and PilotCore      |

PilotMaster treats retrieval not as a hidden implementation detail, but as an engineering discipline that can be inspected, evaluated, and systematically improved.

---

# Platform Philosophy

PilotMaster is built around several core beliefs.

## 1. Retrieval Quality Matters More Than People Think

Generation quality has improved dramatically.

Retrieval quality remains one of the biggest bottlenecks in RAG systems.

---

## 2. Observability Is Not Optional

You cannot improve what you cannot inspect.

---

## 3. Benchmarking Should Be Easy

Experimentation should not require rewriting the entire pipeline.

---

## 4. Everything Should Be Reproducible

Every execution should be:

- inspectable
- benchmarkable
- replayable

---

# Two Operating Modes

## 🏭 Production Mode

Designed for everyday document intelligence workflows.

Features:

- Stable pipelines
- Fast execution
- Minimal controls
- Grounded question answering
- Citations

---

## 🧪 Experimental Mode

Designed for retrieval engineering and research.

Features:

- Runtime model switching
- Embedding experimentation
- Reranker experimentation
- Query enhancement testing
- Benchmarking
- Comparative evaluation
- Observability tooling

GaugePilot currently exists exclusively inside Experimental Mode.

---

# Platform Overview

## 📄 DocPilot

The document intelligence workspace.

Provides:

- Document ingestion
- OCR processing
- Grounded QA
- Citations
- Runtime model selection
- Retrieval experimentation
- Multi-model comparisons

---

## 🔍 TracePilot

The observability workspace.

Provides:

- Retrieval diagnostics
- Replayable traces
- Hallucination analysis
- Evaluation metrics
- Retrieval agreement analysis
- Chunk lineage inspection

---

## 🔬 GaugePilot

The benchmarking workspace.

Provides:

- Configuration benchmarking
- Leaderboards
- Correlation analysis
- Pareto frontier analysis
- Comparative evaluation
- Metric visualizations

---

## ⚙️ PilotCore

The shared execution engine.

Provides:

- Retrieval
- Fusion
- Reranking
- Prompt construction
- Generation
- Evaluation
- Tracing
- Benchmark execution

---

# Unified Workflow

```text
Upload Document
        ↓
     Ask Question
        ↓
   Review Citations
        ↓
 Inspect Retrieved Chunks
        ↓
 Analyze Ranking Signals
        ↓
 Evaluate Answer Quality
        ↓
      Replay Trace
        ↓
 Benchmark Configurations
        ↓
 Compare Models
```

---

# Architecture

```text
Frontend
    ↓
FastAPI
    ↓
PilotCore
    ↓
Retrieval
    ↓
Fusion
    ↓
Reranking
    ↓
Generation
    ↓
Evaluation
    ↓
Trace Storage
```

---

# Project Structure

```text
PilotMaster/
├── DocPilot/
├── GaugePilot/
├── TracePilot/
├── pilotcore/
├── frontend/
├── docs/
└── scripts/
```

---

# Retrieval Pipeline

```text
Query
  ↓
Dense Retrieval
  ↓
BM25 Retrieval
  ↓
Reciprocal Rank Fusion
  ↓
Candidate Pool
  ↓
Cross-Encoder Reranking
  ↓
Context Selection
  ↓
LLM Generation
  ↓
Evaluation
  ↓
Trace Storage
```

---

# Dense Retrieval

Semantic retrieval uses:

- SentenceTransformers
- FAISS
- Cosine Similarity
- IndexFlatIP
- IndexFlatL2

Responsibilities:

- Concept matching
- Semantic recall
- Contextual retrieval

---

# BM25 Retrieval

Responsibilities:

- Exact terminology
- Acronyms
- Keywords
- Lexical precision
- Negation-sensitive retrieval

---

# Reciprocal Rank Fusion (RRF)

Combines:

- Dense rankings
- BM25 rankings

Benefits:

- Better recall
- Stable rankings
- Reduced retriever bias

---

# Cross Encoder Reranking

Supported families:

- MiniLM
- TinyBERT
- BGE Large
- BGE M3

Responsibilities:

- Candidate rescoring
- Precision improvement
- Evidence prioritization

---

# DocPilot

DocPilot is the primary user-facing workspace.

Capabilities:

- Upload documents
- Ask questions
- Inspect citations
- Compare models
- Experiment with retrieval

---

# TracePilot

TracePilot exposes the internal behavior of the system.

## Per Chunk Diagnostics

- Dense Score
- Dense Rank
- BM25 Score
- BM25 Rank
- RRF Score
- Reranker Score
- Confidence
- Margin
- Final Rank

## Replayable Traces

Replay enables:

- Regression testing
- Retrieval debugging
- Experimentation
- Ranking inspection

---

# GaugePilot

GaugePilot focuses on comparative evaluation.

## Benchmarking Features

- Configuration Leaderboards
- Correlation Matrix
- Pareto Frontier Analysis
- Configuration History
- Comparative Evaluation
- Multi-run Benchmarking

## Evaluation Metrics

- Retrieval Quality
- Grounding
- Faithfulness
- Query Coverage
- Answerability
- Hallucination Risk
- Latency

---

# PilotCore

PilotCore acts as the execution kernel shared by every workspace.

Responsibilities:

- Retrieval
- Fusion
- Reranking
- Prompt construction
- Generation
- Evaluation
- Tracing
- Benchmark execution

---

# Experimentation Framework

## Retrieval Strategies

- Dense Retrieval
- BM25 Retrieval
- Hybrid Retrieval
- Hybrid + RRF
- Hybrid + Reranking

## Query Enhancements

- Query Rewrite
- HyDE
- Multi Query
- Query Expansion
- Parent Child Retrieval
- Contextual Retrieval
- Metadata Retrieval
- Graph RAG

## Runtime Controls

- Model Selection
- Embedding Selection
- Reranker Selection
- Retrieval Strategy Selection

---

# Supported Models

- Llama 3.1 8B
- Llama 3.3 70B
- Llama 4 Scout
- Qwen 3 32B
- GPT OSS 20B
- GPT OSS 120B

---

# Evaluation Framework

PilotMaster evaluates:

- Grounding
- Faithfulness
- Retrieval Quality
- Query Coverage
- Retrieval Agreement
- Hallucination Risk
- Answerability
- Latency

---

# Current Features

## Retrieval

- Dense Retrieval
- BM25 Retrieval
- Hybrid Retrieval
- RRF
- Cross Encoder Reranking

## Observability

- Replayable Traces
- Retrieval Diagnostics
- Ranking Inspection
- Evaluation Insights

## Benchmarking

- Leaderboards
- Pareto Analysis
- Correlation Analysis
- Comparative Evaluation

## Document Intelligence

- OCR
- Grounded QA
- Citation Aware Responses
- Multi Format Support

---

# Research Directions

Current focus areas:

- Semantic Chunking
- Query Rewriting
- Query Expansion
- Multi Query Retrieval
- Parent Child Retrieval
- Contextual Retrieval
- Metadata Retrieval
- Agentic Retrieval
- Graph RAG

Observation:

> Retrieval quality increasingly appears to be a larger bottleneck than generation quality.

---

# Roadmap

## Retrieval Engineering

- Agentic Retrieval
- Graph RAG
- Metadata Retrieval
- Semantic Chunking

## Evaluation

- Judge Ensembles
- Grounding Regression Testing
- Automated Benchmark Generation

## Observability

- Failure Clustering
- Cross Run Comparisons
- Advanced Diagnostics

## Experimentation

- Retrieval A/B Testing
- Embedding Benchmarks
- Reranker Benchmarks
- Side-by-Side Comparisons

---

# Tech Stack

| Layer         | Technology                   |
| ------------- | ---------------------------- |
| Frontend      | React + Vite                 |
| Backend       | FastAPI                      |
| Database      | Neon PostgreSQL              |
| Vector Engine | FAISS                        |
| Embeddings    | SentenceTransformers         |
| Retrieval     | Dense + BM25 + RRF           |
| Reranking     | Cross Encoder Models         |
| Runtime       | Multi Model Inference        |
| Deployment    | Hugging Face Spaces + Vercel |

---

# Local Setup

## Backend

```bash
pip install -r requirements.txt
pip install -e .

uvicorn main:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# Contributing

Contributions, ideas, experiments, and issues are always welcome.

PilotMaster is ultimately a playground for exploring the future of retrieval engineering and observable AI systems.

---

# Final Philosophy

Most RAG systems expose only the final answer.

PilotMaster exposes:

- How retrieval behaved
- Why chunks ranked the way they did
- Whether retrievers agreed
- How confident reranking was
- How grounded the answer was
- Where hallucination risk emerged
- How different models behave on identical context
- Which configuration performs best
- How retrieval quality evolves over time

## The goal is not simply AI generation.

# The goal is observable AI execution and understanding why those answers happened.
