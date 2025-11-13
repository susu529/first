from typing import List, Dict, Any, Optional
from .embedding_service import EmbeddingService
from .openai_client import OpenAIClientService
from ..storage.json_storage import JSONStorage
from ..storage.vector_storage import VectorStorage


class ChatService:
	def __init__(self, embedding: Optional[EmbeddingService] = None, client: Optional[OpenAIClientService] = None, json_storage: Optional[JSONStorage] = None, vector_storage: Optional[VectorStorage] = None) -> None:
		self._embed = embedding or EmbeddingService()
		self._client = client or OpenAIClientService()
		self._js = json_storage or JSONStorage()
		self._vs = vector_storage or VectorStorage(self._js)

	def _get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
		data = self._js.read_documents()
		for doc in data.get("documents", []):
			if doc.get("document_id") == document_id:
				return doc
		return None

	def retrieve_context(self, document_id: Optional[str], query: str, k: int = 5) -> List[str]:
		"""检索相关文档片段，如果document_id为None则返回空列表"""
		if not document_id:
			return []
		doc = self._get_document(document_id)
		if not doc:
			return []
		vecs = self._vs.get_document_vectors(document_id)
		if not vecs:
			return []
		chunk_map = {c["chunk_id"]: c["content"] for c in doc.get("chunks", [])}
		chunk_ids = [x["chunk_id"] for x in vecs.get("chunk_vectors", [])]
		vectors = [x["vector"] for x in vecs.get("chunk_vectors", [])]
		chunks = [chunk_map.get(cid, "") for cid in chunk_ids]
		top = self._embed.top_k(query, vectors, chunks, k=k)
		return [t[0] for t in top]

	async def stream_answer(self, document_id: Optional[str], user_message: str):
		"""
		流式生成回答
		document_id: 可选的文档ID，如果为None则使用通用聊天模式
		user_message: 用户消息
		"""
		context_chunks = []
		if document_id:
			# 有文档ID时，使用RAG模式
			context_chunks = self.retrieve_context(document_id, user_message, k=5)
		
		if context_chunks:
			# RAG模式：基于文档片段回答
			system_prompt = "你是一个根据给定文档片段回答问题的助手。仅使用提供的片段进行回答，若无法从片段中得到答案，请如实说明。"
			context_block = "\n\n".join([f"[片段{i+1}]\n{c}" for i, c in enumerate(context_chunks)])
			messages = [
				{"role": "system", "content": system_prompt},
				{"role": "user", "content": f"参考文档片段：\n{context_block}\n\n问题：{user_message}"},
			]
		else:
			# 通用聊天模式：不使用文档
			system_prompt = "你是甜心助手，一个温暖、贴心、友善的AI助手。请用甜美、温和的语气回答用户的问题，提供有帮助的信息。"
			messages = [
				{"role": "system", "content": system_prompt},
				{"role": "user", "content": user_message},
			]
		
		async for token in self._client.stream_chat(messages):
			yield token

	def get_recommendations(self, limit: int = 8) -> List[str]:
		"""返回推荐问题列表"""
		base_recommendations = [
			"请帮我总结一下最近更新的内容。",
			"提取文档中的关键信息。",
			"根据文档生成一个行动清单。",
			"文档中是否有需要注意的风险点？",
			"请将文档内容转换成要点说明。",
		]
		documents = self._js.read_documents().get("documents", [])
		if documents:
			# 按上传时间倒序排序
			sorted_docs = sorted(documents, key=lambda d: d.get("upload_time", ""), reverse=True)
			for doc in sorted_docs[:3]:
				filename = doc.get("filename", "文档")
				base_recommendations.append(f"总结一下《{filename}》的主要内容。")
				base_recommendations.append(f"《{filename}》中有哪些重点？")
		# 去重保持顺序
		seen = set()
		unique = []
		for item in base_recommendations:
			if item not in seen:
				seen.add(item)
				unique.append(item)
		return unique[:limit]


