from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel

from ..services.auth_service import AuthService


router = APIRouter(prefix="/api/auth", tags=["auth"])
auth_service = AuthService()


class RegisterRequest(BaseModel):
	username: str
	password: str


class LoginRequest(BaseModel):
	username: str
	password: str


class TokenResponse(BaseModel):
	token: str
	username: str


def get_current_user(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
	if not authorization or not authorization.lower().startswith("bearer "):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未授权访问")
	token = authorization.split(" ", 1)[1].strip()
	user = auth_service.verify_token(token)
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已过期，请重新登录")
	return {"token": token, **user}


@router.post("/register")
async def register(body: RegisterRequest) -> Dict[str, Any]:
	try:
		user = auth_service.register_user(body.username, body.password)
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
	return {"user": user, "message": "注册成功"}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> Dict[str, str]:
	try:
		result = auth_service.authenticate(body.username, body.password)
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
	return {"token": result["token"], "username": result["user"]["username"]}


@router.get("/me")
async def me(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
	user = current_user.copy()
	user.pop("token", None)
	return {"user": user}

