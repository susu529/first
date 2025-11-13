from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from .api.auth import router as auth_router
from .api.documents import router as documents_router
from .api.chat import router as chat_router
from .api.websocket import router as ws_router

app = FastAPI(title="FastAPI Chat App", version="0.1.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置静态文件服务 - 先配置前端页面和静态资源
# 计算前端路径：__file__ 是 app/main.py，所以 parent.parent 是 fastapi_chat_app 目录
frontend_path = Path(__file__).parent.parent / "frontend"
frontend_path = frontend_path.resolve()  # 转换为绝对路径

print(f"[INFO] Frontend path: {frontend_path}")
print(f"[INFO] Frontend exists: {frontend_path.exists()}")

if frontend_path.exists():
    # 先挂载静态资源目录（CSS、JS等）- mount 必须在路由之前
    css_path = frontend_path / "css"
    js_path = frontend_path / "js"
    
    if css_path.exists():
        app.mount("/css", StaticFiles(directory=str(css_path)), name="css")
        print(f"[INFO] Mounted /css from: {css_path}")
    
    if js_path.exists():
        app.mount("/js", StaticFiles(directory=str(js_path)), name="js")
        print(f"[INFO] Mounted /js from: {js_path}")
    
    # 注册页面路由（在API路由之前，确保优先级）
    @app.get("/")
    async def index():
        index_file = frontend_path / "index.html"
        if not index_file.exists():
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="index.html not found")
        return FileResponse(str(index_file), media_type="text/html")
    
    @app.get("/chat.html")
    async def chat():
        chat_file = frontend_path / "chat.html"
        if not chat_file.exists():
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="chat.html not found")
        return FileResponse(str(chat_file), media_type="text/html")
    
    @app.get("/documents.html")
    async def documents():
        docs_file = frontend_path / "documents.html"
        if not docs_file.exists():
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="documents.html not found")
        return FileResponse(str(docs_file), media_type="text/html")
    
    print(f"[INFO] Frontend pages registered successfully")
else:
    print(f"[ERROR] Frontend directory not found at: {frontend_path}")

# 注册API路由（在页面路由之后）
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(ws_router)


