from typing import Any, Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..services.document_service import DocumentService
from .auth import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])
doc_service = DocumentService()


@router.post("/upload")
async def upload_document(
	file: UploadFile = File(...),
	current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
	if not file.filename.lower().endswith(".txt"):
		raise HTTPException(status_code=400, detail="只支持txt文件")
	content = (await file.read()).decode("utf-8", errors="ignore")
	doc, chunks_count = doc_service.process_text(file.filename, content)
	return {
		"document_id": doc.document_id,
		"filename": doc.filename,
		"chunks_count": chunks_count,
		"status": "processed",
	}


@router.get("/")
async def list_documents(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
	docs = doc_service.list_documents()
	return {
		"documents": [
			{
				"document_id": d["document_id"],
				"filename": d["filename"],
				"upload_time": d["upload_time"],
				"chunks_count": d.get("metadata", {}).get("total_chunks", 0),
			}
			for d in docs
		]
	}


@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
	doc_service.delete_document(document_id)
	return {"status": "deleted"}


