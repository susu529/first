import json
import os
from typing import Any, Dict
from ..config import load_config


class JSONStorage:
	def __init__(self) -> None:
		self._cfg = load_config()
		os.makedirs(self._cfg.data_dir, exist_ok=True)
		if not os.path.exists(self._cfg.documents_path):
			self._write_file(self._cfg.documents_path, {"documents": []})
		if not os.path.exists(self._cfg.vectors_path):
			self._write_file(self._cfg.vectors_path, {"vectors": []})
		if not os.path.exists(self._cfg.users_path):
			self._write_file(self._cfg.users_path, {"users": []})

	def _read_file(self, path: str) -> Dict[str, Any]:
		with open(path, "r", encoding="utf-8") as f:
			return json.load(f)

	def _write_file(self, path: str, data: Dict[str, Any]) -> None:
		tmp_path = path + ".tmp"
		with open(tmp_path, "w", encoding="utf-8") as f:
			json.dump(data, f, ensure_ascii=False, indent=2)
		os.replace(tmp_path, path)

	def read_documents(self) -> Dict[str, Any]:
		return self._read_file(self._cfg.documents_path)

	def write_documents(self, data: Dict[str, Any]) -> None:
		self._write_file(self._cfg.documents_path, data)

	def read_vectors(self) -> Dict[str, Any]:
		return self._read_file(self._cfg.vectors_path)

	def write_vectors(self, data: Dict[str, Any]) -> None:
		self._write_file(self._cfg.vectors_path, data)

	def read_users(self) -> Dict[str, Any]:
		return self._read_file(self._cfg.users_path)

	def write_users(self, data: Dict[str, Any]) -> None:
		self._write_file(self._cfg.users_path, data)


