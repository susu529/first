# 前端使用说明

## 项目结构

```
frontend/
├── index.html          # 首页
├── chat.html          # 聊天页面
├── documents.html     # 文档管理页面
├── css/
│   └── style.css     # 样式文件
└── js/
    ├── api.js        # API调用封装
    ├── utils.js      # 工具函数
    ├── chat.js       # 聊天页面逻辑
    └── documents.js  # 文档管理页面逻辑
```

## 访问方式

### 方式一：通过FastAPI服务访问（推荐）

启动后端服务后，直接访问：
- 首页：http://localhost:8000/
- 聊天页面：http://localhost:8000/chat.html
- 文档管理：http://localhost:8000/documents.html

### 方式二：直接打开HTML文件

如果直接打开HTML文件，需要确保后端API运行在 `http://localhost:8000`。

## 功能说明

### 聊天页面

1. **文档选择**：在输入栏上方选择要使用的文档
2. **发送消息**：
   - 点击发送按钮或按 Enter 键发送
   - Shift + Enter 换行
3. **WebSocket模式**：点击"WebSocket"按钮切换到实时流式响应
4. **REST模式**：默认使用REST API，响应包含相关片段信息

### 文档管理页面

1. **上传文档**：
   - 点击上传区域选择文件
   - 或直接拖拽文件到上传区域
   - 仅支持 .txt 格式
2. **文档列表**：查看所有已上传的文档及其信息
3. **开始聊天**：点击"开始聊天"按钮跳转到聊天页面并自动选择该文档
4. **删除文档**：点击"删除"按钮删除不需要的文档

## 设计特点

- **甜美风格**：采用柔粉色系，营造温暖、陪伴感
- **响应式设计**：支持桌面端和移动端
- **流畅动画**：消息出现、按钮交互等都有平滑动画效果
- **实时反馈**：WebSocket连接状态、上传进度等实时显示

## 技术栈

- 原生 JavaScript (ES6 模块)
- CSS3 (自定义属性、动画)
- Font Awesome 4.7 图标库
- Fetch API 和 WebSocket API

## 浏览器兼容性

- Chrome/Edge (推荐)
- Firefox
- Safari
- 需要支持 ES6 模块和 WebSocket

