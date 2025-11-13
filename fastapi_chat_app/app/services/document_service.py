from __future__ import annotations
from typing import List, Dict, Any, Tuple
from ..models.document import Document, DocumentChunk
from ..storage.json_storage import JSONStorage
from ..storage.vector_storage import VectorStorage
from .embedding_service import EmbeddingService
from ..utils.text_processor import split_text_into_chunks
import os


class DocumentService:
	def __init__(self, json_storage: JSONStorage | None = None, vector_storage: VectorStorage | None = None, embedding: EmbeddingService | None = None) -> None:
		self._js = json_storage or JSONStorage()
		self._vs = vector_storage or VectorStorage(self._js)
		self._embedding = embedding or EmbeddingService()

	def list_documents(self) -> List[Dict[str, Any]]:
		data = self._js.read_documents()
		return data.get("documents", [])

	def delete_document(self, document_id: str) -> None:
		data = self._js.read_documents()
		data["documents"] = [d for d in data.get("documents", []) if d.get("document_id") != document_id]
		self._js.write_documents(data)
		self._vs.delete_document_vectors(document_id)

	def _persist_document(self, doc: Document) -> None:
		data = self._js.read_documents()
		data["documents"] = [d for d in data.get("documents", []) if d.get("document_id") != doc.document_id]
		data["documents"].append(doc.model_dump())
		self._js.write_documents(data)

	def process_text(self, filename: str, text: str) -> Tuple[Document, int]:
		chunks_text = split_text_into_chunks(text)
		chunks: List[DocumentChunk] = []
		for idx, c in enumerate(chunks_text):
			chunks.append(DocumentChunk(content=c, chunk_index=idx))
		doc = Document(filename=filename, chunks=chunks, metadata={"total_chunks": len(chunks), "file_size": len(text)})
		self._persist_document(doc)
		vectors = self._embedding.embed_chunks([c.content for c in chunks])
		dim = len(vectors[0]) if vectors else 0
		self._vs.upsert_document_vectors(doc.document_id, [c.chunk_id for c in chunks], vectors, dim)
		return doc, len(chunks)

	def load_text_file(self, filepath: str) -> str:
		with open(filepath, "r", encoding="utf-8") as f:
			return f.read()

	def process_file(self, file_path: str) -> Tuple[Document, int]:
		filename = os.path.basename(file_path)
		content = self.load_text_file(file_path)
		return self.process_text(filename, content)


