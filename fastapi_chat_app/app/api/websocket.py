from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from ..services.chat_service import ChatService
from .auth import auth_service

router = APIRouter(tags=["websocket"])
chat_service = ChatService()


@router.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket, document_id: Optional[str] = Query(None), token: Optional[str] = Query(None)):
	"""
	WebSocket聊天接口
	document_id: 可选的文档ID，如果不提供则使用通用聊天模式
	token: 身份验证令牌，必须有效
	"""
	user = auth_service.verify_token(token)
	if not user:
		await websocket.close(code=1008)
		return

	await websocket.accept()
	try:
		while True:
			data = await websocket.receive_json()
			if not isinstance(data, dict) or data.get("type") != "message":
				await websocket.send_json({"type": "error", "message": "invalid payload"})
				continue
			content = data.get("content", "").strip()
			if not content:
				await websocket.send_json({"type": "error", "message": "消息内容不能为空"})
				continue
			# 如果消息中包含document_id，使用它（优先级高于URL参数）
			msg_document_id = data.get("document_id", document_id)
			await websocket.send_json({"type": "start"})
			async for token_part in chat_service.stream_answer(msg_document_id, content):
				await websocket.send_json({"type": "chunk", "content": token_part})
			await websocket.send_json({"type": "end"})
	except WebSocketDisconnect:
		return


