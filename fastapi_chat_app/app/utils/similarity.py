from typing import List
import numpy as np


def cosine_similarity_matrix(vectors: List[List[float]]) -> List[List[float]]:
	if not vectors:
		return []
	a = np.array(vectors, dtype=np.float32)
	norms = np.linalg.norm(a, axis=1, keepdims=True) + 1e-8
	normed = a / norms
	sim = normed @ normed.T
	return sim.tolist()


