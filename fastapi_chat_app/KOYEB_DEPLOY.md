# Koyeb 部署指南

本指南将帮助您将 FastAPI Chat 应用部署到 Koyeb 平台。

## 前置要求

1. **GitHub 账户**：项目代码需要托管在 GitHub 上
2. **Koyeb 账户**：注册 [Koyeb](https://www.koyeb.com) 账户（免费计划可用）
3. **OpenAI API Key**：用于聊天和向量化功能

## 部署步骤

### 方法一：使用 Docker 部署（推荐）

Koyeb 支持直接从 GitHub 仓库使用 Dockerfile 自动构建和部署。

#### 1. 准备 GitHub 仓库

确保项目已推送到 GitHub：

```bash
git init
git add .
git commit -m "Initial commit: FastAPI Chat App for Koyeb"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

#### 2. 在 Koyeb 上创建服务

1. 登录 [Koyeb 控制台](https://app.koyeb.com)
2. 点击 **"Create Web Service"** 或 **"Create App"**
3. 选择 **"GitHub"** 作为部署源
4. 授权 Koyeb 访问您的 GitHub 账户（如需要）
5. 选择包含此项目的仓库和分支（通常是 `main`）

#### 3. 配置构建设置

项目提供了两个 Dockerfile：

- **根目录 `Dockerfile`**（推荐）：Koyeb 会自动检测并使用
- **`fastapi_chat_app/Dockerfile`**：子目录版本，如需使用需在 Koyeb 中指定路径

在构建配置中：

- **Buildpack/Dockerfile**：选择 **"Dockerfile"**
- Koyeb 会自动检测根目录的 Dockerfile，无需额外配置

> **注意**：如果使用根目录的 Dockerfile，它会自动处理 `fastapi_chat_app` 子目录的代码复制。

#### 4. 配置环境变量

在 **"Environment Variables"** 部分添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `OPENAI_API_KEY` | 您的 OpenAI API Key | **必填** |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | 可选，默认值 |
| `LLM_MODEL` | `gpt-4o-mini` | 可选，聊天模型 |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | 可选，向量模型 |
| `PORT` | `8080` | 可选，Koyeb 会自动设置 |
| `RELOAD` | `false` | 可选，生产环境应设为 false |

#### 5. 配置资源

- **Instance Type**：选择适合的实例类型（Nano 适合测试，Production 适合生产）
- **Region**：选择离您用户最近的区域

#### 6. 部署

点击 **"Deploy"** 按钮，Koyeb 将：

1. 从 GitHub 拉取代码
2. 使用 Dockerfile 构建 Docker 镜像
3. 部署容器并启动服务
4. 分配一个 `.koyeb.app` 域名

### 方法二：使用 Buildpack 部署

如果不想使用 Docker，Koyeb 也支持使用 Python Buildpack。

#### 1. 在项目根目录创建 `Procfile`

```procfile
web: cd fastapi_chat_app && python run.py
```

或者如果 Dockerfile 在根目录：

```procfile
web: python run.py
```

#### 2. 在 Koyeb 上创建服务

1. 选择 GitHub 仓库
2. 在 **"Build options"** 中选择 **"Buildpack"**
3. **Run command**：`cd fastapi_chat_app && python run.py` 或 `python run.py`
4. 配置环境变量（同方法一）
5. 点击 **"Deploy"**

## 部署后配置

### 1. 更新前端 API 地址

部署成功后，Koyeb 会提供一个类似 `https://your-app-name-xxxxx.koyeb.app` 的域名。

您需要更新前端配置：

1. 在 Koyeb 控制台的 **"Environment Variables"** 中添加：
   - `FRONTEND_API_URL` = `https://your-app-name-xxxxx.koyeb.app`

2. 或者手动修改 `frontend/js/runtime-config.js`：

```javascript
window.__API_BASE_URL__ = "https://your-app-name-xxxxx.koyeb.app";
window.__WS_BASE_URL__ = "wss://your-app-name-xxxxx.koyeb.app";
```

### 2. 配置自定义域名（可选）

1. 在 Koyeb 控制台进入您的服务
2. 点击 **"Domains"** 标签
3. 添加您的自定义域名
4. 按照提示配置 DNS 记录

### 3. 启用 HTTPS

Koyeb 自动为所有服务提供 HTTPS，无需额外配置。

## 验证部署

部署完成后，访问以下 URL 验证：

- **API 文档**：`https://your-app-name-xxxxx.koyeb.app/docs`
- **首页**：`https://your-app-name-xxxxx.koyeb.app/`
- **聊天页面**：`https://your-app-name-xxxxx.koyeb.app/chat.html`
- **文档管理**：`https://your-app-name-xxxxx.koyeb.app/documents.html`

## 常见问题

### 1. 构建失败

**问题**：Docker 构建失败

**解决方案**：
- 检查 Dockerfile 路径是否正确
- 确认 `requirements.txt` 存在且格式正确
- 查看 Koyeb 构建日志中的错误信息

### 2. 应用无法启动

**问题**：部署成功但应用无法访问

**解决方案**：
- 检查环境变量是否全部设置（特别是 `OPENAI_API_KEY`）
- 查看应用日志：在 Koyeb 控制台点击 **"Logs"** 标签
- 确认 `PORT` 环境变量正确（Koyeb 会自动设置，通常为 8080）

### 3. 静态文件无法加载

**问题**：前端页面可以访问但 CSS/JS 无法加载

**解决方案**：
- 检查 `frontend` 目录是否包含在 Docker 镜像中
- 查看应用日志确认静态文件路径
- 确认 `app/main.py` 中的前端路径配置正确

### 4. WebSocket 连接失败

**问题**：聊天功能无法使用 WebSocket

**解决方案**：
- 确认前端 `runtime-config.js` 中的 WebSocket URL 使用 `wss://`（HTTPS）
- 检查 Koyeb 是否支持 WebSocket（Koyeb 默认支持）

## 数据持久化

**重要提示**：当前版本使用本地 JSON 文件存储数据，在容器重启后数据会丢失。

如需数据持久化，建议：

1. **使用 Koyeb Volumes**（如果支持）
2. **集成外部数据库**（PostgreSQL、MongoDB 等）
3. **使用对象存储**（AWS S3、Cloudflare R2 等）

## 监控和日志

- **实时日志**：在 Koyeb 控制台的 **"Logs"** 标签查看
- **指标监控**：Koyeb 提供 CPU、内存等基础指标
- **告警**：可在 Koyeb 控制台配置告警规则

## 更新部署

当您推送新代码到 GitHub 时：

1. **自动部署**：如果启用了自动部署，Koyeb 会自动检测并重新部署
2. **手动部署**：在 Koyeb 控制台点击 **"Redeploy"** 按钮

## 成本估算

Koyeb 免费计划包括：
- 2 个服务
- 512 MB RAM
- 共享 CPU
- 每月 50 GB 流量

对于小型应用，免费计划通常足够使用。如需更多资源，可升级到付费计划。

## 相关资源

- [Koyeb 官方文档](https://www.koyeb.com/docs)
- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [项目 README](../README.md)

## 支持

如遇到问题，请：

1. 查看 Koyeb 构建和运行日志
2. 检查环境变量配置
3. 参考 [项目 README](../README.md) 中的本地运行说明
4. 在 GitHub Issues 中提交问题

