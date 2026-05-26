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

---

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
4. PilotCore searches the user's FAISS vector store for relevant chunks
5. Irrelevant chunks (L2 distance > 1.4) are filtered out before the LLM sees them
6. PilotCore builds a prompt — QA-style for direct questions, summarization-style for broad requests
7. PilotCore calls Groq (`llama-3.1-8b-instant`) for generation
8. PilotCore runs four-dimensional evaluation on the response
9. PilotCore emits the full trace to TracePilot via HTTP
10. User sees the answer in DocPilot. AI engineer sees the trace in TracePilot.

---

## The evaluation system

Every response is judged across four independent dimensions:

**Retrieval Relevance** — did the vector store find chunks that are actually related to the query? Measured by L2 embedding distance. Scores below 0.8 are high, 0.8–1.2 are moderate, above 1.2 are low.

**Grounding Confidence** — did the model answer using the retrieved evidence? Measured by word overlap between the response and the chunks, with stopwords excluded and a length penalty applied to longer responses. If the model correctly says "I don't have enough information", it is rewarded with high grounding.

**Answerability** — did the document actually contain enough to answer this question? Measured by how many query keywords appear in the retrieved chunks. Broad queries like "explain the document" are capped at partial — no document can fully answer an open-ended request.

**Hallucination Risk** — how much of the response went beyond the evidence? Derived from faithfulness score with a length penalty. A short, accurate answer scores low risk. A long response that introduces unsupported facts scores high.

---

## Tech stack

| Layer        | Technology                                                               |
| ------------ | ------------------------------------------------------------------------ |
| LLM          | Groq — llama-3.1-8b-instant                                              |
| Embeddings   | sentence-transformers — all-mpnet-base-v2 (local, no server needed)      |
| Vector store | FAISS (per-user, persisted to disk)                                      |
| Backend      | FastAPI (unified server, DocPilot + TracePilot mounted as sub-apps)      |
| Database     | PostgreSQL (DocPilot users/docs/chat), SQLite (TracePilot traces)        |
| Frontend     | React + Vite (unified app, tab-switched between DocPilot and TracePilot) |

---

## Running it

### Prerequisites

- Python 3.10+
- PostgreSQL running locally (`rag_saas` database)
- A Groq API key

### Setup

```bash
# Install Python dependencies
pip install -r DocPilot/backend/requirements.txt
pip install -e .

# Install frontend dependencies
cd frontend && npm install
```

### Configure

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/rag_saas
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

## 🌐 Production Cloud Deployment

PilotMaster is architected to decouple cleanly across managed infrastructure tiers for production environments:

### 1. Database Tier (Serverless Postgres)

- **Provider:** Neon.tech or Supabase.
- **Setup:** Provision a managed PostgreSQL instance and use the provided serverless connection string (`postgresql://...`) to replace your local database URL.

### 2. Backend API Substrate (FastAPI Core)

- **Provider:** Render or Railway (Python Web Service Web Tier).
- **Build Command:** `pip install -r DocPilot/backend/requirements.txt && pip install -e .`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables Required:**
  - `GROQ_API_KEY`: Production hardware passkey from console.groq.com.
  - `DATABASE_URL`: Your live cloud connection string.
  - `SECRET_KEY`: A secure string for handling application auth state.

### 3. Frontend Application Layer (React + Vite static edge)

- **Provider:** Vercel or Netlify.
- **Root Directory:** `frontend/`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables Required:**
  - `VITE_API_BASE_URL`: Point this to your live Render/Railway backend domain.

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
- **Retrieval runtime** — searches the vector store, returns the top-k chunks by L2 distance, then filters out anything above the relevance threshold before the LLM sees it. For broad queries where everything gets filtered, it falls back to the top 3 chunks so the LLM always has context.
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

**Upload a document.** Drag and drop a file into the upload area in the sidebar, or click to browse. Supported formats are PDF, DOCX, TXT, MD, CSV, XLSX, PNG, JPG, and JPEG. The moment you hit Upload, PilotCore takes over — it extracts the text, chunks it into 500-character segments with 50-character overlap, embeds every chunk using `all-mpnet-base-v2`, and stores the vectors in a FAISS index scoped to your user account. For scanned PDFs and images, OCR runs automatically via Tesseract.

**Ask questions.** Type a question in the chat input and hit Send or press Enter. DocPilot calls PilotCore's `run_pipeline`, which embeds your query, searches your vector store, filters out irrelevant chunks, builds a prompt, and calls Groq for generation. The answer appears in the chat with source citations showing which file and page the evidence came from.

**Manage conversations.** Every chat session is saved and listed in the sidebar. Click any session to reload its full message history. Delete sessions you no longer need with the ✕ button. Start a fresh conversation with + New Chat.

**Reset your vector store.** The Reset button in the header clears your entire FAISS index. Use this when you want to start fresh with a new set of documents.

**Jump to TracePilot.** The TracePilot → button in the header takes you directly to the observability dashboard so you can inspect the trace for the question you just asked.

---

## Using TracePilot

TracePilot is the execution intelligence dashboard. It's designed to be open alongside DocPilot — every question asked in DocPilot automatically appears here within seconds.

**The trace list.** The left sidebar shows every query that has run through PilotCore, newest first. Each entry shows the query text, a color-coded retrieval relevance tag (green = high, orange = moderate, red = low), and additional tags if the query was unanswerable or the model abstained. Latency is shown inline on the right.

**Inspecting a trace.** Click any trace to open the full detail view. At the top you'll see the four evaluation dimensions:

- **retrieval** — how semantically close were the retrieved chunks to the query?
- **grounding** — how much of the response came from the retrieved evidence?
- **answerability** — did the document actually contain enough to answer this?
- **hallucination risk** — how much did the response go beyond the evidence?

Below the tags you'll see the full response, the retrieved chunks with their L2 distance scores (color-coded), and a metrics panel showing faithfulness score, query coverage, query type, and chunk count.

**Replay.** Every trace has a Replay button. Clicking it re-runs the exact same query through PilotCore using the same user's vector store, producing a new trace linked to the original via `parent_trace_id`. This lets you compare how the same question performs across different document states or after model changes.

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

**The evaluators are currently heuristic-based.** Grounding, answerability, and hallucination risk are all computed from lexical overlap — word matching between the response and the retrieved chunks. This is fast, deterministic, and inspectable, which makes it a good foundation. But lexical heuristics have a ceiling. The natural evolution here is toward embedding-based semantic evaluation, LLM-as-a-judge scoring, and eventually evaluator ensembles that combine multiple signals. The current evaluators are v1 — they are designed to be replaced, which is exactly why `evaluator_version` is attached to every trace.

**Retrieval is vector similarity only.** FAISS with L2 distance is the entire retrieval stack right now. This works well for focused factual queries but shows weakness on broad or ambiguous ones — a query like "elaborate the document" has no semantic anchor in the chunk space, so the system falls back to top-k regardless of score. The next retrieval evolution is hybrid search: combining dense vector retrieval with sparse keyword matching (BM25), and adding a cross-encoder reranker to re-score the top candidates before they reach the LLM. That would eliminate the contamination problem where an irrelevant chunk sneaks through because it happened to be the closest vector.

**Trace storage is operationally thin.** TracePilot currently stores traces in SQLite and polls for new ones every 3 seconds. This is fine for a single-user development environment. At scale, this becomes a bottleneck — SQLite doesn’t support concurrent writes, polling is wasteful, and there’s no indexing on spans or evaluation fields. The intended direction is a proper trace store with queryable spans, aggregation pipelines, trace retention policies, and real-time streaming via WebSockets or Server-Sent Events instead of polling.

**Prompt versioning is manual.** Right now, bumping `prompt_version` in `pilotcore/config.py` is a manual operation. There is no prompt registry, no A/B testing infrastructure, and no way to compare prompt performance across a dataset. The intended direction is a prompt management layer inside PilotCore where prompt templates are named, versioned, and stored — so TracePilot can show not just what the response was, but exactly which prompt template produced it and how that template has performed historically.

**Evaluator versioning exists but isn’t automated.** Version constants live in `pilotcore/config.py` and are attached to every trace. When you change the evaluation logic and bump the version, all future traces carry the new version and old traces retain the old one. What doesn’t exist yet is automated detection — the system won’t warn you if you change the evaluator without bumping the version. That’s a future guardrail.

**Trace lineage is shallow.** `parent_trace_id` links a replay to its original trace, which is the beginning of execution lineage. What’s missing is deeper lineage — tracking which document version was active, which evaluator version scored it, which prompt template was used, and how all of those evolved over time. Full execution lineage is what turns a trace store into a genuine audit trail for AI behavior.

These are not oversights. They are the known frontier of the system — the places where the architecture is intentionally designed to grow.
