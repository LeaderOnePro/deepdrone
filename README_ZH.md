# 🚁 DeepDrone - AI 驱动的无人机控制终端

![DeepDrone Demo](media/demo.png)

**使用自然语言控制无人机，支持来自 10 大主流提供商的最新 AI 模型：OpenAI GPT-5、Anthropic Claude-4、Google Gemini-2.5、Meta Llama-4、xAI Grok、智谱 AI、通义千问、DeepSeek、Kimi，以及本地/网络 Ollama 模型。**

---

**🌐 语言版本 | Language Versions**

[![English](https://img.shields.io/badge/English-README-blue?style=for-the-badge)](README.md) [![中文](https://img.shields.io/badge/中文-README-red?style=for-the-badge)](README_ZH.md)

---

## 🚀 快速开始

### 终端界面
```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动交互式设置
python main.py
```

### Web 界面
```bash
# 一键启动 Web 界面
python start_web.py
# 访问：http://localhost:8000
```

应用程序将引导您完成：
- **AI 提供商选择**：从 10 个提供商中选择最新模型
- **模型选择**：选择前沿 AI 模型（支持网络 Ollama）
- **无人机连接**：连接到模拟器或真实无人机
- **自然语言控制**："起飞到30米"，"飞行正方形路线"

## ✨ 功能特性

- 🤖 **全面的 AI 支持**：10 大主流提供商的最新模型（GPT-5、Claude-4、Gemini-2.5、Llama-4、Grok 等）
- 🌐 **双重界面**：终端 CLI 和现代化 Web 界面
- 🌐 **网络灵活性**：支持本地、局域网和互联网 Ollama 服务器
- 🚁 **真实无人机控制**：DroneKit 集成，支持实际飞行控制
- 💬 **自然语言**：使用对话式命令控制无人机
- 🛠️ **内置模拟器**：包含无人机模拟器用于测试
- 🔒 **安全操作**：紧急停止和返航功能
- 📱 **移动端就绪**：响应式 Web 界面，支持触摸操作

## 🌐 Web 界面

DeepDrone 包含现代化的 Web 界面，支持基于浏览器的无人机控制，采用简洁响应式设计。

### 🎯 Web 功能

- **🖥️ 现代化 UI**：响应式设计，采用自定义 CSS 设计系统（无 Material-UI 依赖）
- **🤖 AI 集成**：实时聊天界面，支持自然语言控制
- **🚁 无人机控制**：实时状态监控和快捷命令按钮
- **📊 仪表盘**：系统概览和实时数据可视化
- **📱 移动端支持**：触摸友好界面，底部导航

### 🚀 Web 快速启动

```bash
# 方式 1：一键启动（推荐）
python start_web.py

# 方式 2：手动启动
python web_api.py
# 然后访问：http://localhost:8000
```



### 🛠️ Web 技术栈

- **后端**：FastAPI + Uvicorn，RESTful API
- **前端**：React 18 + 自定义 CSS 设计系统
- **实时通信**：WebSocket 支持实时更新
- **响应式**：移动端优先设计，支持触摸操作

## 🛠️ 模拟器设置

```bash
# 快速模拟器（内置）
python simulate_drone.py

# 高级 SITL（可选）
# 请参考 ArduPilot SITL 安装指南
```

## 📝 命令示例

```
🚁 DeepDrone> 连接模拟器并起飞到20米
🚁 DeepDrone> 飞行到 GPS 坐标 37.7749, -122.4194
🚁 DeepDrone> 执行边长50米的正方形飞行路线
🚁 DeepDrone> 返航并安全降落
```

## 🤖 支持的 AI 提供商

| 提供商 | 模型 | API 类型 | 描述 |
|--------|------|----------|------|
| **OpenAI** | GPT-5, GPT-5-mini, GPT-5-nano 等 | 云端 | 最新 GPT-5 系列模型 |
| **Anthropic** | Claude-Opus-4.1, Claude-Sonnet-4 等 | 云端 | 先进的 Claude-4 模型 |
| **Google** | Gemini-2.5-Pro, Gemini-2.5-Flash 等 | 云端 | Google AI Studio 集成 |
| **Meta** | Llama-4-Maverick, Llama-3.3-Turbo 等 | 云端 | 通过提供商的最新 Llama 模型 |
| **xAI** | Grok-4, Grok-3, Grok-3-mini 等 | 云端 | 马斯克的 xAI 模型 |
| **智谱AI** | GLM-4.5, GLM-4.5-Air 等 | 云端 | 中文 AI 模型，JWT 认证 |
| **通义千问** | Qwen3-235B, Qwen3-Coder 等 | 云端 | 阿里巴巴最新 Qwen3 模型 |
| **DeepSeek** | DeepSeek-Chat, DeepSeek-Reasoner 等 | 云端 | 高级推理模型 |
| **Kimi** | Kimi-K2-Turbo, Kimi-K2-Preview 等 | 云端 | 月之暗面 AI 模型 |
| **Ollama** | Qwen3:4B, GPT-OSS, Qwen3:30B 等 | 本地/网络 | 本地和远程服务器支持 |

## 🔧 系统要求

- Python 3.8+
- DroneKit-Python
- LiteLLM（云端模型）
- Ollama（本地/网络模型，可选）

## 💻 技术栈

- **LiteLLM** - 云端 AI 模型统一接口（OpenAI、Anthropic、Google、xAI 等）
- **直接 API 集成** - 原生支持智谱AI、通义千问、DeepSeek、Kimi
- **Ollama** - 本地/网络 AI 模型执行，支持自定义服务器
- **DroneKit-Python** - 真实无人机控制和遥测
- **Rich** - 美观的终端界面和格式化
- **Typer** - 命令行界面框架
- **Pydantic** - 配置管理和验证

## 🌐 网络功能

- **Ollama 网络支持**：连接到局域网或互联网上的 Ollama 服务器
- **自定义服务器 URL**：配置远程 Ollama 实例
- **自动模型检测**：自动检测任何服务器上的可用模型
- **灵活部署**：在本地或强大的远程服务器上运行模型

## 🔧 Web 界面配置

### 连接示例
- **模拟器**：`udp:127.0.0.1:14550`
- **USB 连接**：`/dev/ttyACM0`（Linux）或 `COM3`（Windows）
- **TCP 连接**：`tcp:192.168.1.100:5760`
- **UDP 连接**：`udp:192.168.1.100:14550`

### AI 模型设置
1. 在 Web 界面中导航到设置页面
2. 从下拉菜单选择 AI 提供商
3. 选择模型（Ollama 模型自动检测）
4. 输入 API 密钥（Ollama 不需要）
5. 测试连接并保存

## 🐛 故障排除

### Web 界面问题

**前端问题：**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**后端问题：**
```bash
pip install -r requirements.txt
# 检查端口 8000 是否可用
```

**AI 模型连接失败：**
- 验证 API 密钥是否正确
- 检查网络连接
- 查看浏览器控制台错误信息

**无人机连接失败：**
- 确认连接字符串格式正确
- 确保模拟器正在运行
- 检查串口权限（Linux/Mac）

### 常见问题

**Ollama 连接失败：**
- 验证 Ollama 服务器正在运行
- 检查基础 URL 配置
- 确保模型已安装：`ollama pull 模型名称`

**模拟器无响应：**
- 重启模拟器：`python simulate_drone.py`
- 检查连接字符串是否匹配模拟器端口
- 验证没有其他进程占用端口

## 🚀 部署

### 开发环境
```bash
# 终端界面
python main.py

# Web 界面热重载
cd frontend
npm start  # 前端（端口 3000）
# 在另一个终端中：
uvicorn web_api:app --reload  # 后端（端口 8000）
```

### 生产环境
```bash
# 构建前端
cd frontend
npm run build

# 启动生产服务器
python start_web.py
```



## 🤝 贡献

欢迎贡献！请随时提交问题和拉取请求。

---

**享受您的 DeepDrone 体验！** 🚁✨