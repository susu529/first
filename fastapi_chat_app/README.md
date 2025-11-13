## FastAPI Chat App

### 本地运行

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r fastapi_chat_app/requirements.txt
python fastapi_chat_app/run.py
```

访问 `/docs` 查看交互式文档。

### 部署概览

- 后端（FastAPI）：推荐部署到 Heroku，参见仓库根目录的 `Procfile`、`runtime.txt` 以及 `requirements.txt`。
- 前端（静态站点）：推荐部署到 Vercel，使用 `frontend` 目录下的静态资源和 `vercel.json` 配置。

更多部署细节请参考仓库根目录的说明或根据当前项目部署指南执行。

