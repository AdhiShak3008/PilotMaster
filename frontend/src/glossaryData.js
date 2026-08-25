/**
 * PilotMaster Comprehensive Knowledge & Terminology System
 * Strictly scoped by Page and Mode with intelligent multi-token fuzzy search.
 */

export const GLOSSARY_CATEGORIES = [
  "All Categories",
  "Foundation Models",
  "Embeddings & Vectors",
  "Rerankers",
  "Retrieval Strategies",
  "Chunking Strategies",
  "Query Enhancements",
  "Observability & Telemetry",
  "Benchmarking & Evaluation",
  "Platform & Architecture",
];

export const GLOSSARY_TERMS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. FOUNDATION MODELS (LLMs)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "model_gpt_oss_120b",
    title: "GPT-OSS 120B",
    aliases: ["gpt-oss-120b", "openai/gpt-oss-120b", "gpt oss 120b", "frontier model", "120b", "large model"],
    pages: ["docpilot", "gaugepilot", "home"],
    modes: ["all"],
    category: "Foundation Models",
    definition:
      "A high-intelligence 120-billion parameter frontier open-weights LLM running with sub-second token streaming via Groq LPU inference.",
    whyItMatters:
      "Serves as the flagship synthesis engine for complex document reasoning, multi-document synthesis, structured GFM markdown tables, and comprehensive answer grounding.",
    location: "DocPilot Model selector dropdown, GaugePilot model matrix, and Home system badge.",
  },
  {
    id: "model_gpt_oss_20b",
    title: "GPT-OSS 20B",
    aliases: ["gpt-oss-20b", "openai/gpt-oss-20b", "gpt oss 20b", "fast model", "20b", "efficient rag"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["all"],
    category: "Foundation Models",
    definition:
      "An ultra-fast, compact 20-billion parameter neural model optimized for high-throughput, low-latency question answering and preliminary query transformations.",
    whyItMatters:
      "Delivers 3-5x faster time-to-first-token (TTFT) with low token cost while maintaining strong factual adherence.",
    location: "DocPilot Model selector and GaugePilot Experiment Setup.",
  },
  {
    id: "model_qwen_3_6_27b",
    title: "Qwen 3.6 27B",
    aliases: ["qwen/qwen3.6-27b", "qwen 3.6", "qwen", "qwen27b", "alibaba", "qwen3.6"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["all"],
    category: "Foundation Models",
    definition:
      "Alibaba's advanced 27-billion parameter multilingual foundation model with specialized capabilities in code understanding, mathematical reasoning, and complex table analysis.",
    whyItMatters:
      "Excels at parsing technical manuals, structured CSVs, financial tables, and multilingual knowledge bases.",
    location: "DocPilot Model selector and GaugePilot model grid.",
  },
  {
    id: "model_deepseek_r1_70b",
    title: "DeepSeek R1 70B (Distill Llama)",
    aliases: ["deepseek-r1-distill-llama-70b", "deepseek r1", "deepseek", "r1", "reasoning model", "cot", "chain of thought"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["all"],
    category: "Foundation Models",
    definition:
      "DeepSeek's distilled 70-billion parameter reasoning model with reinforcement-learned deep chain-of-thought (CoT) problem solving capabilities.",
    whyItMatters:
      "Performs deep internal deduction to reconcile contradictory passages, resolve multi-hop logic questions, and verify mathematical computations before synthesizing answers.",
    location: "DocPilot Model selector and GaugePilot benchmark matrix.",
  },
  {
    id: "model_llama_3_3_70b",
    title: "Meta Llama 3.3 70B",
    aliases: ["llama-3.3-70b-versatile", "llama 3.3 70b", "llama", "meta llama", "llama3"],
    pages: ["gaugepilot", "docpilot"],
    modes: ["all"],
    category: "Foundation Models",
    definition:
      "Meta's flagship open-weights instruction-tuned model with 128k context window support and high general benchmark performance.",
    whyItMatters:
      "Industry standard benchmark reference for instruction following, faithfulness, and high-quality factual RAG answers.",
    location: "GaugePilot model comparison and benchmark candidate list.",
  },
  {
    id: "model_mixtral_8x7b",
    title: "Mixtral 8x7B (MoE)",
    aliases: ["mixtral-8x7b-32768", "mixtral", "mistral", "moe", "mixture of experts"],
    pages: ["gaugepilot"],
    modes: ["exp"],
    category: "Foundation Models",
    definition:
      "A sparse Mixture-of-Experts (MoE) architecture activating 13B parameters per token out of 47B total parameters with a 32k context window.",
    whyItMatters:
      "Provides top-tier inference speed with frontier-level quality across broad European languages and code syntax.",
    location: "GaugePilot model options and comparative leaderboards.",
  },
  {
    id: "model_gemini_1_5",
    title: "Google Gemini 1.5 Series",
    aliases: ["gemini", "gemini-1.5-flash", "gemini-1.5-pro", "google gemini"],
    pages: ["gaugepilot"],
    modes: ["exp"],
    category: "Foundation Models",
    definition:
      "Google's multimodal transformer models featuring extended context windows (up to 1M+ tokens) and rapid cross-attention retrieval.",
    whyItMatters:
      "Serves as an external benchmark target for long-context recall and multi-modal document reasoning.",
    location: "GaugePilot evaluation leaderboards and radar profile.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EMBEDDINGS & VECTORS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "emb_mpnet_base_v2",
    title: "all-mpnet-base-v2 (768 Dim)",
    aliases: ["all-mpnet-base-v2", "mpnet", "mpnet base", "sentence transformers", "768"],
    pages: ["docpilot", "gaugepilot", "home"],
    modes: ["all"],
    category: "Embeddings & Vectors",
    definition:
      "A 768-dimensional sentence embedding model pre-trained on over 1 billion sentence pairs using masked and permuted language modeling.",
    whyItMatters:
      "The default balanced general-purpose embedding model for PilotMaster, offering high semantic clustering accuracy across varied domains.",
    location: "DocPilot Embedding dropdown and PilotMaster Home footer.",
  },
  {
    id: "emb_minilm_l6_v2",
    title: "all-MiniLM-L6-v2 (384 Dim)",
    aliases: ["all-MiniLM-L6-v2", "minilm-l6", "minilm 384", "fast embeddings", "384"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Embeddings & Vectors",
    definition:
      "A compact 384-dimensional embedding model optimized for lightning-fast encoding and low memory footprint with 5x throughput over standard models.",
    whyItMatters:
      "Ideal for edge deployments, rapid indexing of large document batches, and low-latency search systems.",
    location: "DocPilot Embedding selector in Experimental Mode.",
  },
  {
    id: "emb_minilm_l12_v2",
    title: "all-MiniLM-L12-v2 (384 Dim)",
    aliases: ["all-MiniLM-L12-v2", "minilm-l12", "minilm 12"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Embeddings & Vectors",
    definition:
      "A 12-layer variant of MiniLM offering higher semantic resolution than L6 while retaining a compact 384-dimensional vector size.",
    whyItMatters:
      "Provides an optimal sweet spot between encoding speed and retrieval precision.",
    location: "DocPilot Embedding selector.",
  },
  {
    id: "emb_bge_large_en",
    title: "BAAI BGE-Large (bge-large-en-v1.5 · 1024 Dim)",
    aliases: ["bge-large-en-v1.5", "bge-large", "bge", "baai", "1024"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Embeddings & Vectors",
    definition:
      "A state-of-the-art 1024-dimensional dense text embedding model developed by the Beijing Academy of Artificial Intelligence (BAAI).",
    whyItMatters:
      "Ranks near the top of the Massive Text Embedding Benchmark (MTEB) for complex semantic search and question-to-passage matching.",
    location: "DocPilot Embedding selector dropdown in Experimental Mode.",
  },
  {
    id: "emb_gte_large",
    title: "Thenlper GTE-Large (1024 Dim)",
    aliases: ["gte-large", "gte", "thenlper", "general text embeddings"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Embeddings & Vectors",
    definition:
      "A 1024-dimensional general text embedding model trained on large-scale multi-domain web corpora for multi-task semantic ranking.",
    whyItMatters:
      "High resilience across noisy documents, technical manuals, and conversational dialogues.",
    location: "DocPilot Embedding dropdown.",
  },
  {
    id: "emb_openai_small",
    title: "OpenAI text-embedding-3-small (1536 Dim)",
    aliases: ["text-embedding-3-small", "openai embedding", "1536", "embedding 3 small"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Embeddings & Vectors",
    definition:
      "OpenAI's efficient 1536-dimensional dense embedding model with native dimensional reduction support.",
    whyItMatters:
      "Standard cloud-hosted embedding baseline for commercial enterprise RAG architectures.",
    location: "DocPilot Embedding dropdown.",
  },
  {
    id: "emb_openai_large",
    title: "OpenAI text-embedding-3-large (3072 Dim)",
    aliases: ["text-embedding-3-large", "embedding 3 large", "3072", "high dimensional embedding"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Embeddings & Vectors",
    definition:
      "OpenAI's flagship 3072-dimensional embedding model delivering maximum semantic nuance and fine-grained classification accuracy.",
    whyItMatters:
      "Distinguishes subtle distinctions in legal, medical, and specialized technical literature.",
    location: "DocPilot Embedding dropdown in Experimental Mode.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. RERANKERS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "reranker_none",
    title: "Identity Reranker (None)",
    aliases: ["none", "identity reranker", "no reranker", "raw retrieval"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["all"],
    category: "Rerankers",
    definition:
      "Bypasses the second-stage neural reranking pass, passing candidate chunks directly in their raw vector/lexical retrieval order to the LLM prompt.",
    whyItMatters:
      "Minimizes pipeline latency when speed is paramount and first-stage vector retrieval confidence is already high.",
    location: "DocPilot Reranker dropdown -> 'None'.",
  },
  {
    id: "reranker_minilm",
    title: "MiniLM Cross-Encoder (ms-marco-MiniLM-L-6-v2)",
    aliases: ["minilm", "cross-encoder", "cross encoder", "ms-marco", "minilm cross encoder"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Rerankers",
    definition:
      "A neural cross-encoder that jointly encodes query and passage tokens across all transformer self-attention layers, computing a direct relevance logit score.",
    whyItMatters:
      "Dramatically outperforms bi-encoder similarity search by capturing deep token-to-token semantic interactions, eliminating false-positive chunk matches.",
    location: "DocPilot Reranker selector and TracePilot chunk diagnostics.",
  },
  {
    id: "reranker_tinybert",
    title: "TinyBERT Reranker",
    aliases: ["tinybert", "tiny bert", "lightweight reranker", "fast reranker"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Rerankers",
    definition:
      "A distilled 4-layer transformer reranker providing neural ranking capabilities with sub-10 millisecond inference overhead.",
    whyItMatters:
      "Enables neural reranking on resource-constrained or latency-critical production paths.",
    location: "DocPilot Reranker dropdown in Experimental Mode.",
  },
  {
    id: "reranker_bge_large",
    title: "BGE Large Reranker (bge-reranker-large)",
    aliases: ["bge-large", "bge reranker", "baai reranker", "high precision reranker"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Rerankers",
    definition:
      "A heavyweight 560M-parameter cross-encoder trained explicitly on question-passage relevance benchmarks.",
    whyItMatters:
      "Achieves state-of-the-art accuracy in ranking the single most relevant chunk to rank #1.",
    location: "DocPilot Reranker dropdown.",
  },
  {
    id: "reranker_bge_m3",
    title: "BGE M3 Multilingual Reranker",
    aliases: ["bge-m3", "bge m3", "multilingual reranker"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Rerankers",
    definition:
      "A cross-lingual neural reranker trained on over 100 languages with support for long input sequences up to 8192 tokens.",
    whyItMatters:
      "Essential for cross-lingual enterprise search where queries in one language match documents in another.",
    location: "DocPilot Reranker dropdown.",
  },
  {
    id: "reranker_flashrank",
    title: "FlashRank Quantized Reranker",
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Rerankers",
    definition:
      "An ultra-fast, CPU-optimized, quantized neural reranker designed for sub-millisecond reranking without GPU dependencies.",
    whyItMatters:
      "Delivers 85-90% of full cross-encoder accuracy with 5-10x speedup and minimal RAM usage.",
    location: "DocPilot Reranker dropdown.",
  },
  {
    id: "reranker_cohere",
    title: "Cohere Rerank API",
    aliases: ["cohere", "cohere rerank", "cohere api"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Rerankers",
    definition:
      "An enterprise cloud-hosted reranking endpoint optimized for business documents, tables, and long-form context reordering.",
    whyItMatters:
      "Provides top-tier commercial reranking accuracy across varied formats.",
    location: "DocPilot Reranker dropdown.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. RETRIEVAL STRATEGIES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "strat_vector_search",
    title: "Dense Vector Search (FAISS)",
    aliases: ["dense", "vector search", "dense vector", "faiss", "semantic search", "cosine similarity"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["all"],
    category: "Retrieval Strategies",
    definition:
      "Mathematical search representing documents and queries as high-dimensional vectors and finding nearest neighbors via inner-product or cosine similarity.",
    whyItMatters:
      "Understands meaning, context, synonyms, and intent even when the user query uses different words than the document.",
    formula: "cosine_sim(q, d) = (q · d) / (||q|| · ||d||)",
    location: "DocPilot Retrieval selector and TracePilot span waterfall.",
  },
  {
    id: "strat_bm25",
    title: "BM25 Keyword Search",
    aliases: ["bm25", "lexical", "keyword search", "sparse retrieval", "inverted index"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Retrieval Strategies",
    definition:
      "A probabilistic lexical ranking function that scores passages based on term frequency (TF), inverse document frequency (IDF), and document length normalization.",
    whyItMatters:
      "Essential for finding exact product names, error codes, part numbers, and verbatim code signatures where dense embeddings may fail.",
    location: "DocPilot Retrieval selector and TracePilot Lexical concordance card.",
  },
  {
    id: "strat_hybrid",
    title: "Hybrid Search (Dense Vector + BM25 + RRF)",
    aliases: ["hybrid", "hybrid search", "ensemble retrieval", "dense + bm25", "rrf"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Retrieval Strategies",
    definition:
      "Simultaneously executes dense semantic vector search and sparse BM25 keyword search, merging the two candidate ranked lists using Reciprocal Rank Fusion (RRF).",
    whyItMatters:
      "The gold standard for RAG retrieval: combines deep semantic intent matching with precision keyword lookups for maximum recall and accuracy.",
    formula: "RRF(d) = Σ [ 1 / (k + rank_i(d)) ]  where k=60",
    location: "DocPilot Retrieval selector in Experimental Mode.",
  },
  {
    id: "strat_contextual_compression",
    title: "Contextual Compression",
    aliases: ["compression", "context compression", "passage extractor", "sentence selector"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Retrieval Strategies",
    definition:
      "Extracts only the query-relevant sentences from retrieved passages, discarding irrelevant surrounding text before prompt injection.",
    whyItMatters:
      "Reduces prompt token costs, minimizes context window bloat, and mitigates the 'lost in the middle' attention degradation in LLMs.",
    location: "DocPilot Experimental pipeline configuration.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. CHUNKING STRATEGIES
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "chunk_parent_child",
    title: "Parent-Child Chunking (1200 / 300)",
    aliases: ["parent-child", "parent child", "hierarchical chunking", "1200 / 300"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["all"],
    category: "Chunking Strategies",
    definition:
      "Splits documents into small 'child' chunks (300 chars) for high-precision vector search, but resolves to their larger 'parent' chunk (1200 chars) when constructing the LLM generation prompt.",
    whyItMatters:
      "Solves the fundamental RAG trade-off: small chunks maximize vector retrieval precision; large parent chunks give the LLM full context without truncation.",
    location: "DocPilot Chunking selector dropdown and ingestion pipeline.",
  },
  {
    id: "chunk_recursive",
    title: "Recursive Character Splitting",
    aliases: ["recursive", "recursive character", "paragraph splitting"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Chunking Strategies",
    definition:
      "Splits documents hierarchically using ordered delimiters (double newlines, single newlines, spaces, characters) to maintain paragraph and sentence integrity.",
    whyItMatters:
      "Standard robust text chunking strategy that prevents split sentences and preserves formatting.",
    location: "DocPilot Chunking dropdown in Experimental Mode.",
  },
  {
    id: "chunk_fixed",
    title: "Fixed Window Chunking (500c / 50c)",
    aliases: ["fixed", "fixed window", "character window", "500c"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Chunking Strategies",
    definition:
      "Splits text into fixed character counts (e.g. 500 characters) with a sliding overlap window (50 characters).",
    whyItMatters:
      "Deterministic and fast, ensuring uniform vector chunk distribution across large text corpora.",
    location: "DocPilot Chunking dropdown.",
  },
  {
    id: "chunk_token",
    title: "Token-Based Chunking (256t)",
    aliases: ["token", "token-based", "token chunking", "256t", "bpe"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Chunking Strategies",
    definition:
      "Splits text strictly along Byte-Pair Encoding (BPE) tokenizer boundaries rather than raw character counts.",
    whyItMatters:
      "Guarantees exact context window budget management and prevents mid-subword token corruption.",
    location: "DocPilot Chunking dropdown.",
  },
  {
    id: "chunk_semantic",
    title: "Semantic Similarity Chunking",
    aliases: ["semantic chunking", "cosine chunking", "topic shift chunking"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Chunking Strategies",
    definition:
      "Computes vector embeddings for consecutive sentences and splits the text dynamically at statistical drops in cosine similarity (topic shifts).",
    whyItMatters:
      "Ensures each chunk represents a single coherent concept or topic.",
    location: "DocPilot Chunking dropdown in Experimental Mode.",
  },
  {
    id: "chunk_contextual",
    title: "Contextual Chunking (Contextual Retrieval)",
    aliases: ["contextual chunking", "contextual retrieval", "situating context", "chunk prefix", "anthropic contextual"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Chunking Strategies",
    definition:
      "Leverages a fast LLM during document ingestion to generate a concise 20–40 word situating context prefix prepended to each chunk (e.g. '[Context: From SEC 10-K report of Acme Corp 2024...]') before computing vector embeddings and BM25 indexes.",
    whyItMatters:
      "Eliminates the 'isolated chunk problem' where extracted passages mention facts or numbers without identifying the overarching company, timeframe, or document topic.",
    location: "DocPilot Chunking selector -> 'Contextual Chunking' and GaugePilot Experiment Setup.",
  },
  {
    id: "chunk_structure_aware",
    title: "Structure-Aware Chunking",
    aliases: ["structure-aware", "structure aware chunking", "markdown chunking", "html chunking", "heading hierarchy", "ast chunking"],
    pages: ["docpilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Chunking Strategies",
    definition:
      "Parses document syntax (Markdown #, ##, ### headers, HTML <h1>-<h6> elements, code fences, and markdown tables) into logical semantic sections, attaching breadcrumb header paths (e.g. '[Architecture > Database Layer > FAISS]') to sub-chunks.",
    whyItMatters:
      "Guarantees that tables, code snippets, and nested section headings are preserved intact without being fractured across arbitrary character or token cutoffs.",
    location: "DocPilot Chunking selector -> 'Structure-Aware' and GaugePilot Experiment Setup.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. 11 QUERY ENHANCEMENTS (LAB / EXP)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "enh_condensation",
    title: "Query Condensation / Contextualization",
    aliases: ["query condensation", "conversational contextualization", "standalone query", "followup rewrite"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Transforms follow-up conversational questions ('What about its pricing?') into fully self-contained standalone search queries ('What is the pricing model of PilotMaster?').",
    whyItMatters:
      "Prevents retrieval failure on follow-up questions where vector search would otherwise lack context from prior conversation turns.",
    location: "DocPilot Enhancements dropdown -> Context Preparation.",
  },
  {
    id: "enh_coreference",
    title: "Coreference Resolution",
    aliases: ["coreference", "coreference resolution", "pronoun resolution", "entity resolver"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Replaces ambiguous pronouns (it, they, that company, former/latter) with explicit named entities extracted from conversation history.",
    whyItMatters:
      "Guarantees vector searches target specific entity names rather than vague pronoun embeddings.",
    location: "DocPilot Enhancements dropdown -> Coreference Resolution.",
  },
  {
    id: "enh_rewrite",
    title: "Query Rewrite",
    aliases: ["query rewrite", "query refactor", "clarification"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Rewrites verbose, informal, or grammatically noisy user prompts into clean, concise, retrieval-optimized search statements.",
    whyItMatters:
      "Improves retrieval recall by removing conversational filler words that dilute vector similarity.",
    location: "DocPilot Enhancements dropdown -> Query Rewrite.",
  },
  {
    id: "enh_subquery",
    title: "Sub-Query Generation",
    aliases: ["subquery", "sub-query generation", "query decomposition", "multi-part query"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Decomposes complex multi-part questions (e.g. 'Compare the battery, price, and warranty of Model A vs B') into independent parallel sub-queries.",
    whyItMatters:
      "Ensures complete recall across all sub-questions rather than retrieving a single compromise vector.",
    location: "DocPilot Enhancements dropdown -> Structuring & Routing.",
  },
  {
    id: "enh_metadata",
    title: "Metadata Filter Extraction",
    aliases: ["metadata filter", "metadata filter extraction", "structured filters", "date extraction"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Extracts structured filters (dates, authors, departments, file types) from natural language to apply hard constraints to vector queries.",
    whyItMatters:
      "Narrows the search space instantly, filtering out irrelevant timeframes and document types before similarity calculation.",
    location: "DocPilot Enhancements dropdown -> Metadata Filter Extraction.",
  },
  {
    id: "enh_routing",
    title: "Query Routing",
    aliases: ["query routing", "index routing", "intent classification"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Classifies user intent and routes queries to specialized vector indices, tables, or domain pipelines.",
    whyItMatters:
      "Directs code queries to code indices and financial queries to numerical tables.",
    location: "DocPilot Enhancements dropdown -> Query Routing.",
  },
  {
    id: "enh_hyde",
    title: "HyDE (Hypothetical Document Embeddings)",
    aliases: ["hyde", "hypothetical document", "synthetic answer embedding"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Uses an LLM to generate a hypothetical ideal answer to the question, then performs vector search using the embedding of that synthetic document.",
    whyItMatters:
      "Bridges the semantic gap between questions and answers: questions look very different from answers in vector space, but a hypothetical answer looks almost identical to true answer chunks.",
    location: "DocPilot Enhancements dropdown -> HyDE.",
  },
  {
    id: "enh_multiquery",
    title: "Multi-Query Expansion",
    aliases: ["multi-query", "multi query expansion", "query variations", "parallel search"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Generates 3 to 5 semantically diverse rephrasings of the user query from different perspectives and executes concurrent retrieval across all variations.",
    whyItMatters:
      "Overcomes the sensitivity of vector similarity to specific word choices, ensuring maximum candidate recall.",
    location: "DocPilot Enhancements dropdown -> Multi-Query Expansion.",
  },
  {
    id: "enh_ragfusion",
    title: "RAG-Fusion",
    aliases: ["rag-fusion", "rag fusion", "rrf multi-query", "fusion retrieval"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Generates multiple query formulations, retrieves candidate documents for each, and applies Reciprocal Rank Fusion (RRF) to merge and re-rank the union of results.",
    whyItMatters:
      "Combines the recall benefits of multi-query expansion with the ranking stability of rank-aggregation algorithms.",
    location: "DocPilot Enhancements dropdown -> RAG-Fusion.",
  },
  {
    id: "enh_stepback",
    title: "Step-Back Prompting",
    aliases: ["step-back", "step back prompting", "conceptual abstraction", "high level query"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Generates a broader, higher-level conceptual query (stepping back from specific details) to retrieve foundational domain principles.",
    whyItMatters:
      "Equips the LLM with the necessary background theories and rules needed to reason through complex questions.",
    location: "DocPilot Enhancements dropdown -> Step-Back Prompting.",
  },
  {
    id: "enh_keyword_exp",
    title: "Query Keyword Expansion",
    aliases: ["keyword expansion", "synonym injection", "domain terminology expansion"],
    pages: ["docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp", "all"],
    category: "Query Enhancements",
    definition:
      "Enriches queries with domain-specific terminology, technical acronyms, and lexical variants prior to BM25 search.",
    whyItMatters:
      "Dramatically increases keyword hit rates without requiring users to know exact technical nomenclature.",
    location: "DocPilot Enhancements dropdown -> Query Keyword Expansion.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. OBSERVABILITY & TELEMETRY (TRACEPILOT)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "obs_trace_id",
    title: "Trace ID & Trace Lifecycle",
    aliases: ["trace id", "trace", "uuid", "execution lifecycle", "trace lifecycle"],
    pages: ["tracepilot"],
    modes: ["all"],
    category: "Observability & Telemetry",
    definition:
      "A globally unique identifier (UUID) assigned to each query execution, connecting all preprocessing, retrieval, reranking, and generation telemetry.",
    whyItMatters:
      "Provides end-to-end auditability and debugging capabilities for any individual query across the platform.",
    location: "TracePilot sidebar item header and main telemetry header.",
  },
  {
    id: "obs_spans",
    title: "Execution Spans (Root & Child)",
    aliases: ["spans", "root span", "child spans", "span hierarchy", "timeline waterfall"],
    pages: ["tracepilot"],
    modes: ["all"],
    category: "Observability & Telemetry",
    definition:
      "Hierarchical execution units measuring precise timestamps, durations, inputs, and outputs for every pipeline sub-stage (Preprocessing, Retrieval, Rerank, Prompt, Generation).",
    whyItMatters:
      "Identifies exact latency bottlenecks, such as slow embedding calls or oversized prompt payloads.",
    location: "TracePilot Timeline & Spans view.",
  },
  {
    id: "obs_dag",
    title: "Execution DAG / Graph View",
    aliases: ["dag", "execution dag", "graph view", "pipeline graph", "visual execution"],
    pages: ["tracepilot"],
    modes: ["exp"],
    category: "Observability & Telemetry",
    definition:
      "A visual Directed Acyclic Graph (DAG) charting the live flow of data between query enhancement branches, parallel retrieval nodes, fusion points, and synthesis stages.",
    whyItMatters:
      "Makes complex branching multi-query and hybrid retrieval pipelines intuitive to understand and debug.",
    location: "TracePilot Experimental Mode 'DAG Graph' tab.",
  },
  {
    id: "obs_replay",
    title: "Replay Execution Engine",
    aliases: ["replay", "replay trace", "re-execute", "determinism test"],
    pages: ["tracepilot"],
    modes: ["all"],
    category: "Observability & Telemetry",
    definition:
      "Re-executes a historical trace with identical parameters, query, and documents, measuring performance variance and verifying determinism.",
    whyItMatters:
      "Crucial for reproducing bugs, validating pipeline improvements, and measuring model consistency.",
    location: "TracePilot 'Replay Trace' button in the trace details view.",
  },
  {
    id: "obs_tokens_cost",
    title: "Token Usage & Cost Telemetry",
    aliases: ["tokens", "token usage", "prompt tokens", "completion tokens", "cost", "usd cost"],
    pages: ["tracepilot", "docpilot"],
    modes: ["all"],
    category: "Observability & Telemetry",
    definition:
      "Precise accounting of Prompt Tokens (input context), Completion Tokens (generated output), Total Tokens, and estimated USD cost based on model pricing.",
    whyItMatters:
      "Enables production cost budgeting, token optimization, and context window efficiency monitoring.",
    location: "TracePilot metrics bar and DocPilot response metadata.",
  },
  {
    id: "obs_consensus",
    title: "Consensus & Agreement Score",
    aliases: ["consensus", "agreement score", "retrieval consensus", "semantic overlap"],
    pages: ["tracepilot"],
    modes: ["exp"],
    category: "Observability & Telemetry",
    definition:
      "Measures the degree of semantic and chunk overlap across multiple retrieval branches (e.g. between Dense and Lexical search, or across Multi-Query formulations).",
    whyItMatters:
      "High consensus indicates strong retrieval confidence, while low consensus warns of ambiguity in the source corpus.",
    location: "TracePilot Experimental Overview and Telemetry Cards.",
  },
  {
    id: "obs_concordance",
    title: "Lexical vs Semantic Concordance",
    aliases: ["concordance", "lexical vs semantic", "bm25 vs dense concordance"],
    pages: ["tracepilot"],
    modes: ["exp"],
    category: "Observability & Telemetry",
    definition:
      "A comparative metric showing whether BM25 keyword search and Dense Vector embeddings agreed on the same top candidate chunks.",
    whyItMatters:
      "Diagnoses whether a query was primarily resolved by keyword matches or conceptual semantic similarity.",
    location: "TracePilot Concordance analysis section.",
  },
  {
    id: "obs_risk_index",
    title: "Hallucination & Risk Index",
    aliases: ["risk index", "hallucination risk", "risk score", "guardrail"],
    pages: ["tracepilot"],
    modes: ["exp"],
    category: "Observability & Telemetry",
    definition:
      "An automated risk score rating the likelihood that generated response claims deviate from the provided source context chunks.",
    whyItMatters:
      "Acts as an automated guardrail flagging high-risk responses before they reach end users in mission-critical applications.",
    location: "TracePilot risk banner and overview telemetry.",
  },
  {
    id: "obs_diagnostics",
    title: "Retrieval Diagnostics & Chunk Lineage",
    aliases: ["lineage", "chunk diagnostics", "dense score", "bm25 score", "rrf score", "reranker score"],
    pages: ["tracepilot"],
    modes: ["all"],
    category: "Observability & Telemetry",
    definition:
      "A multi-stage score progression tracking a chunk's dense similarity score, BM25 lexical score, RRF fusion rank, and final neural reranker rank.",
    whyItMatters:
      "Reveals why a chunk was promoted or demoted at each step of the pipeline.",
    location: "TracePilot retrieved chunk expandable cards.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. BENCHMARKING & EVALUATION (GAUGEPILOT)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "eval_faithfulness",
    title: "Faithfulness (Groundedness Score)",
    aliases: ["faithfulness", "groundedness", "hallucination score", "claim verification"],
    pages: ["gaugepilot", "tracepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "The percentage of claims in the generated answer that can be directly verified from the retrieved context (scored from 0.0 to 1.0 or 0% to 100%).",
    whyItMatters:
      "The golden metric for hallucination prevention: a score of 1.0 means every claim made by the model is strictly backed by source evidence.",
    formula: "Faithfulness = |Verifiable Claims in Answer| / |Total Claims in Answer|",
    location: "GaugePilot Leaderboard column and TracePilot evaluation score.",
  },
  {
    id: "eval_relevance",
    title: "Answer Relevance",
    aliases: ["answer relevance", "relevance", "query responsiveness"],
    pages: ["gaugepilot", "tracepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "Measures how directly, concisely, and completely the generated answer addresses the user query, penalizing redundant filler or off-topic tangents.",
    whyItMatters:
      "Prevents answers that are factually true according to context but fail to answer the user's specific question.",
    location: "GaugePilot Leaderboards and Visualizations radar chart.",
  },
  {
    id: "eval_precision",
    title: "Context Precision",
    aliases: ["context precision", "precision", "signal to noise", "top ranking"],
    pages: ["gaugepilot", "tracepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "Evaluates whether the most relevant candidate chunks are ranked at the top of the context window rather than buried at the bottom.",
    whyItMatters:
      "Essential because LLM attention is strongest at the beginning and end of the prompt ('lost in the middle' effect). High precision ensures key facts are seen first.",
    location: "GaugePilot Leaderboard and evaluation summary.",
  },
  {
    id: "eval_recall",
    title: "Context Recall",
    pages: ["gaugepilot", "tracepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "Measures the proportion of ground-truth reference facts needed to answer a question that were successfully captured in the retrieved chunks.",
    whyItMatters:
      "A pipeline cannot answer questions accurately if the necessary facts were missed during the retrieval phase.",
    formula: "Context_Recall = |Reference Facts in Retrieved Chunks| / |Total Reference Facts in Gold Answer|",
    location: "GaugePilot Leaderboard and evaluation metrics.",
  },
  {
    id: "eval_composite",
    title: "Composite Benchmark Score",
    aliases: ["composite score", "aggregate score", "overall score", "benchmark score"],
    pages: ["gaugepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "A weighted holistic index combining Faithfulness, Relevance, Context Precision, Context Recall, Latency score, and Cost efficiency into a single 0-100 score.",
    whyItMatters:
      "Enables straightforward ranking of competing RAG architectures on an overarching quality-versus-speed index.",
    location: "GaugePilot Leaderboard primary sort column.",
  },
  {
    id: "eval_elo",
    title: "Win Rate & ELO Rating",
    aliases: ["elo", "win rate", "elo rating", "tournament ranking", "head to head"],
    pages: ["gaugepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "A competitive rating system that simulates head-to-head pairwise matches between competing pipeline configurations across all benchmark test cases.",
    whyItMatters:
      "Provides intuitive tournament-style ranking unaffected by scale differences between raw metric scores.",
    location: "GaugePilot Leaderboard 'Win Rate' and 'ELO' columns.",
  },
  {
    id: "eval_pareto",
    title: "Pareto Frontier (Latency vs Quality)",
    aliases: ["pareto", "pareto frontier", "scatter plot", "tradeoff", "latency vs quality"],
    pages: ["gaugepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "The curve connecting optimal pipeline configurations where no other configuration achieves higher accuracy without increasing latency or cost.",
    whyItMatters:
      "Allows engineering teams to select the mathematically optimal architecture for their specific latency SLA (e.g., maximum quality under 800ms).",
    location: "GaugePilot Visualizations -> Scatter Plot & Pareto Frontier.",
  },
  {
    id: "eval_radar",
    title: "Multi-Axis Radar Profile",
    aliases: ["radar chart", "radar profile", "capability polygon", "multi-metric view"],
    pages: ["gaugepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "A polygon visualization plotting a pipeline's performance across all evaluation dimensions simultaneously (Faithfulness, Relevance, Precision, Recall, Speed, Cost).",
    whyItMatters:
      "Instantly exposes strengths and trade-offs (e.g., identifying a pipeline with 99% accuracy but poor latency).",
    location: "GaugePilot Visualizations tab.",
  },
  {
    id: "eval_ai_insights",
    title: "AI Analysis & Autonomous Diagnostics",
    aliases: ["ai analysis", "engineering recommendations", "autonomous diagnosis", "failure analysis"],
    pages: ["gaugepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "Deterministic, AI-generated architectural diagnosis analyzing benchmark failure modes and prescribing specific configuration adjustments (e.g. recommend switching from pure Dense to Hybrid + HyDE).",
    whyItMatters:
      "Automates the interpretation of complex benchmark statistics into clear, actionable engineering next steps.",
    location: "GaugePilot AI Analysis tab and automated diagnosis cards.",
  },
  {
    id: "eval_dataset",
    title: "Golden Evaluation Dataset",
    aliases: ["golden dataset", "benchmark dataset", "ground truth", "eval questions"],
    pages: ["gaugepilot"],
    modes: ["all"],
    category: "Benchmarking & Evaluation",
    definition:
      "A curated collection of test queries paired with verified ground-truth reference contexts and gold-standard answers.",
    whyItMatters:
      "Ensures objective, repeatable, and statistically significant benchmarking across diverse pipeline configurations.",
    location: "GaugePilot Experiment Setup -> Evaluation Benchmark.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. PLATFORM & ARCHITECTURE
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: "arch_pilotmaster",
    title: "PilotMaster Ecosystem",
    aliases: ["pilotmaster", "ecosystem", "platform"],
    pages: ["landing", "home"],
    modes: ["all"],
    category: "Platform & Architecture",
    definition:
      "An end-to-end Observable AI Execution Ecosystem uniting document intelligence (DocPilot), full-stack RAG telemetry & tracing (TracePilot), and automated pipeline benchmarking (GaugePilot).",
    whyItMatters:
      "Provides a unified interface where operational document interaction and rigorous experimental evaluation run against the same underlying deterministic execution pipeline.",
    location: "Global header and workspace switcher.",
  },
  {
    id: "arch_pilotcore",
    title: "PilotCore Shared Execution Framework",
    aliases: ["pilotcore", "kernel", "execution framework", "retrieval kernel"],
    pages: ["landing", "home"],
    modes: ["all"],
    category: "Platform & Architecture",
    definition:
      "The shared Python kernel responsible for orchestrating document ingestion, chunking, embedding generation, vector/lexical retrieval, reranking, prompt construction, LLM streaming, and telemetry dispatch.",
    whyItMatters:
      "Ensures that queries executed during day-to-day chat produce identical deterministic results and telemetry traces as those executed in benchmark evaluation runs.",
    location: "Footer watermark and system architecture reports.",
  },
  {
    id: "arch_prod_mode",
    title: "Production Mode (Standard)",
    aliases: ["production mode", "prod", "standard mode", "fast baseline"],
    pages: ["landing", "home", "docpilot", "tracepilot"],
    modes: ["prod"],
    category: "Platform & Architecture",
    definition:
      "The fast, stable, cost-effective baseline pipeline configured for day-to-day document question answering using standard dense vector retrieval and production LLM inference.",
    whyItMatters:
      "Delivers minimal latency and lower token overhead while maintaining high precision for standard knowledge retrieval tasks.",
    location: "Mode badge pill in header and workspace cards.",
  },
  {
    id: "arch_exp_mode",
    title: "Experimental Mode (Research Lab)",
    aliases: ["experimental mode", "exp", "lab mode", "research mode", "experimentation"],
    pages: ["landing", "home", "docpilot", "tracepilot", "gaugepilot"],
    modes: ["exp"],
    category: "Platform & Architecture",
    definition:
      "An advanced RAG laboratory environment unlocking 11 multi-select query enhancements, dense+sparse hybrid search, multiple neural rerankers, custom chunkers, and deep DAG execution telemetry.",
    whyItMatters:
      "Allows engineers and researchers to inspect, benchmark, and compare cutting-edge retrieval strategies before rolling them into production.",
    location: "Mode toggle button ('🧪 Enter Experimentation Mode') and Lab badge.",
  },
  {
    id: "arch_scope",
    title: "Conversation-Scoped Document Indexing",
    aliases: ["conversation scope", "scope", "document scoping", "session index"],
    pages: ["docpilot"],
    modes: ["all"],
    category: "Platform & Architecture",
    definition:
      "Isolating vector embeddings and search indexes strictly to the documents uploaded or selected for the active chat session.",
    whyItMatters:
      "Prevents knowledge leakage and cross-contamination between unrelated project sessions or different document sets.",
    location: "Top bar 'Scope: [filename]' badge and Document Selector dropdown in DocPilot.",
  },
  {
    id: "arch_tiers",
    title: "Subscription Tiers (Free, Developer, Pro, Enterprise)",
    aliases: ["subscription", "tiers", "billing", "pro plan", "free plan", "token quota"],
    pages: ["home"],
    modes: ["all"],
    category: "Platform & Architecture",
    definition:
      "Access control levels governing monthly token allowances, active document index size limits, benchmark concurrency, and access to premium rerankers/models.",
    whyItMatters:
      "Determines the computational and model capabilities available to your account workspace.",
    location: "Top bar plan badge and Upgrade / Downgrade controls on Home page.",
  },
  {
    id: "arch_jwt",
    title: "Stateless JWT Authentication",
    aliases: ["jwt", "auth", "token", "login", "signup"],
    pages: ["landing", "home"],
    modes: ["all"],
    category: "Platform & Architecture",
    definition:
      "JSON Web Tokens (JWT) signed using cryptographic keys to authenticate client requests securely without maintaining server-side session state.",
    whyItMatters:
      "Enables secure user isolation, document ownership privacy, and seamless multi-tab synchronization.",
    location: "Sign In / Sign Up forms and user profile pill.",
  },
  {
    id: "arch_demo",
    title: "Quick Demo Mode",
    aliases: ["quick demo", "demo", "instant access"],
    pages: ["landing"],
    modes: ["all"],
    category: "Platform & Architecture",
    definition:
      "One-click pre-configured demo account populated with sample knowledge documents and live Groq LLM inference.",
    whyItMatters:
      "Enables immediate zero-setup exploration of the full PilotMaster suite.",
    location: "Landing page header '⚡ Quick Demo' button.",
  },
  {
    id: "mem_working_buffer",
    title: "Conversational Working Memory (Session Buffer)",
    aliases: ["working memory", "session memory", "chat history", "conversation memory", "sliding window buffer"],
    pages: ["docpilot", "tracepilot"],
    modes: ["all"],
    category: "Platform & Architecture",
    definition:
      "A sliding-window buffer retaining recent conversation turns (up to 8 messages) passed directly into Query Condensation, Coreference Resolution, and generation prompts.",
    whyItMatters:
      "Allows users to ask natural follow-up questions (e.g. 'What about its pricing?') without repeating entity names or prior context.",
    location: "DocPilot chat sessions and TracePilot 'Working Memory' telemetry tile.",
  },
  {
    id: "mem_episodic_vector",
    title: "Episodic Long-Term Semantic Vector Memory",
    aliases: ["episodic memory", "vector memory", "long term memory", "user memory index"],
    pages: ["docpilot", "tracepilot"],
    modes: ["exp", "all"],
    category: "Platform & Architecture",
    definition:
      "A dedicated, user-partitioned FAISS semantic memory store that indexes past discussion insights and user preferences across multiple sessions.",
    whyItMatters:
      "Enables long-term personalized recall across distinct projects and sessions without cluttering document vector indexes.",
    location: "PilotCore Vector Memory Engine and TracePilot Episodic Memory banner.",
  },
];

/**
 * Intelligent Multi-Token Search & Strict Context Filter
 */
export function getFilteredTerms({
  page = "all",
  mode = "all",
  query = "",
  category = "All Categories",
  scope = "page", // "page" | "all"
}) {
  const normQuery = query.trim().toLowerCase();
  const isExp = mode === "exp" || mode === true;

  // Split search query into search tokens for multi-keyword matching
  const searchTokens = normQuery.split(/\s+/).filter(Boolean);

  const matchedTerms = [];

  for (const term of GLOSSARY_TERMS) {
    // 1. STRICT Page Match (when scope === 'page')
    if (scope === "page" && page !== "all") {
      if (!term.pages.includes(page)) {
        continue;
      }
    }

    // 2. STRICT Mode Match (when scope === 'page')
    if (scope === "page" && mode !== "all") {
      if (isExp && !term.modes.includes("all") && !term.modes.includes("exp")) {
        continue;
      }
      if (!isExp && !term.modes.includes("all") && !term.modes.includes("prod")) {
        continue;
      }
    }

    // 3. Category Match
    if (category !== "All Categories" && term.category !== category) {
      continue;
    }

    // 4. Multi-Token Relevance Search
    if (searchTokens.length === 0) {
      matchedTerms.push({ term, score: 1 });
      continue;
    }

    const titleLower = term.title.toLowerCase();
    const defLower = term.definition.toLowerCase();
    const whyLower = (term.whyItMatters || "").toLowerCase();
    const catLower = term.category.toLowerCase();
    const formLower = (term.formula || "").toLowerCase();
    const locLower = (term.location || "").toLowerCase();
    const aliases = (term.aliases || []).map((a) => a.toLowerCase());

    let matchCount = 0;
    let score = 0;

    for (const token of searchTokens) {
      let tokenMatched = false;

      if (titleLower.includes(token)) {
        score += titleLower === token ? 50 : 25;
        tokenMatched = true;
      }

      if (aliases.some((a) => a.includes(token))) {
        score += 20;
        tokenMatched = true;
      }

      if (catLower.includes(token)) {
        score += 10;
        tokenMatched = true;
      }

      if (defLower.includes(token)) {
        score += 8;
        tokenMatched = true;
      }

      if (whyLower.includes(token)) {
        score += 5;
        tokenMatched = true;
      }

      if (formLower.includes(token) || locLower.includes(token)) {
        score += 4;
        tokenMatched = true;
      }

      if (tokenMatched) {
        matchCount++;
      }
    }

    // All search tokens must match at least somewhere for strict matching
    if (matchCount === searchTokens.length) {
      matchedTerms.push({ term, score });
    }
  }

  // Sort by search relevance score descending
  matchedTerms.sort((a, b) => b.score - a.score);
  return matchedTerms.map((m) => m.term);
}

/**
 * Get count of terms specifically relevant to a given page and mode.
 */
export function getPageTermsCount(page, mode) {
  return getFilteredTerms({
    page,
    mode,
    query: "",
    category: "All Categories",
    scope: "page",
  }).length;
}

/**
 * Friendly page names map
 */
export const PAGE_NAME_MAP = {
  landing: "Landing & Auth",
  home: "PilotMaster Hub",
  docpilot: "DocPilot Studio",
  tracepilot: "TracePilot Telemetry",
  gaugepilot: "GaugePilot Benchmark Studio",
};
