---
title: PilotMaster Backend
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_file: Dockerfile
app_port: 7860
pinned: false
---

# PilotMaster

PilotMaster is an observable AI execution ecosystem built around a single idea: when an AI answers a question, every step of that process should be visible, measurable, and inspectable.

Most RAG applications are black boxes. You upload a document, ask a question, and get an answer. You have no idea which chunks were retrieved, whether the model stayed grounded in the evidence, or whether the response was faithful to the source material. PilotMaster changes that.

Every AI response in PilotMaster is replayable, inspectable, and versioned. TracePilot exposes retrieved chunks, prompt construction behavior, evaluator outputs, latency spans, and execution lineage in real time — turning opaque AI behavior into an observable, auditable execution trace.

---

---

## How PilotMaster happened

DocPilot and TracePilot originally started as completely separate projects.

DocPilot began as an AI document intelligence platform focused on ingestion, retrieval, OCR pipelines, semantic search, and grounded question answering over uploaded files.

TracePilot started as a different idea entirely — an observability and replay system for LLM execution. The goal was to inspect prompts, traces, evaluator outputs, latency spans, and retrieval behavior instead of treating AI systems like black boxes.

For a while they evolved independently.

But over time the separation started feeling artificial.

The moment retrieval debugging became serious, the systems naturally began depending on each other. You couldn't meaningfully improve retrieval quality without replaying traces. You couldn't debug grounding failures without inspecting chunk rankings. You couldn't tune evaluators without observing real retrieval behavior. OCR failures, hallucination analysis, replayable execution traces, retrieval observability, and evaluator lineage all started collapsing into the same workflow.

Eventually it became obvious that the projects were converging toward the same destination.

PilotMaster emerged as the inevitable merge of both systems into a unified AI engineering platform — one side focused on AI execution, the other focused on understanding and inspecting that execution in real time.

## What it is

PilotMaster is made up of three layers that work together:

### PilotCore — the execution kernel

The brain of the system. PilotCore owns everything that happens at runtime: embedding documents, searching the vector store, building prompts, calling the LLM, timing spans, and emitting traces. Neither DocPilot nor TracePilot execute RAG themselves — they both delegate to PilotCore. This means the execution logic lives in exactly one place.

### DocPilot — the user-facing product

The application a user actually interacts with. Upload a PDF, DOCX, TXT, CSV, XLSX, or image. Ask questions about it. Get answers with source citations. Manage chat history. DocPilot is the product layer — it handles auth, billing, document management, and chat sessions. It calls PilotCore for everything AI-related.

### TracePilot — the observability layer

The tool an AI engineer opens while DocPilot is running. Every time a user asks a question in DocPilot, TracePilot automatically receives the full execution trace: which chunks were retrieved, what scores they had, what prompt was built, what the model said, how long each step took, and a four-dimensional evaluation of the response quality. TracePilot makes the AI's reasoning visible in real time.

---

## How a single question flows through the system

1. User types a question in DocPilot
2. DocPilot calls `run_pipeline(query, user_id, source)` in PilotCore
3. PilotCore embeds the query using `all-mpnet-base-v2` (sentence-transformers, runs locally)
4. PilotCore runs hybrid retrieval using FAISS cosine similarity, BM25 lexical retrieval, and RRF fusion
5. Retrieved chunks are fused, reranked, and assembled into the final context before the LLM sees them
6. PilotCore builds a prompt — QA-style for direct questions, summarization-style for broad requests
7. PilotCore calls Groq (`llama-3.1-8b-instant`) for generation
8. PilotCore runs four-dimensional evaluation on the response
9. PilotCore emits the full trace to TracePilot via HTTP
10. User sees the answer in DocPilot. AI engineer sees the trace in TracePilot.

---

## The evaluation system

Every response is judged across four independent dimensions:

Retrieval relevance originally relied on heuristic FAISS L2 distance bands, but the evaluator evolved once hybrid retrieval was introduced. The system now uses more query-aware retrieval evaluation instead of assuming vector distance alone defines retrieval quality. In practice these thresholds are intentionally conservative — low retrieval scores can still produce correct answers if the model stays grounded in the evidence. The scoring exists to surface where the system may be operating on weak signals, not to declare answers right or wrong.

**Grounding Confidence** — did the model answer using the retrieved evidence? Measured by word overlap between the response and the chunks, with stopwords excluded and a length penalty applied to longer responses. If the model correctly says "I don't have enough information", it is rewarded with high grounding.

**Answerability** — did the document actually contain enough to answer this question? Measured by how many query keywords appear in the retrieved chunks. Broad queries like "explain the document" are capped at partial — no document can fully answer an open-ended request.

**Hallucination Risk** — how much of the response went beyond the evidence? Derived from faithfulness score with a length penalty. A short, accurate answer scores low risk. A long response that introduces unsupported facts scores high.

---

## Tech stack

| Layer      | Technology                                                                       |
| ---------- | -------------------------------------------------------------------------------- |
| LLM        | Groq — llama-3.1-8b-instant                                                      |
| Embeddings | sentence-transformers — all-mpnet-base-v2 (local, no server needed)              |
| Retrieval  | Hybrid retrieval — FAISS cosine similarity + BM25 lexical retrieval + RRF fusion |
| Backend    | FastAPI (unified server, DocPilot + TracePilot mounted as sub-apps)              |
| Database   | PostgreSQL (users, docs, chats, persistent traces, telemetry)                    |
| Frontend   | React + Vite (unified app, tab-switched between DocPilot and TracePilot)         |

---

## Running it

### Prerequisites

- Python 3.10+
- PostgreSQL running locally (`rag_saas` database)
- A Groq API key

### Setup

```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -e .

# Install frontend dependencies
cd frontend && npm install
```

### Configure

Create a `.env` file at the project root and fill in your values:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pilotmaster
SECRET_KEY=your_secret_key_here
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

### Start

```bash
# Terminal 1 — unified backend (DocPilot + TracePilot on one server)
uvicorn main:app --reload --port 8000

# Terminal 2 — unified frontend (DocPilot + TracePilot in one window)
cd frontend && npm run dev
```

Open `http://localhost:5173`. Sign up, log in, and you're in PilotMaster.

---

## 🌐 Production Deployment Architecture

PilotMaster uses a cloud-native deployment architecture designed around modular AI execution, observability, and retrieval-aware runtime orchestration.

### 1. Frontend Application Layer (Vercel)

- **Provider:** Vercel
- **Framework:** React + Vite
- **Responsibilities:**
  - User authentication
  - Chat session management
  - Document uploads
  - Trace visualization
  - Replay interface
  - Runtime analytics display

The frontend is deployed independently through Vercel to provide globally distributed static delivery, optimized frontend performance, and simplified continuous deployment workflows.

---

### 2. Backend Runtime Layer (Hugging Face Spaces)

- **Provider:** Hugging Face Spaces (Docker SDK)
- **Framework:** FastAPI
- **Deployment Type:** Unified containerized runtime

The backend infrastructure is deployed through Hugging Face Spaces using Docker-based execution. The platform exposes a unified FastAPI application that mounts both DocPilot and TracePilot as sub-applications under a shared runtime environment.

This backend layer is responsible for:

- Retrieval-Augmented Generation (RAG) execution
- OCR ingestion pipelines
- Embedding generation
- FAISS vector retrieval
- Prompt construction
- LLM interaction
- Response evaluation
- Trace emission
- Telemetry collection
- Replay execution workflows

The deployment architecture intentionally consolidates runtime execution and observability into a single environment to simplify debugging, telemetry inspection, and AI execution traceability.

### Hugging Face Space Configuration

```yaml
sdk: docker
app_port: 7860
```

### Runtime Startup

```bash
uvicorn main:app --host 0.0.0.0 --port 7860
```

### Environment Variables

The backend runtime uses environment variables configured through Hugging Face Space Secrets:

- `GROQ_API_KEY`
- `DATABASE_URL`
- `SECRET_KEY`
- `TRACEPILOT_URL`
- `DOCPILOT_URL`

---

### 3. Database Layer (Neon PostgreSQL)

- **Provider:** Neon
- **Database Engine:** PostgreSQL

PilotMaster uses Neon PostgreSQL as the managed cloud database infrastructure for:

- User authentication data
- Chat history persistence
- Session management
- Billing metadata
- Trace metadata
- Runtime analytics storage

Neon provides serverless PostgreSQL scaling with managed infrastructure while maintaining compatibility with standard PostgreSQL tooling and ORM workflows.

---

### 4. Vector Retrieval Layer (FAISS)

- **Vector Engine:** Facebook AI Similarity Search (FAISS)
- **Embedding Model:** sentence-transformers/all-mpnet-base-v2

The retrieval layer evolved from pure semantic vector search into a hybrid retrieval architecture combining FAISS semantic retrieval with BM25 lexical retrieval. This shift happened after observing that vector-only retrieval often ranked broad generic skill chunks above highly relevant exact-match sections like Education and Projects.

The retrieval pipeline includes:

1. Document ingestion
2. Boundary-aware chunking
3. Embedding generation
4. Vector indexing
5. Semantic similarity retrieval
6. Context injection into prompts

The system now supports hybrid retrieval combining dense semantic search with sparse lexical ranking using BM25. Current fusion is implemented using Reciprocal Rank Fusion (RRF), with a lightweight cross-encoder reranker on the candidate pool, while future work includes section-aware retrieval weighting and metadata-aware prompts.

---

### 5. Observability & Execution Intelligence

TracePilot functions as the observability subsystem of the ecosystem.

Every query execution automatically emits:

- Retrieved chunks
- Retrieval scores
- Prompt metadata
- Evaluation metrics
- Hallucination risk
- Grounding confidence
- Runtime latency
- Replayable execution traces

This architecture transforms traditional RAG systems from opaque response generators into transparent and inspectable AI execution pipelines.

## Project structure

```
PilotMaster/
├── main.py                  # Unified backend entry point
├── .env                     # Single source of truth for all config
├── frontend/                # Unified React app (DocPilot + TracePilot)
│   └── src/
│       ├── App.jsx          # PilotMaster home, auth, routing
│       ├── docpilot/        # DocPilot workspace
│       └── tracepilot/      # TracePilot workspace
├── pilotcore/               # Execution kernel (shared by both apps)
│   ├── config.py            # Central config — all services import from here
│   ├── evaluation/          # Multi-dimensional response evaluation
│   ├── generation/          # Groq LLM client + prompt builder
│   ├── retrieval/           # Embeddings, FAISS vector store, retrieval runtime
│   ├── runtime/             # Pipeline orchestration + trace emission
│   ├── schemas/             # Canonical data contracts (Trace, Chunk, Span, etc.)
│   └── tracing/             # Span timing, trace creation, telemetry
├── DocPilot/backend/        # Product layer — auth, billing, documents, chat
└── TracePilot/backend/      # Observability layer — trace storage, evaluation, replay
```

---

## PilotCore — the execution kernel

PilotCore is not an application. It has no UI, no user-facing endpoints, and no opinions about products. It is the runtime substrate that both DocPilot and TracePilot are built on top of.

Every time a user asks a question in DocPilot, it is PilotCore that actually runs. DocPilot calls `run_pipeline(query, user_id, source)` and waits. Everything that happens between that call and the response — embedding, retrieval, filtering, prompt construction, generation, evaluation, and trace emission — happens inside PilotCore.

**What PilotCore owns:**

- **Embeddings** — converts text to vectors using `all-mpnet-base-v2` running locally via sentence-transformers. No external embedding API, no network dependency.
- **Vector store** — manages per-user FAISS indexes on disk. Each user's documents live in their own isolated index. Supports add, search, reset, and selective deletion by document.
- **Retrieval runtime** — searches the vector store using dense vector retrieval with cosine similarity, returns candidate chunks from FAISS and BM25, then fuses them with RRF and reranks with a cross-encoder before the LLM sees them. The top 7 reranked chunks are injected into the prompt context. For broad queries where most results get filtered due to relevance thresholds, the system preserves enough context so the LLM always has grounding material to work with, rather than forcing a complete fallback.
- **Prompt builder** — detects the query type and builds the appropriate prompt. Direct fact questions get a strict QA prompt. Broad requests like "explain the document" get a summarization prompt.
- **Generation** — calls Groq's `llama-3.1-8b-instant` with the constructed prompt and returns the response.
- **Evaluation** — runs four independent evaluators on every response: retrieval relevance, grounding confidence, answerability, and hallucination risk. These are computed from the query, the response, and the retrieved chunks — not from the LLM.
- **Tracing** — creates a trace for every pipeline run, times each span (retrieval, generation), and emits the full trace payload to TracePilot via HTTP after execution completes.
- **Schemas** — defines the canonical data contracts used across the system: Trace, Chunk, RetrievedChunk, RetrievalResult, Span, Citation, DocumentMetadata.
- **Config** — the single source of truth for all environment variables. Every service in the ecosystem imports from `pilotcore/config.py` instead of reading `.env` directly.

The reason this architecture matters is that DocPilot and TracePilot can evolve independently without touching execution logic. If the retrieval strategy changes, the evaluation thresholds are tuned, or the LLM is swapped out, that change happens in PilotCore once and both applications immediately reflect it.

---

## Using DocPilot

DocPilot is the document intelligence interface. Here's what a typical session looks like:

**Sign up and log in.** Your account is tied to a plan — free users can upload up to 3 documents, pro users have no limit. Plan management lives on the PilotMaster home dashboard.

**Upload a document.** Drag and drop a file into the upload area in the sidebar, or click to browse. Supported formats are PDF, DOCX, TXT, MD, CSV, XLSX, PNG, JPG, and JPEG. The moment you hit Upload, PilotCore takes over — it applies a boundary-aware chunking strategy that creates approximately 500-character chunks with 80-character overlap, preferring sentence and newline boundaries to improve semantic coherence during retrieval. Every chunk is then embedded using `all-mpnet-base-v2` and stored in a FAISS index scoped to your user account. For scanned PDFs and images, OCR runs automatically via a stabilized Tesseract + pdf2image fallback pipeline with safer failure handling and OCR-aware ingestion diagnostics.

**Ask questions.** Type a question in the chat input and hit Send or press Enter. DocPilot calls PilotCore's `run_pipeline`, which embeds your query, searches your vector store, filters out irrelevant chunks, builds a prompt, and calls Groq for generation. The answer appears in the chat with source citations showing which file and page the evidence came from.

**Manage conversations.** Every chat session is saved and listed in the sidebar. Click any session to reload its full message history. Delete sessions you no longer need with the ✕ button. Start a fresh conversation with + New Chat.

**Reset your vector store.** The Reset button in the header clears your entire FAISS index. Use this when you want to start fresh with a new set of documents.

**Jump to TracePilot.** The TracePilot → button in the header takes you directly to the observability dashboard so you can inspect the trace for the question you just asked.

---

## Using TracePilot

TracePilot is the execution intelligence dashboard. It's designed to be open alongside DocPilot — every question asked in DocPilot automatically appears here within seconds.

**The trace list.** The left sidebar shows every query that has run through PilotCore, newest first. Each entry shows the query text, a color-coded retrieval relevance tag (green = high, orange = medium, red = low), and additional tags if the query was unanswerable or the model abstained. Latency is shown inline on the right.

**Inspecting a trace.** Click any trace to open the full detail view. At the top you'll see the four evaluation dimensions:

- **retrieval** — how semantically close were the retrieved chunks to the query?
- **grounding** — how much of the response came from the retrieved evidence?
- **answerability** — did the document actually contain enough to answer this?
- **hallucination risk** — how much did the response go beyond the evidence?

Below the tags you'll see the full response, the retrieved chunks with their L2 distance scores (color-coded), and a metrics panel showing faithfulness score, query coverage, query type, and chunk count. The ranked chunk inspection shows exactly which documents and passages the retrieval system considered, with retrieval debug logging available to trace why certain chunks were selected or filtered.

**Replay.** Every trace has a Replay button. Clicking it re-runs the exact same query through PilotCore using the same user's vector store, producing a new trace linked to the original via `parent_trace_id`. This lets you compare how the same question performs across different document states or after model changes. Replayable traces are the foundation of reproducible debugging — you can step through the same question multiple times and inspect exactly where and why behavior diverges.

**Execution identity.** Every trace carries a complete version snapshot of the system that produced it — `evaluator_version`, `prompt_version`, and `retriever_version`. This means when you replay a trace and the scores change, you can tell whether the difference came from the AI behaving differently or from the evaluation system itself having changed. A hallucination score from evaluator v1 is not the same thing as a hallucination score from evaluator v2, and TracePilot makes that distinction visible.

**Live updates.** TracePilot polls for new traces every 3 seconds. You don't need to refresh — ask a question in DocPilot, switch to TracePilot, and the trace appears automatically.

**The stats bar.** The header shows live aggregate stats across all traces: total trace count, average latency, grounded count, and ungrounded count. These update as new traces arrive.

**Jump to DocPilot.** The DocPilot → button in the header takes you back to the chat interface without losing your place.

---

## What makes this different

Most RAG demos are single-file scripts. PilotMaster is architected as a production-grade platform with a clear separation between the execution kernel, the product layer, and the observability layer. The same principles that make distributed systems observable — traces, spans, telemetry — are applied to AI execution.

The result is a system where you can watch the AI think. Not just see the answer, but understand exactly how it arrived there, whether it stayed grounded, and where it might have gone wrong.

---

## Architectural honesty — what this is and what it isn’t

PilotMaster is an early-stage AI runtime and observability platform. It is not a production system at scale. Being honest about the current state and the intended direction is part of what makes the architecture credible.

### Evaluation

**The evaluators are currently heuristic-based.** Grounding, answerability, and hallucination risk are all computed from lexical overlap — word matching between the response and the retrieved chunks. This is fast, deterministic, and inspectable, which makes it a good foundation. But lexical heuristics have a ceiling. The natural evolution here is toward embedding-based semantic evaluation, LLM-as-a-judge scoring, and eventually evaluator ensembles that combine multiple signals. The current evaluators are v1 — they are designed to be replaced, which is exactly why `evaluator_version` is attached to every trace.

Retrieval relevance thresholds are currently heuristic and intentionally conservative. Correct retrievals may still occasionally be labeled low while remaining practically useful — the system favors avoiding false positives over perfect precision. This means reading evaluator scores requires context: a low retrieval score doesn't necessarily mean the answer is bad, it means the evidence signal was weak according to the current lexical heuristics.

### Retrieval

**Retrieval is now hybrid.** The system combines FAISS semantic retrieval with BM25 lexical retrieval. This works well for focused factual queries but shows weakness on broad or ambiguous ones — a query like "elaborate the document" has no semantic anchor in the chunk space, so the system falls back to top-k regardless of score. Recent stabilization work added retrieval debug tracing, FAISS ingestion diagnostics, chunk traversal safeguards, duplicate retrieval prevention, OCR ingestion stabilization, hybrid retrieval integration, BM25 persistence, and improved chunk semantic integrity checks. Retrieval quality optimization became a major phase of the project once the system moved beyond basic infrastructure debugging.

The retrieval roadmap also includes section-aware chunking to preserve document structure, semantic evaluators to measure retrieval quality, and retrieval analytics dashboards. These improvements would eliminate the contamination problem where an irrelevant chunk sneaks through because it happened to be the closest vector.

### Observability

**Trace storage and observability.** TracePilot originally stored traces in local SQLite, but this became a problem after Hugging Face rebuilds repeatedly wiped observability history due to ephemeral container storage. Trace persistence was later migrated to PostgreSQL-backed storage so telemetry, replay history, and traces survive redeploys and runtime restarts. This is fine for a single-user development environment, and it includes retrieval observability tooling with ranked chunk inspection, retrieval debug logging, replayable traces, and retrieval score visibility. At scale, this becomes a bottleneck — SQLite doesn't support concurrent writes, polling is wasteful, and there's no indexing on spans or evaluation fields. The intended direction is a proper trace store with queryable spans, aggregation pipelines, trace retention policies, and real-time streaming via WebSockets or Server-Sent Events instead of polling.

### Prompting

**Prompt versioning is manual.** Right now, bumping `prompt_version` in `pilotcore/config.py` is a manual operation. There is no prompt registry, no A/B testing infrastructure, and no way to compare prompt performance across a dataset. The intended direction is a prompt management layer inside PilotCore where prompt templates are named, versioned, and stored — so TracePilot can show not just what the response was, but exactly which prompt template produced it and how that template has performed historically.

### Lineage

**Evaluator versioning exists but isn’t automated.** Version constants live in `pilotcore/config.py` and are attached to every trace. When you change the evaluation logic and bump the version, all future traces carry the new version and old traces retain the old one. What doesn’t exist yet is automated detection — the system won’t warn you if you change the evaluator without bumping the version. That’s a future guardrail.

**Trace lineage is shallow.** `parent_trace_id` links a replay to its original trace, which is the beginning of execution lineage. What’s missing is deeper lineage — tracking which document version was active, which evaluator version scored it, which prompt template was used, and how all of those evolved over time. Full execution lineage is what turns a trace store into a genuine audit trail for AI behavior.

These are not oversights. They are the known frontier of the system — the places where the architecture is intentionally designed to grow.

Additional future retrieval work includes:

- Section-aware chunking
- Metadata-aware prompts
- Retrieval analytics dashboards
- Trace filtering and replay analytics

---

# Roadmap

## Current Retrieval Stack

PilotMaster currently includes:

- Dense semantic retrieval using SentenceTransformers + FAISS
- Cosine similarity vector search
- BM25 lexical retrieval
- Hybrid semantic + keyword retrieval
- Reciprocal Rank Fusion (RRF)
- Cross-encoder reranking
- Retrieval grounding evaluation
- Trace-level observability and replay tooling

Current evaluation metrics include:

- Faithfulness
- Hallucination risk
- Answerability
- Grounding confidence

TracePilot currently supports:

- Retrieval inspection
- Chunk ranking visualization
- Latency tracking
- Execution spans
- Replayable traces
- Retrieval metrics

---

## Planned Improvements

### Parent-Child Retrieval

Retrieve smaller semantic chunks while injecting larger parent context during generation. This is expected to improve fragmented answers and research-paper comprehension.

### Query Rewriting

Rewrite vague user queries into retrieval-optimized search queries before retrieval execution.

Example:

```text
User Query:
"What tasks improved most?"

Internal Retrieval Query:
"Which GLUE tasks showed the largest accuracy gains in BERT?"
```

### Multi-Query Retrieval

Generate multiple retrieval variants for a single query to improve retrieval recall and semantic coverage.

### Retrieval Benchmark Mode

Add side-by-side retrieval strategy comparison tooling for evaluating:

- BM25
- FAISS
- Hybrid RRF
- Hybrid + Reranking

This would allow direct comparison of:

- latency
- faithfulness
- hallucination risk
- grounding quality
- retrieval effectiveness

### Metadata-Aware Retrieval

Incorporate:

- section titles
- page numbers
- abstracts
- conclusions
- headings

into retrieval ranking and filtering.

### Adaptive Chunking

Apply different chunking strategies depending on document type, including:

- research papers
- source code
- legal documents
- markdown
- structured tables

### Context Compression

Compress retrieved context before generation to improve token efficiency and scalability for long documents.

### Learned Retrieval Evaluation

Experiment with learned evaluators and LLM-as-judge approaches for more advanced grounding and retrieval quality assessment.

### Multi-Vector Retrieval

Explore ColBERT-style token-level retrieval architectures for higher semantic retrieval precision.
