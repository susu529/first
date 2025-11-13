from typing import List, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class ChatMessage(BaseModel):
	role: Literal["user", "assistant", "system"]
	content: str
	timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


class ChatSession(BaseModel):
	session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
	document_id: str
	messages: List[ChatMessage] = Field(default_factory=list)
	created_time: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")


