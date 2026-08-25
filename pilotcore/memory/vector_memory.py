import os
import json
import time
import faiss
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
from pilotcore.config import VECTOR_STORE_DIR
from pilotcore.retrieval.embeddings import get_embedding


class VectorMemoryManager:
    """
    Long-Term Episodic Semantic Vector Memory Manager.
    
    Maintains a dedicated FAISS vector index per user to store and retrieve
    cross-session user preferences, previous discussion insights, and key facts.
    """

    @staticmethod
    def _get_user_memory_dir(user_id: Any) -> Path:
        uid_str = str(user_id) if user_id is not None else "default_user"
        dir_path = Path(VECTOR_STORE_DIR) / f"memory_{uid_str}"
        dir_path.mkdir(parents=True, exist_ok=True)
        return dir_path

    @classmethod
    def add_memory(
        cls,
        user_id: Any,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Store a new semantic memory item for the user.
        """
        if not text or not text.strip():
            return False

        user_dir = cls._get_user_memory_dir(user_id)
        index_path = user_dir / "memory.index"
        meta_path = user_dir / "memory.meta.json"

        try:
            # 1. Compute embedding for memory text
            vector = get_embedding(text)
            if vector is None:
                return False
            vector = np.array([vector], dtype="float32")
            faiss.normalize_L2(vector)

            # 2. Load or create FAISS index
            dim = vector.shape[1]
            if index_path.exists():
                index = faiss.read_index(str(index_path))
            else:
                index = faiss.IndexFlatIP(dim)

            # 3. Load or initialize metadata list
            if meta_path.exists():
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta_list = json.load(f)
            else:
                meta_list = []

            # 4. Append to index and metadata
            index.add(vector)
            meta_item = {
                "id": len(meta_list) + 1,
                "text": text.strip(),
                "created_at": time.time(),
                "metadata": metadata or {},
            }
            meta_list.append(meta_item)

            # 5. Persist back to disk
            faiss.write_index(index, str(index_path))
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(meta_list, f, indent=2)

            return True
        except Exception as e:
            print(f"[VectorMemoryManager] Error adding memory for user {user_id}: {e}")
            return False

    @classmethod
    def search_memory(
        cls,
        user_id: Any,
        query: str,
        top_k: int = 3,
        similarity_threshold: float = 0.35,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant semantic memories for a user query.
        """
        if not query or not query.strip() or user_id is None:
            return []

        user_dir = cls._get_user_memory_dir(user_id)
        index_path = user_dir / "memory.index"
        meta_path = user_dir / "memory.meta.json"

        if not index_path.exists() or not meta_path.exists():
            return []

        try:
            # 1. Embed search query
            q_vec = get_embedding(query)
            if q_vec is None:
                return []
            q_vec = np.array([q_vec], dtype="float32")
            faiss.normalize_L2(q_vec)

            # 2. Load index & metadata
            index = faiss.read_index(str(index_path))
            if index.ntotal == 0:
                return []

            with open(meta_path, "r", encoding="utf-8") as f:
                meta_list = json.load(f)

            # 3. Execute top_k similarity search
            k = min(top_k, index.ntotal)
            scores, indices = index.search(q_vec, k)

            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx != -1 and idx < len(meta_list) and score >= similarity_threshold:
                    item = dict(meta_list[idx])
                    item["similarity_score"] = float(score)
                    results.append(item)

            return results
        except Exception as e:
            print(f"[VectorMemoryManager] Error searching memory for user {user_id}: {e}")
            return []

    @classmethod
    def get_all_memories(cls, user_id: Any) -> List[Dict[str, Any]]:
        """
        Retrieve all stored memories for a user.
        """
        user_dir = cls._get_user_memory_dir(user_id)
        meta_path = user_dir / "memory.meta.json"
        if not meta_path.exists():
            return []
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @classmethod
    def clear_memory(cls, user_id: Any) -> bool:
        """
        Clear all stored memory for a user.
        """
        user_dir = cls._get_user_memory_dir(user_id)
        index_path = user_dir / "memory.index"
        meta_path = user_dir / "memory.meta.json"
        try:
            if index_path.exists():
                os.remove(index_path)
            if meta_path.exists():
                os.remove(meta_path)
            return True
        except Exception:
            return False
