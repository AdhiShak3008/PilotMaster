# PilotMaster

PilotMaster is a retrieval engineering and AI observability platform built around one idea:

> Every AI response should be inspectable, replayable, and measurable.

The system combines:

- Hybrid retrieval
- Retrieval lineage tracing
- Reranker-aware evaluation
- Replayable execution traces
- Retrieval observability tooling

PilotMaster emerged after I combined two separate projects — DocPilot, a document intelligence RAG system, and TracePilot, an LLM observability platform — to study retrieval behavior, grounding, and AI execution in real time. The goal was to move beyond the “black box” nature of most GenAI systems by making every retrieval, ranking decision, evaluator signal, and execution trace inspectable and replayable.

---

# Core Architecture

## PilotCore

Shared execution kernel responsible for:

- retrieval
- reranking
- prompt construction
- generation
- evaluation
- tracing
- replay

## DocPilot

User-facing document intelligence application:

- upload documents
- ask questions
- grounded QA
- OCR ingestion
- chat history

## TracePilot

Observability and retrieval diagnostics layer:

- chunk inspection
- retrieval lineage
- reranker diagnostics
- latency spans
- replayable traces
- evaluation metrics

---

# Retrieval Stack

Current retrieval pipeline:

```text
Query
→ Dense Retrieval (FAISS cosine similarity)
→ BM25 Retrieval
→ Reciprocal Rank Fusion (RRF)
→ Cross-Encoder Reranking
→ Final Context
→ LLM Generation
```

## Retrieval Components

### Dense Retrieval

- SentenceTransformers
- `all-mpnet-base-v2`
- FAISS `IndexFlatIP`
- cosine similarity search

### Lexical Retrieval

- BM25 keyword retrieval
- exact terminology matching
- negation-sensitive retrieval support

### Hybrid Fusion

- Reciprocal Rank Fusion (RRF)
- replaced naive vector + BM25 concatenation

### Reranking

Cross-encoder reranking using:

```text
cross-encoder/ms-marco-MiniLM-L-6-v2
```

Reranking occurs:

- after hybrid fusion
- before prompt construction

---

# Retrieval Observability

TracePilot exposes full retrieval lineage:

## Per-Chunk Diagnostics

- dense score
- dense rank
- BM25 score
- BM25 rank
- RRF score
- reranker score
- reranker confidence
- reranker margin
- final rank
- retrieval source provenance

## Retrieval Agreement

TracePilot identifies whether retrieval was:

- strong (dense + BM25 agreement)
- semantic
- lexical

## Execution Visibility

Every trace includes:

- retrieved chunks
- prompt metadata
- latency spans
- replay lineage
- evaluator outputs
- retriever version
- prompt version
- evaluator version

---

# Evaluation System

Current evaluation dimensions:

| Metric               | Purpose                          |
| -------------------- | -------------------------------- |
| Retrieval Quality    | Measures retrieval effectiveness |
| Grounding Confidence | Measures evidence grounding      |
| Answerability        | Measures context sufficiency     |
| Hallucination Risk   | Estimates unsupported generation |

## Retrieval Quality Heuristics

Retrieval evaluation now incorporates:

- reranker confidence
- retrieval agreement
- reranker margin
- retrieval lineage signals

instead of relying only on lexical overlap heuristics.

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
- Chunk ranking inspection
- Latency tracking
- Span visualization
- Retrieval diagnostics
- Confidence metrics

## Document Intelligence

- PDF ingestion
- OCR support
- DOCX/TXT/CSV/XLSX support
- image ingestion
- grounded QA

---

# Tech Stack

| Layer         | Technology                   |
| ------------- | ---------------------------- |
| Frontend      | React + Vite                 |
| Backend       | FastAPI                      |
| Database      | Neon PostgreSQL              |
| Vector Engine | FAISS                        |
| Embeddings    | SentenceTransformers         |
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

# Project Structure

```text
PilotMaster/
├── frontend/
├── pilotcore/
├── DocPilot/
├── TracePilot/
├── main.py
└── README.md
```

## Important Runtime Files

```text
pilotcore/retrieval/runtime.py
pilotcore/retrieval/vector_store.py
pilotcore/retrieval/reranker.py
pilotcore/runtime/pipeline.py
frontend/src/components/TraceExplorer.jsx
```

---

# Deployment Architecture

## Frontend

- Vercel deployment
- React + Vite

## Backend

- Hugging Face Spaces
- Dockerized FastAPI runtime

## Database

- Neon PostgreSQL

---

# Current Retrieval Version

```text
hybrid_rrf_v1
```

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

- Retrieval benchmark mode
- Semantic grounding evaluation
- Learned retrieval evaluators
- LLM-as-judge experimentation

## Observability

- Trace filtering
- Retrieval analytics dashboards
- Retrieval benchmarking UI
- Advanced replay comparison

---

# Architectural Notes

- cosine similarity replaced L2 distance
- RRF replaced naive retrieval concatenation
- reranking occurs after fusion
- retrieval evaluation is reranker-aware
- traces are replayable and lineage-aware
- retrieval diagnostics are first-class observability signals

---

# What Makes PilotMaster Different

Most RAG systems expose only:

- the final answer

PilotMaster exposes:

- how retrieval behaved
- why chunks ranked the way they did
- whether retrievers agreed
- how confident reranking was
- where hallucination risk emerged
- how the pipeline evolved over time

The goal is not just AI generation.

The goal is observable AI execution.
