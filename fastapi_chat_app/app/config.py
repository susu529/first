import os
from pydantic import BaseModel


class AppConfig(BaseModel):
	api_key: str
	base_url: str
	llm_model: str
	embedding_model: str
	data_dir: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data")
	documents_path: str = os.path.join(data_dir, "documents.json")
	vectors_path: str = os.path.join(data_dir, "vectors.json")
	users_path: str = os.path.join(data_dir, "users.json")


def load_config() -> AppConfig:
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key:
		raise RuntimeError("OPENAI_API_KEY 环境变量未设置，无法初始化 OpenAI 客户端。")

	return AppConfig(
		api_key=api_key,
		base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
		llm_model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
		embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
	)


