# 环境变量说明

本文档说明应用所需的环境变量及其配置方法。

## 必需环境变量

### OPENAI_API_KEY

**说明**：OpenAI API 密钥，用于调用聊天和向量化 API。

**示例**：
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**获取方式**：
1. 访问 [OpenAI Platform](https://platform.openai.com)
2. 登录您的账户
3. 进入 API Keys 页面
4. 创建新的 API Key

**安全提示**：
- 永远不要将 API Key 提交到 Git 仓库
- 在 Koyeb 中使用环境变量配置，不要硬编码在代码中
- 定期轮换 API Key

## 可选环境变量

### OPENAI_BASE_URL

**说明**：OpenAI API 的基础 URL。如果使用 OpenAI 官方 API，无需设置。如果使用兼容 OpenAI API 的第三方服务，需要设置此变量。

**默认值**：`https://api.openai.com/v1`

**示例**：
```bash
OPENAI_BASE_URL=https://api.openai.com/v1
# 或使用第三方服务
OPENAI_BASE_URL=https://api.example.com/v1
```

### LLM_MODEL

**说明**：用于聊天的语言模型名称。

**默认值**：`gpt-4o-mini`

**示例**：
```bash
LLM_MODEL=gpt-4o-mini
# 或其他模型
LLM_MODEL=gpt-4
LLM_MODEL=gpt-3.5-turbo
```

**可用模型**：
- `gpt-4o-mini` - 推荐，性价比高
- `gpt-4o` - 更强大但更昂贵
- `gpt-4` - 标准 GPT-4
- `gpt-3.5-turbo` - 更经济的选择

### EMBEDDING_MODEL

**说明**：用于文档向量化的嵌入模型名称。

**默认值**：`text-embedding-3-small`

**示例**：
```bash
EMBEDDING_MODEL=text-embedding-3-small
# 或其他模型
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_MODEL=text-embedding-ada-002
```

### PORT

**说明**：应用监听的端口号。在 Koyeb 上，此变量会自动设置，通常为 8080。

**默认值**：`8000`（本地开发）

**示例**：
```bash
PORT=8080
```

**注意**：在 Koyeb 上通常不需要手动设置，平台会自动配置。

### RELOAD

**说明**：是否启用代码热重载。生产环境应设为 `false`。

**默认值**：`false`

**示例**：
```bash
# 生产环境（推荐）
RELOAD=false

# 开发环境（仅本地使用）
RELOAD=true
```

## 在 Koyeb 中配置环境变量

1. 登录 [Koyeb 控制台](https://app.koyeb.com)
2. 选择您的服务
3. 进入 **"Settings"** > **"Environment Variables"**
4. 点击 **"Add Variable"**
5. 输入变量名和值
6. 点击 **"Save"**
7. 服务会自动重启以应用新配置

## 本地开发配置

### Windows PowerShell

```powershell
$env:OPENAI_API_KEY="your-api-key-here"
$env:LLM_MODEL="gpt-4o-mini"
python fastapi_chat_app/run.py
```

### Windows CMD

```cmd
set OPENAI_API_KEY=your-api-key-here
set LLM_MODEL=gpt-4o-mini
python fastapi_chat_app/run.py
```

### Linux/macOS

```bash
export OPENAI_API_KEY="your-api-key-here"
export LLM_MODEL="gpt-4o-mini"
python fastapi_chat_app/run.py
```

### 使用 .env 文件（推荐）

创建 `fastapi_chat_app/.env` 文件：

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
PORT=8000
RELOAD=true
```

然后使用 `python-dotenv` 加载（需要在代码中添加支持，或使用工具如 `dotenv-cli`）。

## 验证环境变量

应用启动时会检查必需的环境变量。如果 `OPENAI_API_KEY` 未设置，应用会抛出错误并退出。

您可以通过以下方式验证：

1. 查看应用启动日志
2. 访问 `/docs` 端点，如果 API 文档正常显示，说明配置正确
3. 尝试发送一条聊天消息，如果成功，说明所有配置正确

## 安全最佳实践

1. **永远不要提交敏感信息到 Git**
   - 使用 `.gitignore` 排除 `.env` 文件
   - 在代码审查时检查是否包含敏感信息

2. **使用环境变量而非硬编码**
   - 所有敏感配置都应通过环境变量传递
   - 在代码中使用 `os.getenv()` 读取

3. **定期轮换密钥**
   - 定期更换 API Key
   - 在 Koyeb 中更新环境变量后，服务会自动重启

4. **限制访问权限**
   - 只给需要的人访问 Koyeb 控制台的权限
   - 使用最小权限原则

5. **监控 API 使用**
   - 定期检查 OpenAI 使用情况
   - 设置使用量告警

## 故障排除

### 问题：应用启动失败，提示 "OPENAI_API_KEY 环境变量未设置"

**解决方案**：
1. 检查环境变量是否已设置
2. 在 Koyeb 中确认变量名拼写正确（区分大小写）
3. 确认变量值没有多余的空格或引号
4. 重启服务

### 问题：API 调用失败

**解决方案**：
1. 验证 API Key 是否有效
2. 检查 API Key 是否有足够的配额
3. 确认 `OPENAI_BASE_URL` 配置正确
4. 查看应用日志获取详细错误信息

### 问题：模型不存在错误

**解决方案**：
1. 确认模型名称拼写正确
2. 检查您的 API Key 是否有权限使用该模型
3. 尝试使用默认模型名称

---

更多信息请参考：
- [Koyeb 部署指南](KOYEB_DEPLOY.md)
- [部署检查清单](DEPLOY_CHECKLIST.md)
- [项目 README](../README.md)

