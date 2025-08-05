# 🌐 DeepDrone Web Interface

现代化的 Web 界面，让您通过浏览器控制无人机！

## 🎯 功能特性

### 🖥️ **现代化界面**
- 响应式设计，支持桌面和移动设备
- 深色主题，专业的控制台外观
- Material-UI 组件，流畅的用户体验

### 🤖 **AI 集成**
- 支持多种 AI 提供商（OpenAI、Anthropic、ZhipuAI、Ollama 等）
- 实时聊天界面，自然语言控制
- 智能指令解析和执行

### 🚁 **无人机控制**
- 实时状态监控（电池、位置、高度）
- 快速指令按钮
- 安全操作提示

### 📊 **仪表盘**
- 系统状态总览
- 实时数据可视化
- 快速访问常用功能

## 🚀 快速开始

### 方法 1: 一键启动（推荐）
```bash
python start_web.py
```

### 方法 2: 手动启动

#### 1. 安装后端依赖
```bash
pip install -r requirements.txt
```

#### 2. 构建前端（首次运行）
```bash
cd frontend
npm install
npm run build
cd ..
```

#### 3. 启动服务器
```bash
python web_api.py
```

#### 4. 访问界面
打开浏览器访问：http://localhost:8000

## 📱 界面导航

### 🏠 **仪表盘页面** (`/dashboard`)
- 系统状态总览
- AI 模型和无人机连接状态
- 快速操作按钮
- 系统信息展示

### 🎮 **控制页面** (`/control`)
- AI 聊天界面
- 自然语言指令输入
- 快速指令按钮
- 实时状态监控

### ⚙️ **设置页面** (`/settings`)
- AI 模型配置
- 无人机连接设置
- 高级参数调整

## 🔧 配置说明

### AI 模型配置
1. 选择 AI 提供商（OpenAI、Anthropic、ZhipuAI、Ollama）
2. 选择具体模型
3. 输入 API 密钥（Ollama 无需密钥）
4. 测试连接
5. 保存配置

### 无人机连接
- **模拟器**: `udp:127.0.0.1:14550`
- **USB 连接**: `/dev/ttyACM0` (Linux) 或 `COM3` (Windows)
- **TCP 连接**: `tcp:192.168.1.100:5760`
- **UDP 连接**: `udp:192.168.1.100:14550`

## 🎯 使用示例

### 基本操作
1. 访问设置页面配置 AI 模型
2. 配置无人机连接
3. 进入控制页面
4. 输入自然语言指令：
   - "起飞到30米高度"
   - "飞行正方形路线"
   - "返回起飞点并降落"
   - "显示当前状态"

### 快速指令
- 点击快速指令按钮执行常用操作
- 支持起飞、降落、模式切换等
- 紧急停止功能

## 🛠️ 技术架构

### 后端 (FastAPI)
- **框架**: FastAPI + Uvicorn
- **API**: RESTful API + WebSocket
- **集成**: 直接集成现有 DeepDrone 核心
- **实时通信**: WebSocket 支持

### 前端 (React)
- **框架**: React 18 + Material-UI
- **路由**: React Router
- **状态管理**: React Hooks
- **HTTP 客户端**: Axios
- **实时通信**: Socket.IO Client

### 文件结构
```
├── web_api.py              # FastAPI 后端服务器
├── start_web.py            # 一键启动脚本
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   └── utils/          # 工具函数
│   ├── public/             # 静态资源
│   └── package.json        # 前端依赖
└── requirements.txt        # 后端依赖（已更新）
```

## 🔒 安全考虑

- API 密钥安全存储
- CORS 配置
- 输入验证和清理
- 错误处理和日志记录

## 🐛 故障排除

### 常见问题

**1. 前端构建失败**
```bash
# 确保 Node.js 和 npm 已安装
node --version
npm --version

# 清理并重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**2. 后端启动失败**
```bash
# 检查依赖
pip install -r requirements.txt

# 检查端口占用
netstat -an | grep 8000
```

**3. AI 模型连接失败**
- 检查 API 密钥是否正确
- 确认网络连接正常
- 查看浏览器控制台错误信息

**4. 无人机连接失败**
- 确认连接字符串格式正确
- 检查模拟器是否运行
- 验证串口权限（Linux/Mac）

## 🚀 部署建议

### 开发环境
- 使用 `python start_web.py` 快速启动
- 前端热重载：`cd frontend && npm start`
- 后端热重载：`uvicorn web_api:app --reload`

### 生产环境
- 使用 Nginx 反向代理
- 配置 HTTPS
- 设置环境变量
- 使用 Docker 容器化部署

## 📈 未来计划

- [ ] 3D 可视化界面
- [ ] 飞行路径规划
- [ ] 多无人机支持
- [ ] 移动端 App
- [ ] 云端部署支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受您的 DeepDrone Web 体验！** 🚁✨