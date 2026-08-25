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

---

# Table of Contents

- [The Story Behind PilotMaster](#the-story-behind-pilotmaster)
- [Why PilotMaster Exists](#why-pilotmaster-exists)
- [Why PilotMaster is Different](#why-pilotmaster-is-different)
- [Platform Philosophy](#platform-philosophy)
- [Two Operating Modes](#two-operating-modes)
- [Platform Overview](#platform-overview)
- [Unified Workflow](#unified-workflow)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Retrieval Pipeline](#retrieval-pipeline)
- [Dense Retrieval](#dense-retrieval)
- [BM25 Retrieval](#bm25-retrieval)
- [Reciprocal Rank Fusion (RRF)](#reciprocal-rank-fusion-rrf)
- [Cross-Encoder Reranking](#cross-encoder-reranking)
- [7-Strategy Chunking Engine](#7-strategy-chunking-engine)
- [Dual-Tier Memory System](#dual-tier-memory-system)
- [Context-Aware Knowledge & Glossary System](#context-aware-knowledge--glossary-system)
- [DocPilot](#docpilot)
- [TracePilot](#tracepilot)
- [GaugePilot](#gaugepilot)
- [PilotCore](#pilotcore)
- [Experimentation Framework](#experimentation-framework)
- [11 Multi-Select Query Enhancement Suite](#11-multi-select-query-enhancement-suite)
- [Supported Models](#supported-models)
- [Evaluation Framework](#evaluation-framework)
- [Current Features](#current-features)
- [Research Directions](#research-directions)
- [Roadmap](#roadmap)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Contributing](#contributing)
- [Final Philosophy](#final-philosophy)

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

- OCR ingestion & multi-format PDF/text processing
- Conversation-scoped document isolation (zero cross-chat leakage)
- Runtime model selection with active frontier LLMs
- Retrieval experimentation (Dense, BM25, Hybrid, RRF, Cross-Encoder)
- ChatGPT-style inline query editing, query copy, answer copy, and 1-click answer regeneration
- Production-grade GFM table synthesis and preprocessed markdown rendering
- Production and experimental workflows

---

## 🔍 TracePilot

TracePilot originally began as a lightweight **text-file based RAG evaluator**.

The original idea was simply:

> "What exactly happened inside my RAG pipeline?"

That tiny evaluator eventually evolved into an observability platform capable of:

- Retrieval diagnostics & candidate pool inspection
- Dense vs Lexical rank comparisons
- Replayable traces for regression verification
- Hallucination analysis & evidence support scoring
- Retrieval agreement analysis
- Step-by-step token and component latency breakdowns (P50/P95)
- Automated qualitative and quantitative evaluation metrics

---

## ⚙️ The Birth of PilotCore

As both projects matured, they started solving the exact same problems.

Both required:

- Ingestion & Text Splitting
- Dense Vector Retrieval & BM25 Indexing
- Reciprocal Rank Fusion
- Cross-Encoder Reranking
- Prompt Construction
- LLM Generation
- Tracing & Telemetry Collection
- Evaluation Metrics Calculation

Maintaining separate implementations became increasingly painful.

The solution was to extract everything shared into a common execution engine.

That engine became:

# ⚙️ PilotCore

PilotCore is the shared kernel powering every workflow inside the platform.

Today:

- **DocPilot** runs on PilotCore.
- **TracePilot** runs on PilotCore.
- **GaugePilot** runs on PilotCore.

---

## 🔬 The Emergence of GaugePilot

As experimentation increased, another question emerged:

> "Which combination of chunkers, embeddings, enhancers, rerankers, and LLMs actually performs best?"

This eventually led to the creation of **GaugePilot**.

GaugePilot exists to benchmark and compare:

- Retrieval strategies (Dense, BM25, Hybrid, Hybrid + RRF, Hybrid + Reranking)
- Active LLM Models (GPT-OSS 120B, GPT-OSS 20B, Qwen 3.6 27B, DeepSeek R1 70B)
- Rerankers (MiniLM, TinyBERT, BGE Large, BGE M3)
- 11 Multi-Select Query Enhancements
- End-to-end multi-configuration matrices with statistical visual analytics and autonomous AI engineering synthesis

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

| Typical RAG App | PilotMaster |
| :--- | :--- |
| Returns only the final answer | Exposes the entire retrieval journey |
| Hidden retrieval process | Full retrieval observability |
| No explanation of why chunks were retrieved | Chunk lineage and provenance tracking |
| Limited debugging capabilities | Replayable traces and diagnostics |
| Single retrieval strategy | Runtime retrieval experimentation |
| Fixed model configuration | Runtime model switching across active frontier LLMs |
| No benchmarking tools | Built-in benchmarking with GaugePilot |
| Difficult to compare configurations | Leaderboards, Pareto frontiers, and comparative evaluation |
| Minimal evaluation metrics | Grounding, faithfulness, coverage, latency, hallucination risk, and more |
| Retrieval treated as a black box | Retrieval treated as a first-class engineering problem |
| Little insight into reranking | Reranker confidence, margin, and scoring analysis |
| No understanding of retriever agreement | Retrieval agreement analysis |
| Hard to reproduce failures | Replayable and inspectable executions |
| Little support for research workflows | Dedicated Experimental Laboratory Mode |
| Focuses only on generation | Focuses on retrieval, observability, and experimentation |
| One-size-fits-all interface | Separate Production and Experimental modes |
| No way to determine the best configuration | Benchmarking and configuration ranking |
| Usually a single application | Unified platform of DocPilot, TracePilot, GaugePilot, and PilotCore |

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

- Stable, deterministic hybrid pipelines (FAISS + BM25 + RRF)
- Cross-Encoder reranking
- Fast execution with low latency
- Minimal controls for high user focus
- Grounded question answering
- Direct citations and conversation-scoped document staging

---

## 🧪 Experimental Mode

Designed for retrieval engineering and research.

Features:

- **11 Selectable Multi-Query Enhancement Suite**
- Runtime model switching
- Embedding experimentation
- Reranker experimentation
- Benchmarking with GaugePilot
- Multi-metric comparative evaluation
- Deep observability tooling in TracePilot

GaugePilot currently exists exclusively inside Experimental Mode.

---

# Platform Overview

## 📄 DocPilot

The document intelligence workspace.

Provides:

- Document ingestion & OCR processing
- Conversation-scoped document isolation
- Grounded QA with citation validation
- ChatGPT-style inline query editing, query copy, answer copy, and regeneration
- Production-grade GFM table synthesis
- Runtime model selection
- Retrieval experimentation
- Multi-model comparisons

---

## 🔍 TracePilot

The observability workspace.

Provides:

- Retrieval diagnostics
- Per-chunk scoring & ranking inspection
- Replayable traces
- Hallucination analysis
- Evaluation metrics
- Retrieval agreement analysis
- Chunk lineage inspection

---

## 🔬 GaugePilot

The benchmarking workspace.

Provides:

- Multi-configuration pipeline benchmarking
- Comparative leaderboards (Overall, Faithfulness, Grounding, Quality, Coverage, Latency)
- Multidimensional radar profile maps
- Metric correlation heatmaps with in-cell architectural specs
- Parallel coordinates & performance profiles
- Pareto frontier trade-off analysis
- Autonomous AI Engineering Insights & Strategic Recommendations

---

## ⚙️ PilotCore

The shared execution engine.

Provides:

- Modular query enhancement orchestration
- Hybrid retrieval (Dense + BM25)
- Reciprocal Rank Fusion
- Cross-Encoder candidate rescoring
- Prompt construction
- LLM generation
- Evaluation metrics
- Telemetry collection & tracing
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
Frontend (React + Vite)
         ↓
FastAPI Backend
         ↓
⚙️ PilotCore Shared Kernel
         ↓
Query Enhancement Orchestrator (11 Techniques)
         ↓
Dense Vector (FAISS) + Lexical BM25 (Okapi)
         ↓
Reciprocal Rank Fusion (RRF)
         ↓
Cross-Encoder Reranking (MiniLM / BGE)
         ↓
Context Selection & Prompt Builder
         ↓
LLM Generation (Active Groq Models)
         ↓
Automated Evaluation (Grounding / Faithfulness / Coverage)
         ↓
Trace Ingestion & Telemetry Storage (PostgreSQL)
```

---

# Project Structure

```text
PilotMaster/
├── DocPilot/
│   └── backend/          # DocPilot document intelligence API & schemas
├── GaugePilot/
│   └── backend/          # GaugePilot benchmarking endpoints & dependencies
├── TracePilot/
│   └── backend/          # TracePilot telemetry ingestion & query API
├── pilotcore/
│   ├── benchmarking/     # Benchmark runner, visualizers & AI report generator
│   ├── chunking/         # Parent-child, recursive, and token splitters
│   ├── enhancements/     # 11 query enhancement implementations & orchestrator
│   ├── evaluation/       # Faithfulness, grounding, coverage, and latency evaluators
│   ├── generation/       # LLM prompt builders and generation orchestrators
│   ├── models/           # Active Groq model registry & configuration
│   ├── reranking/        # Cross-Encoder model interfaces
│   ├── retrieval/        # FAISS vector store, BM25, and RRF rank fusion
│   ├── runtime/          # Deterministic pipeline execution kernel
│   └── tracing/          # Telemetry logging & trace context managers
├── frontend/
│   ├── src/
│   │   ├── components/   # OpeningLanding, LoadingOverlay, Theme context
│   │   ├── docpilot/     # DocPilot dashboard, MarkdownRenderer, chat session UI
│   │   ├── tracepilot/   # TraceExplorer telemetry dashboard & profiler
│   │   └── gaugepilot/   # ExperimentSetup, Leaderboards, AI Analysis, Visualizations
├── docs/
└── scripts/
```

---

# Retrieval Pipeline

```text
Query
  ↓
Query Enhancement (HyDE, Step-Back, Rewrite, etc.)
  ↓
Dense Retrieval (FAISS)
  ↓
BM25 Retrieval (Okapi)
  ↓
Reciprocal Rank Fusion (RRF)
  ↓
Candidate Pool
  ↓
Cross-Encoder Reranking (MiniLM / BGE)
  ↓
Context Selection
  ↓
LLM Generation (Active Groq Engine)
  ↓
Evaluation
  ↓
Trace Storage (PostgreSQL)
```

---

# Dense Retrieval

Semantic retrieval uses:

- **SentenceTransformers** (`all-mpnet-base-v2`)
- **FAISS** (Facebook AI Similarity Search)
- **Cosine Similarity**
- **IndexFlatIP / IndexFlatL2**

Responsibilities:

- Concept matching
- Semantic recall
- Contextual retrieval

---

# BM25 Retrieval

Lexical retrieval uses:

- **Rank-BM25** (Okapi BM25 index)

Responsibilities:

- Exact terminology matching
- Acronyms & technical abbreviations
- Domain keywords
- Lexical precision
- Negation-sensitive retrieval

---

# Reciprocal Rank Fusion (RRF)

Combines:

- Dense vector rankings
- BM25 lexical rankings

Benefits:

- Maximizes candidate recall
- Delivers stable, parameter-free rank scoring
- Eliminates retriever scale imbalance & bias

---

# Cross-Encoder Reranking

Supported families:

- **MiniLM** (`ms-marco-MiniLM-L-6-v2`)
- **TinyBERT**
- **BGE Large**
- **BGE M3**
- **FlashRank** (Quantized)
- **Cohere Rerank API**

Responsibilities:

- Full self-attention candidate rescoring
- High-precision evidence prioritization
- Margin and confidence signal calculation

---

# 7-Strategy Chunking Engine

PilotMaster implements 7 specialized chunking engines in `pilotcore/chunking/`, selectable at runtime across DocPilot and GaugePilot:

| # | Strategy | Implementation | Description & Best Use Case |
| :-: | :--- | :--- | :--- |
| **1** | **Parent-Child (1200/300)** | [`parent_child.py`](pilotcore/chunking/parent_child.py) | Slices small 300-char child chunks for high-precision vector search, while resolving to large 1200-char parent blocks for prompt generation. |
| **2** | **Contextual Chunking** | [`contextual.py`](pilotcore/chunking/contextual.py) | Leverages fast parallel LLM inference (Groq LPU) during ingestion to generate 20–35 word situating context prefixes, eliminating standalone chunk ambiguity. |
| **3** | **Structure-Aware** | [`structure_aware.py`](pilotcore/chunking/structure_aware.py) | Parses document syntax (Markdown `#` to `######` headers, HTML headings, code fences, and tables), prefixing breadcrumb paths (`[Architecture > Storage]`) to sub-chunks. |
| **4** | **Recursive Character** | [`recursive.py`](pilotcore/chunking/recursive.py) | Hierarchically splits text across prioritized delimiters (`\n\n`, `\n`, `. `, `? `, `! `, ` `) to preserve paragraph and sentence integrity. |
| **5** | **Fixed Window (500c)** | [`fixed.py`](pilotcore/chunking/fixed.py) | Deterministic character window slicing (default 500c with 80c overlap) snapping to sentence boundaries. |
| **6** | **Token-Based (256t)** | [`token.py`](pilotcore/chunking/token.py) | Exact Byte-Pair Encoding (BPE) tokenizer boundary alignment, preventing sub-word corruption. |
| **7** | **Semantic Similarity** | [`semantic.py`](pilotcore/chunking/semantic.py) | Slices text dynamically at statistical drops in consecutive sentence embedding cosine similarity (topic shifts). |

---

# Dual-Tier Memory System

PilotMaster features an integrated **Dual-Tier Memory Architecture** providing both active session continuity and cross-session personalized recall:

```text
User Query ("What about its pricing?")
               │
               ├──► [Tier 1: Short-Term Working Memory Buffer] (Last 8 messages)
               │         │
               │         ├──► Query Condensation: "What is the pricing model of PilotMaster?"
               │         └──► Coreference Resolution: Resolves pronouns ("it", "they")
               │
               ├──► [Tier 2: Long-Term Episodic Vector Memory] (User FAISS Partition)
               │         │
               │         └──► Semantic Search: Recalls user preferences & cross-session insights
               │
               └──► [PilotCore Unified Generation Prompt]
                         │
                         ├──► Document Context Chunks
                         ├──► User Episodic Memory Context
                         ├──► Conversation Working Memory History
                         └──► Synthesized Factual Answer
```

### 1. Short-Term Conversational Working Memory (Session Buffer)
- **Active Sliding Window**: Queries the recent 8 messages (4 full Q&A turns) from SQLite/PostgreSQL per `session_id`.
- **Query Condensation**: Sub-second rewriting of follow-up questions into standalone search statements.
- **Prompt Grounding**: Injects formatted conversation memory turns into the synthesis prompt.

### 2. Long-Term Episodic Semantic Vector Memory
- **User-Partitioned FAISS Store**: Dedicated memory index (`vector_store/memory_{user_id}/`) storing cross-session user preferences and factual summaries.
- **TracePilot Observability**: Telemetry tiles record active memory turn count and exact recalled episodic memories for every trace.

---

# Context-Aware Knowledge & Glossary System

PilotMaster includes a slide-over **Glassmorphic Terminology & Knowledge Drawer** across every page in both Production and Experimental modes:

- **Strict Contextual Scoping**: Dynamically filters terms strictly relevant to the active page (`DocPilot`, `TracePilot`, `GaugePilot`, `Hub`, or `Landing`), with a 1-click toggle to search all 60+ ecosystem terms.
- **Intelligent Multi-Token Fuzzy Search**: Matches across titles, aliases, formulas, and definitions (e.g. searching `"hyde rag"` or `"llama fast"` or `"faithfulness formula"` instantly surfaces relevant entries).
- **Live `<mark>` Keyword Highlighting**: Real-time visual highlighting of searched query tokens.
- **Smart Auto-Fallback**: If zero matches are found on the active page, it automatically searches and displays matching terms from the entire platform.

---

# DocPilot

DocPilot is the primary user-facing workspace for interactive document intelligence.

### Capabilities:

- **Document Ingestion**: Seamless ingestion of PDFs, Word documents, and text files.
- **Conversation-Scoped Isolation**: Uploaded documents belong strictly to their active chat session, ensuring clean document sets with zero cross-chat contamination.
- **ChatGPT-Style Interaction**:
  - Edit submitted queries directly inline.
  - 1-click copy query to clipboard.
  - 1-click copy answer to clipboard.
  - 1-click answer regeneration with instant re-querying.
- **Rich GFM Markdown Engine**: Custom preprocessor rendering formatted markdown tables with frosted glass styling, column headers, and copyable code blocks.
- **Parent-Child Chunking**: Indexes small child chunks for precise retrieval while providing full parent context to the LLM.
- **Runtime Model Selection**: Instantly toggle between active frontier LLMs.

---

# TracePilot

TracePilot exposes the internal behavior of the system with full-stack observability.

## Per-Chunk Diagnostics

- **Dense Score**: Cosine similarity from FAISS vector search
- **Dense Rank**: Position in dense candidate pool
- **BM25 Score**: BM25 Okapi lexical relevance score
- **BM25 Rank**: Position in sparse candidate pool
- **RRF Score**: Combined Reciprocal Rank Fusion score
- **Reranker Score**: Cross-Encoder confidence score
- **Confidence & Margin**: Separation margin between top candidates
- **Final Rank**: Prioritized order passed into the LLM context

## Replayable Traces

Replay enables:

- Instant regression testing
- Retrieval failure debugging
- Step-by-step prompt inspection
- Real-time token latency profiling

---

# GaugePilot

GaugePilot focuses on comparative evaluation and autonomous engineering synthesis.

## Benchmarking Features

- **Enterprise AI Synthesis & Engineering Reports**:
  - **Architectural Insight Report**: Executive Synthesis, Proven Strengths & Capabilities, Bottlenecks & Failure Modes, Tradeoff Observations, and Strategic Benchmark Takeaways.
  - **Engineering Recommendation Report**: Production Readiness Scorecard (with SLA validation), Executive Recommendation, Prioritized Action Roadmap (P0/P1/P2), Pipeline Optimizations, and Next Experiment Blueprints.
  - **Interactive Collapsible Sections**: Dynamic accordions with item counts, instant hover feedback, and global Expand/Collapse controls.
  - **1-Click Markdown Export**: Copy complete markdown engineering reports.
- **Interactive Configuration Badges (`ConfigBadge`)**:
  - Normalized semantic identifiers (`Config 1`, `Config 2`, etc.) with instant glassmorphic specification popovers detailing LLM models, retrieval methods, rerankers, chunkers, and query enhancements.
- **Advanced Visualizations**:
  - Configuration Leaderboards & Pareto Frontier Analysis
  - Multidimensional Radar Profile Maps
  - Granular Metric Correlation Heatmaps with in-cell architectural specs
  - Parallel Coordinates & Performance Profiles
- **Multi-Run Benchmarking & Historical Regression Tracking**

## Evaluation Metrics

- **Retrieval Quality & Agreement**
- **Semantic Grounding & Evidence Alignment**
- **Answer Faithfulness & Hallucination Risk**
- **Semantic Query Coverage**
- **Answerability & Abstention Rate**
- **End-to-End & Component Latency (P50/P95)**

---

# PilotCore

PilotCore acts as the execution kernel shared by every workspace.

Responsibilities:

- Retrieval orchestration
- Dense & lexical fusion
- Cross-Encoder reranking
- Prompt construction
- LLM generation
- Evaluation scoring
- Telemetry & trace ingestion
- Matrix benchmark execution

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
- Step-Back Prompting
- Sub-Query Generation
- Coreference Resolution
- Query Condensation
- Metadata Filter Extraction
- Query Routing
- Keyword Expansion
- RAG-Fusion

## Runtime Controls

- Model Selection
- Embedding Selection
- Reranker Selection
- Chunker Selection
- Retrieval Strategy Selection

---

# 11 Multi-Select Query Enhancement Suite

PilotMaster supports selective, multi-combination query enhancement pipelines in Experimental Mode:

| # | Technique | Function & Workload |
| :-: | :--- | :--- |
| **1** | `query_condensation` | Converts follow-up conversational queries into standalone, self-contained search queries. |
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

# Supported Models

PilotMaster routes inference strictly through active, high-throughput Groq endpoints:

| UI Display Name | API Identifier | Role & Workload |
| :--- | :--- | :--- |
| **GPT-OSS 120B** *(Default)* | `openai/gpt-oss-120b` | Flagship frontier intelligence for deep reasoning & document synthesis. |
| **GPT-OSS 20B** | `openai/gpt-oss-20b` | Ultra-fast low-latency RAG engine & strict structured JSON schema output. |
| **Qwen 3.6 27B** | `qwen/qwen3.6-27b` | High-precision reasoning, context comprehension, and multimodal vision. |
| **DeepSeek R1 70B** | `deepseek-r1-distill-llama-70b` | Deep chain-of-thought advanced reasoning for complex problem solving. |

---

# Evaluation Framework

PilotMaster evaluates:

- **Grounding**: Factual support of generated answers against retrieved context.
- **Faithfulness**: Hallucination detection and claim verification.
- **Retrieval Quality**: Retriever precision, recall, and relevance confidence.
- **Query Coverage**: Completeness of the answer across all prompt facets.
- **Retrieval Agreement**: Cross-retriever rank correlation.
- **Hallucination Risk**: Automated abstention on unsupported facts.
- **Answerability**: Binary verification of context sufficiency.
- **Latency**: P50/P95 end-to-end and component latency measurements.

---

# Current Features

## Retrieval & Ingestion
- Dense Retrieval (FAISS)
- BM25 Retrieval (Okapi)
- Hybrid Retrieval (Dense + BM25 + RRF)
- Cross-Encoder Reranking (MiniLM, TinyBERT, BGE Large, BGE M3, FlashRank, Cohere)
- **7-Strategy Chunking**: Parent-Child, Contextual Chunking, Structure-Aware, Recursive, Fixed Window, Token-Based, Semantic Similarity

## Memory & Continuity
- **Short-Term Conversational Working Memory**: Active session sliding-window buffer with automatic sub-second query condensation and coreference resolution.
- **Long-Term Episodic Vector Memory**: Dedicated user-partitioned FAISS memory stores for cross-session personalized preferences and facts.

## Observability & Telemetry
- Replayable Traces
- Retrieval Diagnostics & Chunk Lineage Progression
- Consensus & Lexical/Semantic Concordance Analysis
- Hallucination Risk Index & Abstention Guardrails
- Memory Turns & Episodic Recall Observability Tiles

## Benchmarking & Evaluation
- Leaderboards & Rankings with ELO / Win Rate
- Pareto Frontier Trade-Off Analysis (Latency vs Quality)
- Correlation Matrix & Multidimensional Radar Profiles
- Metric Heatmaps with In-Cell Architectural Specs
- Parallel Coordinates & Multi-Run Regression Tracking
- Autonomous AI Engineering Insights & Executive Recommendations

## Document Intelligence
- Document OCR & Multi-Format PDF/Text/Docx Ingestion
- Conversation-Scoped Document Isolation (Zero cross-chat leakage)
- Grounded QA with Strict Multi-Document Citation Attribution
- ChatGPT-Style Inline Query Edit, Copy, and Answer Regeneration
- Rich Preprocessed GFM Table Rendering with Glassmorphism
- **Context-Aware Glossary**: Slide-over terminology drawer with multi-token fuzzy search and live keyword highlighting across all pages.

---

# Research Directions

Current focus areas:

- Semantic Chunking & Parent-Child Optimization
- Dynamic Query Rewriting & Expansion
- Multi-Query Retrieval & RAG-Fusion
- Contextual Retrieval & Compression
- Metadata-Aware Filtering
- Agentic Multi-Hop Retrieval
- Graph RAG & Entity Networks

Observation:

> Retrieval quality increasingly appears to be a larger bottleneck than generation quality.

---

# Roadmap

## Retrieval Engineering

- Agentic Multi-Hop Retrieval
- Graph RAG & Knowledge Graph Traversal
- Metadata Filter Automation
- Adaptive Semantic Chunking

## Evaluation

- Multi-Judge Ensembles
- Grounding Regression Testing
- Automated Synthetic Benchmark Generation

## Observability

- Failure Clustering & Root Cause Analysis
- Cross-Run Trace Comparisons
- Advanced Token Profiling Diagnostics

## Experimentation

- Retrieval A/B Testing
- Embedding Benchmarks
- Reranker Benchmarks
- Side-by-Side Live Model Comparison

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
| **Deployment** | Vercel (Frontend) + Hugging Face Spaces / Cloud (Backend) |

---

# Local Setup

## Backend

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

## Frontend

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
