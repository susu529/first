# 根目录 Dockerfile - 用于 Koyeb 部署
# 此文件将构建 fastapi_chat_app 目录中的应用

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件（从 fastapi_chat_app 目录）
COPY fastapi_chat_app/requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码（从 fastapi_chat_app 目录）
COPY fastapi_chat_app/ .

# 创建数据目录（如果不存在）
RUN mkdir -p /app/data

# 暴露端口（Koyeb 会自动设置 PORT 环境变量）
EXPOSE 8080

# 使用 uvicorn 运行应用
# Koyeb 会设置 PORT 环境变量，默认使用 8080
CMD ["python", "run.py"]

