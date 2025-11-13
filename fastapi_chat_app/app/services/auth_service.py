import hashlib
import secrets
import time
from datetime import datetime
from typing import Any, Dict, Optional

from ..storage.json_storage import JSONStorage


class AuthService:
	def __init__(self, storage: Optional[JSONStorage] = None) -> None:
		self._storage = storage or JSONStorage()

	def _hash_password(self, password: str, salt: str) -> str:
		return hashlib.sha256(f"{password}{salt}".encode("utf-8")).hexdigest()

	def _sanitize_user(self, user: Dict[str, Any]) -> Dict[str, Any]:
		return {
			"user_id": user["user_id"],
			"username": user["username"],
			"created_at": user["created_at"],
		}

	def _load_users(self) -> Dict[str, Any]:
		data = self._storage.read_users()
		if "users" not in data:
			data["users"] = []
		return data

	def register_user(self, username: str, password: str) -> Dict[str, Any]:
		username = username.strip()
		if not username or not password:
			raise ValueError("用户名和密码不能为空")
		if len(password) < 6:
			raise ValueError("密码长度至少为6位")

		data = self._load_users()
		for user in data["users"]:
			if user["username"].lower() == username.lower():
				raise ValueError("用户名已存在")

		salt = secrets.token_hex(16)
		password_hash = self._hash_password(password, salt)
		user_id = secrets.token_hex(12)
		now = datetime.utcnow().isoformat()
		new_user = {
			"user_id": user_id,
			"username": username,
			"password_hash": password_hash,
			"salt": salt,
			"tokens": [],
			"created_at": now,
		}
		data["users"].append(new_user)
		self._storage.write_users(data)
		return self._sanitize_user(new_user)

	def authenticate(self, username: str, password: str) -> Dict[str, Any]:
		data = self._load_users()
		target_user: Optional[Dict[str, Any]] = None
		for user in data["users"]:
			if user["username"].lower() == username.strip().lower():
				target_user = user
				break
		if not target_user:
			raise ValueError("用户名或密码错误")

		password_hash = self._hash_password(password, target_user["salt"])
		if password_hash != target_user["password_hash"]:
			raise ValueError("用户名或密码错误")

		token = secrets.token_hex(24)
		token_entry = {
			"token": token,
			"created_at": int(time.time()),
		}
		target_user.setdefault("tokens", [])
		target_user["tokens"].append(token_entry)
		self._storage.write_users(data)
		return {"token": token, "user": self._sanitize_user(target_user)}

	def verify_token(self, token: Optional[str]) -> Optional[Dict[str, Any]]:
		if not token:
			return None
		data = self._load_users()
		for user in data["users"]:
			for entry in user.get("tokens", []):
				if entry.get("token") == token:
					return self._sanitize_user(user)
		return None


