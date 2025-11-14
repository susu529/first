# FastAPI Chat 应用

这是一个基于 FastAPI 的全栈示例项目，后端提供聊天、文档检索与鉴权 API，前端为纯静态页面，可部署到任意静态托管平台。项目目前运行在本地文件存储模式下，便于快速演示和二次开发。

## 功能亮点

- 聊天服务：通过 OpenAI API 调用指定模型，支持流式回复。
- 文档管理：上传文档后切分、向量化并存储在本地 JSON/向量文件中，支持相似度检索。
- 用户鉴权：简单的 token 登录流程，默认使用本地 JSON 文件作为用户库。
- 前后端解耦：FastAPI 提供 REST/WebSocket 接口，`frontend` 目录负责渲染页面与调用接口。

## 技术栈

- 后端：FastAPI、Pydantic、Uvicorn、OpenAI SDK、NumPy
- 前端：原生 HTML/CSS/JavaScript
- 存储：JSON 文件（用户、文档、向量数据）

## 目录结构

```
fastapi_chat_app/
├─ app/                 # FastAPI 应用与业务逻辑
├─ data/                # 默认的数据与向量存储
├─ frontend/            # 静态前端资源
├─ requirements.txt     # Python 依赖
└─ run.py               # 启动入口（`uvicorn` 包装）
data/                   # 根目录下的样例数据（可移入 fastapi_chat_app/data）
chat_app.py             # 额外演示脚本（如无需求可忽略）
```

> 根据需要，可考虑把根目录下的 `data/` 合并或替换为 `fastapi_chat_app/data/`，保持单一数据源。

## 本地运行

```powershell
# 1.（可选）创建虚拟环境
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. 安装依赖
pip install -r fastapi_chat_app/requirements.txt

# 3. 设置环境变量
$env:OPENAI_API_KEY="你的 OpenAI API Key"
# 如需自定义：$env:OPENAI_BASE_URL、$env:LLM_MODEL、$env:EMBEDDING_MODEL

# 4. 启动服务
python fastapi_chat_app/run.py
```

运行后访问：

- API 文档：<http://localhost:8000/docs>
- 首页：<http://localhost:8000/>
- 聊天：<http://localhost:8000/chat.html>
- 文档管理：<http://localhost:8000/documents.html>

## 前端运行时配置

`fastapi_chat_app/frontend/js/runtime-config.example.js` 提供了默认示例。

1. 本地开发：保持示例值即可（指向 `localhost:8000`）。
2. 线上部署：复制为 `runtime-config.js` 并写入实际的后端地址，或在部署时通过脚本覆盖该文件。

## 环境变量

- `OPENAI_API_KEY`（必填）：OpenAI API 密钥。
- `OPENAI_BASE_URL`（可选）：自定义 API Base URL，默认 `https://api.openai.com/v1`。
- `LLM_MODEL`（可选）：聊天模型，默认 `gpt-4o-mini`。
- `EMBEDDING_MODEL`（可选）：向量模型，默认 `text-embedding-3-small`。

## 数据文件说明

- 默认数据位于 `fastapi_chat_app/data/`，存储文档向量与用户信息。
- `data/users.json` 内含演示账号（哈希密码 + token），在公开仓库前请替换或清空实际敏感信息。
- 如需自定义存储路径，可修改或扩展 `app/config.py` 中的配置。

## 部署建议

### Koyeb 部署（推荐）

项目已包含完整的 Koyeb 部署配置，包括 Dockerfile 和详细部署指南。

**快速开始**：
1. 查看 [Koyeb 部署指南](fastapi_chat_app/KOYEB_DEPLOY.md) 获取详细步骤
2. 将项目推送到 GitHub
3. 在 Koyeb 控制台创建服务并连接 GitHub 仓库
4. 配置环境变量（特别是 `OPENAI_API_KEY`）
5. 部署完成！

**优势**：
- 自动 HTTPS
- 自动部署（GitHub 推送触发）
- 免费计划可用
- 支持 Docker 和 Buildpack

### 其他部署选项

- **后端**：可部署到 Render、Railway、Fly.io 或自建服务器。确保提供静态文件与 WebSocket 支持。
- **前端**：`frontend/` 可直接上传到 Vercel、Netlify 等平台。
- 若前后端分离部署，请更新 `runtime-config.js` 指向后端域名，并正确配置 CORS。

## 推送到 GitHub 的建议步骤

1. 初始化仓库并配置远程：
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: FastAPI Chat App"
   git branch -M main
   git remote add origin https://github.com/<your-account>/<repository>.git
   git push -u origin main
   ```
2. 在推送前再次确认：`OPENAI_API_KEY` 等敏感信息未写入代码或提交历史。
3. 如需分享示例配置，可在 README 或 `.env.example` 中使用占位符。
4. 建议开启 GitHub Actions（如 Ruff、pytest）或其他 CI 检查，提高质量保障。

## 下一步改进想法

- 引入数据库（PostgreSQL、SQLite 等）替代 JSON 文件，实现多用户并发。
- 加入单元测试与端到端测试，覆盖关键业务流程。
- 集成前端构建工具或 UI 框架，优化交互体验。
- ~~提供 Dockerfile 与部署脚本，降低新环境搭建成本。~~ ✅ 已完成

欢迎根据业务需求自由扩展！

