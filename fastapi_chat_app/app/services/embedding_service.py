from typing import List, Tuple
import numpy as np
from .openai_client import OpenAIClientService


class EmbeddingService:
	def __init__(self, client: OpenAIClientService | None = None) -> None:
		self._client = client or OpenAIClientService()

	def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
		return self._client.embed_texts(chunks)

	@staticmethod
	def cosine_similarities(query_vector: List[float], matrix: List[List[float]]) -> List[float]:
		if not matrix:
			return []
		a = np.array(query_vector, dtype=np.float32)
		b = np.array(matrix, dtype=np.float32)
		a_norm = a / (np.linalg.norm(a) + 1e-8)
		b_norm = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-8)
		scores = b_norm @ a_norm
		return scores.tolist()

	def top_k(self, query: str, vectors: List[List[float]], chunks: List[str], k: int = 5) -> List[Tuple[str, float]]:
		qv = self.embed_chunks([query])[0] if query else [0.0] * (len(vectors[0]) if vectors else 0)
		scores = self.cosine_similarities(qv, vectors)
		idxs = np.argsort(scores)[::-1][:k]
		return [(chunks[i], float(scores[i])) for i in idxs]


