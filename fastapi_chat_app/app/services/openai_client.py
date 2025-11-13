from typing import AsyncIterator, List
from openai import OpenAI, AsyncOpenAI
from ..config import load_config


class OpenAIClientService:
	def __init__(self) -> None:
		cfg = load_config()
		self._cfg = cfg
		self._client = OpenAI(api_key=cfg.api_key, base_url=cfg.base_url)
		self._aclient = AsyncOpenAI(api_key=cfg.api_key, base_url=cfg.base_url)

	def embed_texts(self, texts: List[str]) -> List[List[float]]:
		if not texts:
			return []
		resp = self._client.embeddings.create(model=self._cfg.embedding_model, input=texts)
		return [d.embedding for d in resp.data]

	async def stream_chat(self, messages: List[dict]) -> AsyncIterator[str]:
		stream = await self._aclient.chat.completions.create(
			model=self._cfg.llm_model,
			messages=messages,
			stream=True,
		)
		async for event in stream:
			delta = event.choices[0].delta
			if delta and delta.content:
				yield delta.content


