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

**PilotMaster** is a retrieval engineering and AI observability platform for building, debugging, and evaluating Retrieval-Augmented Generation (RAG) systems.

Most RAG applications expose only the final answer.

PilotMaster exposes the entire retrieval journey.

It allows developers to inspect what was retrieved, why chunks ranked the way they did, whether retrieval methods agreed, how reranking influenced the final context, how grounded the answer was, and how different language models behave when given the same evidence.

The platform combines:

- **DocPilot** — document intelligence and grounded question answering
- **TracePilot** — observability, tracing, replay, and evaluation
- **PilotCore** — the shared execution kernel that powers retrieval, generation, evaluation, and tracing

---

# Why PilotMaster Exists

Modern GenAI systems often behave like black boxes.

A document is uploaded.

A question is asked.

An answer is returned.

What remains invisible is:

- what information was retrieved
- why certain chunks outranked others
- whether dense retrieval or lexical retrieval dominated
- how confident the reranker was
- whether the answer was sufficiently grounded
- where hallucination risk emerged
- how a different model would have answered using the exact same context

PilotMaster was built to make those decisions observable.

---

# What PilotMaster Does

PilotMaster combines:

- Dense semantic retrieval
- BM25 retrieval
- Hybrid retrieval
- Reciprocal Rank Fusion (RRF)
- Cross-encoder reranking
- Runtime model selection
- Grounded generation
- Retrieval diagnostics
- Replayable traces
- Retrieval evaluation
- Comparative model benchmarking

The objective is not merely generating answers.

The objective is understanding how answers were generated.

---

# High-Level Architecture

Current request flow:

Dashboard.jsx
→ FastAPI
→ DocPilot
→ PilotCore
→ Retrieval
→ Reranking
→ Generation
→ Evaluation
→ TracePilot

PilotCore acts as the execution kernel shared by both DocPilot and TracePilot.

---

# System Components

## PilotCore — Execution Kernel

PilotCore contains:

- embeddings
- retrieval
- reranking
- prompt construction
- generation
- evaluation
- tracing
- replay

Key runtime modules:

pilotcore/retrieval/runtime.py

pilotcore/retrieval/vector_store.py

pilotcore/retrieval/reranker.py

pilotcore/runtime/pipeline.py

pilotcore/generation/generator.py

Both DocPilot and TracePilot delegate execution to PilotCore.

---

## DocPilot — Document Intelligence Layer

DocPilot is the primary user-facing application.

Features include:

- document upload
- OCR ingestion
- citation-aware QA
- grounded responses
- chat sessions
- runtime model selection

Supported formats:

- PDF
- DOCX
- TXT
- CSV
- XLSX
- PNG
- JPG
- JPEG

---

## TracePilot — Observability Layer

TracePilot exposes the internal behavior of retrieval and generation.

Every trace can contain:

- retrieved chunks
- dense retrieval diagnostics
- BM25 diagnostics
- RRF fusion signals
- reranker diagnostics
- retrieval lineage
- latency spans
- evaluation metrics
- replay metadata

The goal is observable AI execution rather than guess-based debugging.

---

# Retrieval System

## Retrieval Pipeline

Current retrieval flow:

Query
→ Dense Retrieval (FAISS)
→ BM25 Retrieval
→ Reciprocal Rank Fusion (RRF)
→ Candidate Pool Construction
→ Cross-Encoder Reranking
→ Top Context Selection
→ LLM Generation
→ Evaluation
→ Trace Ingestion

---

## Dense Retrieval

Semantic retrieval uses:

- SentenceTransformers
- all-mpnet-base-v2
- FAISS IndexFlatIP
- cosine similarity

Dense retrieval is responsible for semantic recall and concept-level matching.

---

## BM25 Retrieval

BM25 complements dense retrieval by handling:

- exact terminology
- acronyms
- keyword-heavy queries
- lexical matching
- negation-sensitive retrieval

This mitigates weaknesses found in vector-only retrieval systems.

---

## Reciprocal Rank Fusion (RRF)

RRF combines:

- dense retrieval rankings
- BM25 rankings

This provides a more stable ranking signal than simple result concatenation.

---

## Cross-Encoder Reranking

Final ranking uses:

cross-encoder/ms-marco-MiniLM-L-6-v2

The reranker:

- jointly evaluates query-chunk pairs
- rescoring fused candidates
- promotes semantically relevant evidence
- improves ranking precision

Reranking occurs after retrieval and before prompt construction.

---

# Current Retrieval Configuration

| Component               | Configuration                             |
| ----------------------- | ----------------------------------------- |
| Embedding Model         | `sentence-transformers/all-mpnet-base-v2` |
| Embedding Dimension     | 768                                       |
| Vector Store            | FAISS (`IndexFlatIP`)                     |
| Similarity Metric       | Cosine Similarity                         |
| Chunk Size              | 500 characters                            |
| Chunk Overlap           | 80 characters                             |
| Dense Retrieval Depth   | Top 7                                     |
| BM25 Retrieval Depth    | Top 7                                     |
| Fusion Strategy         | Reciprocal Rank Fusion (RRF)              |
| Reranker                | `cross-encoder/ms-marco-MiniLM-L-6-v2`    |
| Reranker Candidate Pool | Up to 20 chunks                           |
| Final Context Window    | Top 7 reranked chunks                     |
| Retrieval Version       | `hybrid_rrf_v1`                           |

---

# Model Runtime

PilotMaster supports runtime model selection through a centralized model registry.

Models are defined in:

pilotcore/models/registry.py

and exposed through:

GET /docpilot/models/

The frontend dynamically discovers available models from the backend.

This allows new models to be introduced without modifying frontend code.

## Currently Supported Models

- Llama 3.1 8B
- Llama 3.3 70B
- Llama 4 Scout
- Qwen 3 32B
- GPT OSS 20B
- GPT OSS 120B

Runtime model selection enables:

- model benchmarking
- latency comparisons
- grounding comparisons
- retrieval-consistent evaluations

because every model can be tested against identical retrieved evidence.

---

# Retrieval Observability

A primary goal of PilotMaster is retrieval introspection.

## Per-Chunk Diagnostics

Every retrieved chunk can expose:

- dense score
- dense rank
- BM25 score
- BM25 rank
- RRF score
- reranker score
- reranker confidence
- reranker margin
- final rank
- retrieval provenance

---

## Retrieval Agreement

TracePilot identifies whether retrieval was:

- strong
- semantic-dominant
- lexical-dominant

This makes retrieval behavior substantially easier to debug.

---

## Replayable Traces

Every execution can be replayed.

This enables:

- retrieval debugging
- ranking inspection
- evaluator comparison
- regression testing
- pipeline experimentation

---

# Evaluation System

PilotMaster evaluates multiple dimensions of answer quality.

Current metrics include:

- Retrieval Quality
- Grounding Confidence
- Answerability
- Hallucination Risk

Evaluation considers:

- reranker confidence
- reranker margin
- retrieval agreement
- retrieval lineage

rather than relying exclusively on lexical overlap.

---

# Comparative Model Evaluation

PilotMaster supports comparative evaluation across multiple models using identical retrieval context.

Recent experiments have shown:

- GPT OSS 120B excels at synthesis and reasoning
- Llama 3.3 70B tends to be the most grounded
- Qwen 3 32B often produces highly detailed responses

Because retrieval context remains constant, differences can be attributed primarily to model behavior rather than retrieval variance.

---

# Current Features

## Retrieval

- Dense retrieval
- BM25 retrieval
- Hybrid retrieval
- Reciprocal Rank Fusion
- Cross-encoder reranking
- Retrieval lineage tracing

## Observability

- Replayable traces
- Retrieval diagnostics
- Chunk ranking inspection
- Latency tracking
- Span visualization
- Confidence metrics

## Model Runtime

- Runtime model selection
- Dynamic model registry
- Comparative model evaluation

## Document Intelligence

- OCR ingestion
- Grounded QA
- Citation-aware responses
- Multi-format document support

---

# Research Directions

PilotMaster has increasingly evolved into a retrieval engineering platform.

Current research focuses on:

- semantic chunking
- query rewriting
- query expansion
- multi-query retrieval
- parent-child retrieval
- contextual retrieval
- metadata-aware retrieval
- agentic retrieval

Recent experiments suggest that retrieval quality is becoming a larger bottleneck than generation quality, making retrieval engineering the primary area of exploration.

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
| Reranker      | Cross-Encoder MiniLM         |
| LLM Runtime   | Groq Multi-Model Runtime     |
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

# Environment Variables

```env
GROQ_API_KEY=
DATABASE_URL=
SECRET_KEY=
TRACEPILOT_URL=
DOCPILOT_URL=
```

---

# Deployment

## Frontend

- Vercel
- React + Vite

## Backend

- Hugging Face Spaces
- Docker deployment
- Unified FastAPI runtime

## Database

- Neon PostgreSQL

---

# What Makes PilotMaster Different

Most RAG systems expose only the final answer.

PilotMaster exposes:

- how retrieval behaved
- why chunks ranked the way they did
- whether retrievers agreed
- how confident reranking was
- how grounded the answer was
- where hallucination risk emerged
- how different models behave on identical context
- how retrieval quality evolves over time

The goal is not simply AI generation.

The goal is observable AI execution.
