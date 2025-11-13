from typing import Dict, Any, List
from .json_storage import JSONStorage


class VectorStorage:
	def __init__(self, json_storage: JSONStorage | None = None) -> None:
		self._js = json_storage or JSONStorage()

	def upsert_document_vectors(self, document_id: str, chunk_ids: List[str], vectors: List[List[float]], dimension: int) -> None:
		data = self._js.read_vectors()
		data["vectors"] = [v for v in data.get("vectors", []) if v.get("document_id") != document_id]
		data["vectors"].append(
			{
				"document_id": document_id,
				"chunk_vectors": [
					{"chunk_id": cid, "vector": vec, "dimension": dimension} for cid, vec in zip(chunk_ids, vectors)
				],
			}
		)
		self._js.write_vectors(data)

	def get_document_vectors(self, document_id: str) -> Dict[str, Any] | None:
		data = self._js.read_vectors()
		for item in data.get("vectors", []):
			if item.get("document_id") == document_id:
				return item
		return None

	def delete_document_vectors(self, document_id: str) -> None:
		data = self._js.read_vectors()
		data["vectors"] = [v for v in data.get("vectors", []) if v.get("document_id") != document_id]
		self._js.write_vectors(data)


