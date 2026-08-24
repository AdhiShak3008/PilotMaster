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
  <h3 align="center">Retrieval Engineering • Document Intelligence • Benchmarking • Full-Stack AI Observability</h3>
</p>

<p align="center">
PilotMaster is a unified, end-to-end ecosystem for building, debugging, evaluating, benchmarking, and improving Retrieval-Augmented Generation (RAG) systems.
</p>

---

## 🔗 Live Demo

- **Production Portal**: [PilotMaster Web](https://pilot-master.vercel.app/)

---

# Table of Contents

- [The Story Behind PilotMaster](#the-story-behind-pilotmaster)
- [Why PilotMaster Exists](#why-pilotmaster-exists)
- [Why PilotMaster is Different](#why-pilotmaster-is-different)
- [Platform Philosophy](#platform-philosophy)
- [Two Operating Modes](#two-operating-modes)
- [Ecosystem Architecture](#ecosystem-architecture)
- [The Three Pillars](#the-three-pillars)
  - [📄 DocPilot](#-docpilot)
  - [🔍 TracePilot](#-tracepilot)
  - [🧪 GaugePilot](#-gaugepilot)
- [⚙️ PilotCore Shared Execution Kernel](#️-pilotcore-shared-execution-kernel)
- [⚡ 11 Multi-Select Query Enhancement Suite](#-11-multi-select-query-enhancement-suite)
- [Retrieval & Fusion Pipeline](#retrieval--fusion-pipeline)
- [Supported Active LLM Models](#supported-active-llm-models)
- [Evaluation Framework](#evaluation-framework)
- [Opening Launchpad & Interactive Topology](#opening-launchpad--interactive-topology)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Contributing](#contributing)

---

# The Story Behind PilotMaster

PilotMaster did not begin as a single monolithic application. It evolved through the convergence of three dedicated engineering platforms:

1. **📄 DocPilot**: Began as a grounded document intelligence system for conversational Q&A over private knowledge bases.
2. **🔍 TracePilot**: Began as a lightweight telemetry tool to answer: *"What exactly happened inside my RAG pipeline at every stage?"*
3. **🧪 GaugePilot**: Emerged to answer: *"Which combination of chunkers, embeddings, enhancers, rerankers, and LLMs statistically performs best?"*

As these tools matured, their shared retrieval, chunking, reranking, generation, and tracing logic was abstracted into **PilotCore** — a unified, reusable execution kernel that powers every application across operational usage and experimental benchmarking.

---

# Why PilotMaster Exists

Most RAG applications treat retrieval as a black box:
```text
Upload Document ➔ Ask Question ➔ [Black Box] ➔ Final Answer
```

Questions that usually remain unanswered:
- What chunks were retrieved and which strategy found them?
- Did BM25 lexical search find the keywords or did FAISS dense vector search capture the semantics?
- How did Cross-Encoder reranking score and prioritize the candidate pool?
- Was the answer faithfully grounded in the context or did the model hallucinate?
- How do multi-query enhancements (HyDE, Step-Back, Coreference Resolution) impact latency vs recall?
- Which LLM provides the highest precision-to-cost ratio?

**PilotMaster makes every step of this journey observable, verifiable, and benchmarkable.**

---

# Why PilotMaster is Different

| Typical RAG Application | PilotMaster Ecosystem |
| :--- | :--- |
| Returns only the final answer | Exposes the complete step-by-step retrieval lineage |
| Black-box pipeline | Full telemetry, chunk rank diagnostics & replayability |
| Single retrieval strategy | Runtime experimentation across Dense, BM25, Hybrid & RRF |
| Static model configuration | Multi-model routing (GPT-OSS 120B, GPT-OSS 20B, Qwen 3.6, DeepSeek R1) |
| No benchmarking tools | Automated multi-configuration benchmarking with GaugePilot |
| Difficult to evaluate quality | Grounding, Faithfulness, Coverage, Agreement, and Latency metrics |
| Fragile document management | Conversation-scoped document indexing and staged execution |
| Basic Markdown display | Rich GFM tables, code copy, and ChatGPT-style prompt editing |

---

# Two Operating Modes

PilotMaster features an instant global mode switcher:

### 🏭 Production Mode
- Built for everyday document research and knowledge extraction.
- Deterministic hybrid retrieval (FAISS + BM25 + Reciprocal Rank Fusion) with Cross-Encoder reranking.
- Grounded citations, conversation-scoped document selection, and streamlined interface.

### 🧪 Experimental Laboratory Mode
- Built for retrieval engineers, AI researchers, and benchmark evaluations.
- Unlocks **11 selectable query enhancement techniques** (multi-select pipeline).
- Full access to **GaugePilot** for multi-run matrix evaluations, leaderboards, and AI recommendations.
- Interactive deep telemetry inspection in **TracePilot**.

---

# Ecosystem Architecture

```text
                               ┌───────────────────────────┐
                               │   PilotMaster Launchpad   │
                               └─────────────┬─────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             │                               │                               │
             ▼                               ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
    │ 📄  DocPilot    │             │ 🔍  TracePilot   │             │ 🧪  GaugePilot  │
    │  Document QA &  │             │  Execution RAG  │             │   Benchmarking  │
    │  Intelligence   │             │   Observability │             │   & AI Matrix   │
    └────────┬────────┘             └────────┬────────┘             └────────┬────────┘
             │                               │                               │
             └───────────────────────────────┼───────────────────────────────┘
                                             │
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │      ⚙️  PilotCore Execution Kernel      │
                        ├─────────────────────────────────────────┤
                        │ • 11 Query Enhancements (HyDE, RAG...)  │
                        │ • Multi-Chunker (Parent-Child, Token..) │
                        │ • Hybrid Retriever (FAISS + BM25)       │
                        │ • Reciprocal Rank Fusion (RRF) Engine   │
                        │ • Cross-Encoder Rerankers (MiniLM...)   │
                        │ • Multi-Model Inference (Groq Engine)   │
                        │ • Automated Tracing & Metrics Evaluator │
                        └─────────────────────────────────────────┘
```

---

# The Three Pillars

### 📄 DocPilot
The document intelligence workspace for interactive research:
- **Conversation-Scoped Documents**: Uploaded documents are strictly scoped to their active chat session with zero cross-conversation leakage.
- **Rich GFM Markdown Engine**: Advanced preprocessed table formatting, copy buttons, and alternating row styling.
- **ChatGPT-Style Interactions**: Inline prompt editing, query copying, answer copying, and 1-click answer regeneration.
- **Parent-Child Chunking**: Indexes small child chunks for high-precision retrieval while passing full parent context to the LLM.

### 🔍 TracePilot
The observability layer providing real-time telemetry:
- **Step-by-Step Pipeline Profiler**: Inspect enhancement transformations, dense vs lexical candidate pools, RRF fusion scores, and cross-encoder reranking margins.
- **Trace Replay Engine**: Re-execute past queries against historical chunks to test regression fixes.
- **Evaluation Metrics**: Groundedness score, faithfulness score, semantic query coverage, and P50/P95 latency breakdown.

### 🧪 GaugePilot
The experimentation and benchmarking environment:
- **Matrix Evaluation**: Benchmark multiple configurations combining different retrieval methods, rerankers, enhancements, and models.
- **Comparative Leaderboards**: Overall, Faithfulness, Grounding, Retrieval Quality, Coverage, and Latency rankings.
- **Interactive Visualizations**: Multidimensional Radar maps, Metric Correlation Heatmaps, Parallel Coordinates, and Pareto Frontiers.
- **Autonomous AI Synthesis**: Generates architectural insight reports and production readiness scorecards with SLA validation.

---

# ⚙️ PilotCore Shared Execution Kernel

PilotCore provides the reusable underlying services for the entire ecosystem:
- **`pilotcore.runtime.pipeline`**: Deterministic orchestration engine executing enhancements, retrieval, fusion, reranking, and generation.
- **`pilotcore.enhancements`**: Modular query transformation orchestrator.
- **`pilotcore.retrieval`**: Dual-retriever engine with FAISS vector search and BM25 Okapi lexical matching.
- **`pilotcore.reranking`**: Cross-Encoder candidate rescoring.
- **`pilotcore.models`**: Curated, active multi-model LLM registry.
- **`pilotcore.tracing`**: Context-bound telemetry logger for TracePilot.
- **`pilotcore.benchmarking`**: Matrix experiment runner and statistical analyzer.

---

# ⚡ 11 Multi-Select Query Enhancement Suite

PilotMaster supports selective, multi-combination query enhancement pipelines in Experimental Mode:

| # | Technique | Description |
| :-: | :--- | :--- |
| **1** | `query_condensation` | Converts follow-up conversational queries into self-contained standalone search queries. |
| **2** | `coreference_resolution` | Resolves ambiguous pronouns ("it", "they", "that system") into explicit contextual entities. |
| **3** | `query_rewrite` | Reformulates colloquial queries into search-engine optimized terminology. |
| **4** | `sub_query_generation` | Deconstructs multi-part questions into individual atomic sub-queries. |
| **5** | `metadata_filter_extraction` | Extracts temporal, categorical, and entity constraints for structured metadata filtering. |
| **6** | `query_routing` | Dynamically classifies intent to select the optimal retrieval strategy. |
| **7** | `step_back` | Generates a high-level abstracted question to retrieve foundational concepts. |
| **8** | `keyword_expansion` | Extracts key noun phrases and enriches them with lexical synonyms. |
| **9** | `query_expansion` | Expands queries with related semantic concepts. |
| **10** | `multi_query` | Generates multiple distinct phrasing perspectives for parallel retrieval. |
| **11** | `hyde` | Generates a hypothetical passage (Hypothetical Document Embeddings) to match semantic vectors. |
| **+** | `rag_fusion` | Generates search variants and combines results using Reciprocal Rank Fusion. |

---

# Retrieval & Fusion Pipeline

```text
                           User Query
                               │
                [Enhancement Orchestration]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
    Dense Vector Search                   BM25 Lexical Search
    (SentenceTransformers + FAISS)       (Okapi BM25 Index)
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                   Reciprocal Rank Fusion (RRF)
                               │
                   Top Candidate Rescoring
                 (Cross-Encoder Reranker)
                               │
                   Final Context Synthesis
                     (Active Groq LLM)
                               │
                   Telemetry & Trace Ingestion
```

---

# Supported Active LLM Models

PilotMaster routes inference strictly through active, high-throughput Groq endpoints:

| Model Name | API Identifier | Capability & Workload |
| :--- | :--- | :--- |
| **GPT-OSS 120B** *(Default)* | `openai/gpt-oss-120b` | Flagship frontier intelligence for deep reasoning & document synthesis. |
| **GPT-OSS 20B** | `openai/gpt-oss-20b` | Ultra-fast low-latency RAG engine & strict structured JSON schema output. |
| **Qwen 3.6 27B** | `qwen/qwen3.6-27b` | High-precision reasoning, context comprehension, and multimodal vision. |
| **DeepSeek R1 70B** | `deepseek-r1-distill-llama-70b` | Deep chain-of-thought advanced reasoning for complex problem solving. |

---

# Evaluation Framework

Every query executed produces automated quantitative and qualitative evaluations:

- **Semantic Grounding**: Measures factual alignment between the generated answer and retrieved context.
- **Answer Faithfulness**: Detects hallucinations and unsupported claims.
- **Retrieval Quality**: Evaluates retriever precision, recall, and relevance confidence.
- **Query Coverage**: Assesses how thoroughly all facets of the prompt were addressed.
- **Retrieval Agreement**: Quantifies ranking correlation between dense and sparse retrievers.
- **Component Latencies**: Step-by-step latency profiling (enhancement, retrieval, rerank, generation).

---

# Opening Launchpad & Interactive Topology

The application entry portal features:
- **Interactive System Topology**: Clickable architectural map illustrating the relationships between PilotCore, DocPilot, TracePilot, and GaugePilot.
- **Seamless Authentication**: Unified Sign In, Account Creation, and Password Recovery.
- **⚡ Instant 1-Click Demo Mode**: Automatically creates and provisions a sandbox guest session to test the ecosystem with zero setup friction.
- **Unified Loading Screens**: Sleek, mode-aware blurred loading overlays across all workspaces.

---

# Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS Design System, Responsive Glassmorphism |
| **Backend** | FastAPI, Python 3.10+, Uvicorn, Pydantic v2 |
| **Database** | Neon Distributed PostgreSQL, SQLAlchemy |
| **Vector Engine** | FAISS, NumPy, SentenceTransformers (`all-mpnet-base-v2`) |
| **Lexical Engine** | Rank-BM25 (BM25Okapi) |
| **Reranker** | Cross-Encoder (`ms-marco-MiniLM-L-6-v2`) |
| **LLM Inference** | Groq Hardware Acceleration (OpenAI OSS, Qwen, DeepSeek) |
| **Document Processing** | PyPDF, Tesseract OCR, Python-Docx, LangChain Text Splitters |

---

# Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL database (or Neon cloud connection)
- Groq API Key

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/AdhiShak3008/PilotMaster.git
cd PilotMaster

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -e .

# Configure environment variables
# Ensure .env contains GROQ_API_KEY, DATABASE_URL, and SECRET_KEY

# Start backend server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

# Contributing

Contributions, issues, and feature proposals are welcome! Please open an issue or pull request on GitHub.

---

<p align="center">
  <b>PilotMaster © 2026</b> • Observable AI Execution & Retrieval Engineering
</p>
