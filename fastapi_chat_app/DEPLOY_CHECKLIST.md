# Koyeb 部署检查清单

在部署到 Koyeb 之前，请确认以下项目：

## 代码准备

- [ ] 项目已推送到 GitHub 仓库
- [ ] 所有代码更改已提交
- [ ] 敏感信息（API Key、密码等）已从代码中移除
- [ ] `.gitignore` 已正确配置，排除临时文件和敏感数据

## 配置文件

- [ ] `Dockerfile` 存在于项目根目录或 `fastapi_chat_app` 目录
- [ ] `requirements.txt` 包含所有必需的依赖
- [ ] `.dockerignore` 已配置（可选但推荐）

## 环境变量准备

准备以下环境变量的值：

- [ ] `OPENAI_API_KEY` - 您的 OpenAI API 密钥（**必填**）
- [ ] `OPENAI_BASE_URL` - API 基础 URL（可选，默认：`https://api.openai.com/v1`）
- [ ] `LLM_MODEL` - 聊天模型（可选，默认：`gpt-4o-mini`）
- [ ] `EMBEDDING_MODEL` - 向量模型（可选，默认：`text-embedding-3-small`）

## Koyeb 账户

- [ ] 已注册 Koyeb 账户
- [ ] 已登录 Koyeb 控制台
- [ ] （可选）已连接 GitHub 账户

## 部署步骤

- [ ] 在 Koyeb 创建新服务
- [ ] 选择 GitHub 仓库和分支
- [ ] 配置 Dockerfile 构建方式
- [ ] 设置所有必需的环境变量
- [ ] 选择适当的实例类型和区域
- [ ] 点击部署并等待构建完成

## 部署后验证

- [ ] 检查构建日志，确认无错误
- [ ] 访问 `https://your-app-name-xxxxx.koyeb.app/docs` 验证 API 文档
- [ ] 访问首页验证前端页面加载
- [ ] 测试登录功能
- [ ] 测试聊天功能
- [ ] 测试文档上传功能
- [ ] 检查应用日志，确认无运行时错误

## 前端配置（如需要）

- [ ] 更新 `frontend/js/runtime-config.js` 中的 API 地址（如果前后端分离）
- [ ] 或通过环境变量配置前端 API 地址

## 安全检查

- [ ] 确认生产环境 CORS 配置（如需要，限制允许的域名）
- [ ] 确认敏感数据不会写入日志
- [ ] 确认 HTTPS 已启用（Koyeb 自动提供）

## 监控和备份

- [ ] 了解如何查看 Koyeb 应用日志
- [ ] 了解如何查看应用指标（CPU、内存等）
- [ ] （可选）配置告警规则
- [ ] 考虑数据备份策略（当前使用本地 JSON 文件，容器重启会丢失数据）

## 后续优化

- [ ] 考虑集成数据库以持久化数据
- [ ] 考虑添加健康检查端点
- [ ] 考虑配置自定义域名
- [ ] 考虑设置自动部署规则

---

完成所有检查项后，您的应用应该可以成功部署到 Koyeb！

如有问题，请参考 [Koyeb 部署指南](KOYEB_DEPLOY.md) 或查看 Koyeb 官方文档。

