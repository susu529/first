from typing import List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class DocumentChunk(BaseModel):
	chunk_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
	content: str
	chunk_index: int


class Document(BaseModel):
	document_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
	filename: str
	upload_time: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
	chunks: List[DocumentChunk]
	metadata: Dict[str, Any] = Field(default_factory=dict)


