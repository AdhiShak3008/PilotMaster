import os
import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost/tracepilot")


def get_connection():
    conn = psycopg.connect(DATABASE_URL)
    conn.row_factory = dict_row
    return conn


def init_db():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS traces (
        trace_id TEXT PRIMARY KEY,
        query TEXT,
        rewritten_query TEXT,
        retrieved_chunks TEXT,
        prompt TEXT,
        response TEXT,
        latency REAL,
        timestamp TEXT,
        model_name TEXT,
        retrieval_score_avg REAL,
        response_length INTEGER,
        chunk_count INTEGER,
        parent_trace_id TEXT,
        retrieval_quality TEXT,
        grounded BOOLEAN,
        top_retrieval_score REAL,
        spans TEXT,
        failure_types TEXT,
        prompt_mode TEXT DEFAULT 'strict',
        evaluation TEXT,
        user_id TEXT,
        source TEXT,
        evaluator_version TEXT DEFAULT '1.0',
        prompt_version TEXT DEFAULT '1.0',
        retriever_version TEXT DEFAULT 'hybrid_v1'
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ingestion_traces (
        id SERIAL PRIMARY KEY,
        document_id TEXT,
        user_id TEXT,
        filename TEXT,
        chunk_count INTEGER,
        char_count INTEGER,
        latency_ms REAL,
        status TEXT,
        timestamp TEXT
    )
    """)

    conn.commit()
    conn.close()
