---
title: PilotMaster
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# PilotMaster

**PilotMaster** is a retrieval engineering, document intelligence, and AI observability platform for building, debugging, evaluating, and improving Retrieval-Augmented Generation (RAG) systems.

Most RAG applications expose only the final answer.

PilotMaster exposes the entire retrieval journey.

From retrieval and reranking to evaluation and trace replay, every major decision can be inspected, analyzed, benchmarked, and improved.

---

# Platform Overview

PilotMaster consists of three major layers:

## DocPilot

The document intelligence workspace.

Provides:

- Document ingestion
- OCR processing
- Grounded question answering
- Citation-aware responses
- Runtime model selection
- Retrieval experimentation

## TracePilot

The observability workspace.

Provides:

- Retrieval diagnostics
- Chunk lineage inspection
- Replayable traces
- Reranker analysis
- Evaluation metrics
- Hallucination analysis
- Retrieval agreement analysis

## PilotCore

The shared execution kernel.

Provides:

- Embeddings
- Retrieval
- Fusion
- Reranking
- Prompt construction
- Generation
- Evaluation
- Tracing

---

# Why PilotMaster Exists

Modern GenAI systems frequently behave like black boxes.

A document is uploaded.

A question is asked.

An answer is returned.

What remains hidden:

- What was retrieved?
- Why did those chunks rank first?
- Which retriever contributed the evidence?
- Did BM25 or dense retrieval dominate?
- How confident was the reranker?
- Was the answer grounded?
- Did the model hallucinate?
- Would another model answer differently using the same evidence?

PilotMaster was built to make those decisions observable.

---

# Unified Workspace

DocPilot and TracePilot operate inside the same platform experience.

Typical workflow:

1. Upload a document
2. Ask a question
3. Review citations
4. Inspect retrieved chunks
5. Analyze ranking signals
6. Evaluate answer quality
7. Replay the execution
8. Compare retrieval strategies

---

# Research Workspace

PilotMaster includes a dedicated workspace for retrieval engineering.

Supported retrieval modes:

- Dense Retrieval
- BM25 Retrieval
- Hybrid Retrieval
- Hybrid + RRF
- Hybrid + RRF + Reranking

Experimental controls include:

- Embedding model selection
- Reranker selection
- Retrieval strategy selection
- Query enhancement testing
- Model benchmarking

Questions the workspace helps answer:

- Does reranking improve grounding?
- When does BM25 outperform dense retrieval?
- Does RRF improve recall?
- Which embedding model performs best?
- Which reranker produces the best ranking quality?

---

# High-Level Architecture

Dashboard
→ FastAPI
→ DocPilot
→ PilotCore
→ Retrieval
→ Fusion
→ Reranking
→ Generation
→ Evaluation
→ TracePilot

PilotCore acts as the execution kernel shared by every workspace.

---

# Retrieval Architecture

## Retrieval Pipeline

Query
→ Dense Retrieval
→ BM25 Retrieval
→ Reciprocal Rank Fusion
→ Candidate Pool
→ Cross-Encoder Reranking
→ Context Selection
→ LLM Generation
→ Evaluation
→ Trace Storage

---

## Dense Retrieval

Semantic retrieval uses:

- SentenceTransformers
- Cosine Similarity
- FAISS
- IndexFlatIP

Responsibilities:

- Concept matching
- Semantic recall
- Contextual retrieval

---

## BM25 Retrieval

Responsibilities:

- Exact terminology
- Acronyms
- Keywords
- Lexical precision
- Negation-sensitive retrieval

BM25 compensates for weaknesses found in purely vector-based systems.

---

## Reciprocal Rank Fusion

Combines:

- Dense rankings
- BM25 rankings

Benefits:

- Better recall
- Stable rankings
- Reduced retriever bias

---

## Cross-Encoder Reranking

Reranking occurs after retrieval and before prompt construction.

Supported families:

- MiniLM rerankers
- BGE rerankers
- Experimental rerankers

Responsibilities:

- Joint query/chunk evaluation
- Candidate rescoring
- Precision improvement
- Evidence prioritization

---

# Runtime Retrieval Components

PilotMaster supports runtime experimentation.

## Embedding Models

Examples:

- all-mpnet-base-v2
- BGE family
- Additional SentenceTransformer models

## Rerankers

Examples:

- MiniLM
- BGE Reranker Large
- BGE Reranker v2 M3

## Retrieval Strategies

- Dense
- BM25
- Hybrid
- Hybrid + RRF
- Hybrid + RRF + Reranking

---

# Model Runtime

Models are managed through a centralized registry.

Currently supported:

- Llama 3.1 8B
- Llama 3.3 70B
- Llama 4 Scout
- Qwen 3 32B
- GPT OSS 20B
- GPT OSS 120B

Runtime selection enables:

- Latency comparisons
- Grounding comparisons
- Retrieval-consistent benchmarking
- Comparative model evaluation

---

# TracePilot

TracePilot exposes the internal behavior of the system.

## Per-Chunk Diagnostics

Available metrics:

- Dense Score
- Dense Rank
- BM25 Score
- BM25 Rank
- RRF Score
- Reranker Score
- Reranker Confidence
- Reranker Margin
- Final Rank
- Retrieval Provenance

---

## Retrieval Lineage

Every chunk records where it originated:

- Dense Retrieval
- BM25 Retrieval
- Hybrid Retrieval
- RRF Fusion
- Reranking

This makes ranking behavior significantly easier to debug.

---

## Retrieval Agreement

TracePilot determines whether retrieval was:

- Strong
- Semantic-Dominant
- Lexical-Dominant

Agreement analysis helps explain why a response succeeded or failed.

---

## Replayable Traces

Every execution can be replayed.

Replay enables:

- Retrieval debugging
- Regression testing
- Evaluation comparison
- Pipeline experimentation
- Ranking inspection

---

# Evaluation Framework

PilotMaster evaluates multiple dimensions of answer quality.

Current metrics:

- Retrieval Quality
- Grounding
- Faithfulness
- Query Coverage
- Retrieval Agreement
- Answerability
- Hallucination Risk

Evaluation incorporates:

- Retrieval confidence
- Reranker confidence
- Reranker margin
- Retrieval agreement
- Evidence quality
- Retrieval lineage

---

# Comparative Model Evaluation

Multiple models can be tested against identical retrieved evidence.

Developers can compare:

- Grounding
- Reasoning quality
- Latency
- Retrieval utilization
- Answer completeness

Because retrieval context remains fixed, behavioral differences can be attributed primarily to model behavior.

---

# Current Features

## Retrieval

- Dense Retrieval
- BM25 Retrieval
- Hybrid Retrieval
- Reciprocal Rank Fusion
- Cross-Encoder Reranking
- Retrieval Lineage Tracking

## Observability

- Replayable Traces
- Retrieval Diagnostics
- Ranking Inspection
- Latency Tracking
- Confidence Metrics
- Evaluation Insights

## Runtime Controls

- Runtime Model Selection
- Runtime Embedding Selection
- Runtime Reranker Selection
- Dynamic Model Registry

## Document Intelligence

- OCR Ingestion
- Grounded QA
- Citation-Aware Responses
- Multi-Format Support

---

# Research Directions

Current focus areas:

- Semantic Chunking
- Query Rewriting
- Query Expansion
- Multi-Query Retrieval
- Parent-Child Retrieval
- Contextual Retrieval
- Metadata-Aware Retrieval
- Agentic Retrieval

Observation:

Retrieval quality increasingly appears to be a larger bottleneck than generation quality, making retrieval engineering a primary area of exploration.

---

# Roadmap

## Retrieval Engineering

- Query Rewriting
- Query Expansion
- Multi-Query Retrieval
- Parent-Child Retrieval
- Contextual Retrieval
- Metadata-Aware Retrieval
- Semantic Chunking
- Agentic Retrieval

## Evaluation

- Comparative Evaluation
- Judge Ensembles
- Grounding Regression Testing

## Observability

- Cross-Run Comparisons
- Retrieval Lineage Visualization
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
| Reranking     | Cross-Encoder Models         |
| Runtime       | Multi-Model Inference        |
| Deployment    | Hugging Face Spaces + Vercel |

---

# Screenshots

## DocPilot

_Add screenshot_

## TracePilot

_Add screenshot_

## Research Workspace

_Add screenshot_

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

# What Makes PilotMaster Different

Most RAG systems expose only the final answer.

PilotMaster exposes:

- How retrieval behaved
- Why chunks ranked the way they did
- Whether retrievers agreed
- How confident reranking was
- How grounded the answer was
- Where hallucination risk emerged
- How different models behave on identical context
- How retrieval quality evolves over time

The goal is not simply AI generation.

The goal is observable AI execution.
