---
title: PilotMaster
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

---

# PilotMaster

PilotMaster is a retrieval engineering and AI observability platform built to make RAG systems inspectable instead of opaque.

The project started after I combined two separate systems:

- **DocPilot** — a document intelligence and RAG platform
- **TracePilot** — an LLM observability and replay system

The idea was simple:

> What if every retrieval decision, reranker score, evaluator signal, and execution trace could be inspected in real time instead of hidden behind a chatbot response?

Most GenAI systems behave like black boxes. You upload a document, ask a question, and receive an answer with no visibility into:

- what was retrieved
- why chunks ranked the way they did
- whether retrievers agreed
- whether the answer stayed grounded
- how confident the retrieval pipeline actually was

PilotMaster was built to expose that entire retrieval journey.

---

# What PilotMaster Does

PilotMaster combines:

- hybrid retrieval
- reranking
- retrieval lineage tracing
- grounded generation
- replayable execution traces
- retrieval observability
- reranker-aware evaluation

The system focuses heavily on:

- retrieval debugging
- ranking behavior
- grounding analysis
- hallucination inspection
- retrieval quality diagnostics

instead of only exposing the final answer.

---

# System Architecture

PilotMaster is made up of three layers.

## PilotCore — Execution Kernel

PilotCore handles all runtime execution logic:

- embeddings
- retrieval
- reranking
- prompt construction
- generation
- evaluation
- tracing
- replay

Both DocPilot and TracePilot delegate execution to PilotCore.

Important runtime files:

```text
pilotcore/retrieval/runtime.py
pilotcore/retrieval/vector_store.py
pilotcore/retrieval/reranker.py
pilotcore/runtime/pipeline.py
```

---

## DocPilot — Document Intelligence Layer

DocPilot is the user-facing application.

Features:

- upload documents
- OCR ingestion
- ask questions
- grounded QA
- citation support
- chat sessions

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

TracePilot exposes how retrieval and generation behaved internally.

Every trace includes:

- retrieved chunks
- reranker diagnostics
- retrieval lineage
- latency spans
- replay metadata
- grounding metrics
- hallucination analysis
- retrieval agreement signals

The goal is to make AI execution inspectable instead of guess-based.

---

# Retrieval Pipeline

Current retrieval flow:

```text
Query
→ Dense Retrieval (FAISS cosine similarity)
→ BM25 Retrieval
→ Reciprocal Rank Fusion (RRF)
→ Cross-Encoder Reranking
→ Final Context
→ LLM Generation
```

---

# Retrieval Stack

## Dense Retrieval

Semantic retrieval uses:

- SentenceTransformers
- `all-mpnet-base-v2`
- FAISS `IndexFlatIP`
- cosine similarity

The project originally used L2 distance before migrating to cosine similarity for better semantic ranking behavior.

---

## BM25 Retrieval

BM25 handles:

- keyword-heavy queries
- exact terminology
- acronym matching
- negation-sensitive retrieval

This solved several weaknesses of vector-only retrieval.

---

## Reciprocal Rank Fusion (RRF)

RRF combines:

- dense retrieval rankings
- BM25 rankings

This replaced naive vector + BM25 concatenation and produced much more stable retrieval quality.

---

## Cross-Encoder Reranking

Final retrieval ranking uses:

```text
cross-encoder/ms-marco-MiniLM-L-6-v2
```

The reranker:

- evaluates `(query, chunk)` pairs jointly
- rescoring fused candidates
- promotes semantically relevant chunks
- improves ranking precision significantly

Reranking occurs:

- after RRF fusion
- before prompt construction

---

# Retrieval Observability

One of the main goals of PilotMaster is retrieval introspection.

TracePilot exposes:

## Per-Chunk Diagnostics

Every retrieved chunk can display:

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

- **strong** → dense + BM25 agreement
- **semantic** → dense-dominant retrieval
- **lexical** → BM25-dominant retrieval

This makes retrieval behavior much easier to debug.

---

## Replayable Traces

Every query execution is replayable.

This allows:

- retrieval debugging
- evaluator comparisons
- ranking inspection
- pipeline experimentation
- retrieval regression testing

---

# Evaluation System

Current evaluation dimensions:

| Metric               | Purpose                          |
| -------------------- | -------------------------------- |
| Retrieval Quality    | Measures retrieval effectiveness |
| Grounding Confidence | Measures evidence grounding      |
| Answerability        | Measures context sufficiency     |
| Hallucination Risk   | Estimates unsupported generation |

The evaluator evolved from simple lexical heuristics into a reranker-aware evaluation system.

Current retrieval evaluation considers:

- reranker confidence
- retrieval agreement
- reranker margin
- retrieval lineage signals

instead of relying only on word overlap.

---

# Tech Stack

| Layer         | Technology                   |
| ------------- | ---------------------------- |
| Frontend      | React + Vite                 |
| Backend       | FastAPI                      |
| Database      | Neon PostgreSQL              |
| Vector Engine | FAISS                        |
| Embeddings    | SentenceTransformers         |
| Retrieval     | BM25 + Hybrid RRF            |
| Reranker      | Cross-Encoder MiniLM         |
| LLM           | Groq — llama-3.1-8b-instant  |
| Deployment    | Hugging Face Spaces + Vercel |

---

# Local Setup

## Backend

```bash
pip install -r requirements.txt
pip install -e .

uvicorn main:app --reload --port 8000
```

---

## Frontend

```bash
cd frontend

npm install
npm run dev
```

---

# Environment Variables

Create a `.env` file:

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

# Current Retrieval Version

```text
hybrid_rrf_v1
```

---

# Current Features

## Retrieval

- Dense semantic retrieval
- BM25 retrieval
- Hybrid retrieval
- RRF fusion
- Cross-encoder reranking
- Retrieval lineage tracing

## Observability

- Replayable traces
- Retrieval diagnostics
- Chunk ranking inspection
- Latency tracking
- Span visualization
- Confidence metrics

## Document Intelligence

- OCR ingestion
- grounded QA
- multi-format support
- citation-aware responses

---

# Planned Improvements

## Retrieval

- Query rewriting
- Multi-query retrieval
- Parent-child retrieval
- Metadata-aware retrieval
- Context compression
- Adaptive chunking

## Evaluation

- Semantic grounding evaluation
- Retrieval benchmark mode
- Learned evaluators
- LLM-as-judge experimentation

## Observability

- Retrieval analytics dashboards
- Advanced replay comparison
- Trace filtering
- Benchmark visualization

---

# What Makes PilotMaster Different

Most RAG systems expose:

- only the final answer

PilotMaster exposes:

- how retrieval behaved
- why chunks ranked the way they did
- whether retrievers agreed
- how confident reranking was
- where hallucination risk emerged
- how the pipeline evolved over time

The goal is not just AI generation.

The goal is observable AI execution.
