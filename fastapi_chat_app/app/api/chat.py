from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..services.chat_service import ChatService
from .auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])
chat_service = ChatService()


class ChatRequest(BaseModel):
	message: str
	document_id: Optional[str] = None  # 文档ID变为可选


@router.post("/message")
async def chat_message(body: ChatRequest, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
	if not body.message:
		raise HTTPException(status_code=400, detail="消息内容不能为空")
	
	# 如果有文档ID，使用RAG模式；否则使用通用聊天模式
	chunks = []
	if body.document_id:
		chunks = chat_service.retrieve_context(body.document_id, body.message, k=5)
	
	# Do a one-shot (non-stream) completion by accumulating tokens from stream for simplicity.
	response_parts = []
	async for token in chat_service.stream_answer(body.document_id, body.message):
		response_parts.append(token)
	return {
		"response": "".join(response_parts),
		"relevant_chunks": chunks,
	}


@router.get("/recommendations")
async def get_recommendations(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
	return {"recommendations": chat_service.get_recommendations()}


