"""
BrandProof Sentence Embeddings Service.

Uses sentence-transformers (all-MiniLM-L6-v2) to generate 384-dimensional vector embeddings
on CPU for facts, rules, and extracted claims.
Includes a tokenized word-hashing fallback for offline / test environments before
heavy model weights are downloaded.
"""

import math
import re
from typing import List, Optional
from app.config import get_settings

settings = get_settings()

_model = None


def get_embedding_model():
    """Lazy-load the sentence-transformers model instance on CPU."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer(settings.embedding_model, device="cpu")
        except ImportError:
            # Token-hashing 384-dimensional fallback when sentence-transformers is not yet installed
            class _FallbackModel:
                def _embed_single(self, text: str) -> List[float]:
                    words = re.findall(r"\b\w+\b", text.lower())
                    vec = [0.0] * 384
                    for w in words:
                        h = abs(hash(w))
                        vec[h % 384] += 1.0
                        vec[(h * 31) % 384] += 0.5
                    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
                    return [x / norm for x in vec]

                def encode(self, texts, **kwargs):
                    if isinstance(texts, str):
                        return self._embed_single(texts)
                    return [self._embed_single(t) for t in texts]

            _model = _FallbackModel()

    return _model


def embed_text(text: str) -> List[float]:
    """Generate a 384-dimensional float embedding for a single text string."""
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    if hasattr(embedding, "tolist"):
        return embedding.tolist()
    return list(embedding)


def embed_batch(texts: List[str]) -> List[List[float]]:
    """Generate 384-dimensional embeddings for a batch of text strings."""
    if not texts:
        return []
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    if hasattr(embeddings, "tolist"):
        return embeddings.tolist()
    return [list(e) for e in embeddings]
