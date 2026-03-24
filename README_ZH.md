# DeepDrone-Bridge - AI 驱动的桥梁结构健康检测系统

![DeepDrone Demo](media/demo.png?v=2)

**DeepDrone-Bridge** 是 [DeepDrone](https://github.com/LeaderOnePro/deepdrone) 的桥梁结构健康检测专用分支。在核心无人机控制系统的基础上，扩展了 LLM 驱动的损伤感知巡检规划、实时损伤检测和自适应航点重规划功能——全部通过自然语言与 12 大 AI 提供商进行交互。

> 基于 JTG/T H21-2011 桥梁检测标准。

---

**🌐 语言版本 | Language Versions**

[![English](https://img.shields.io/badge/English-README-blue?style=for-the-badge)](README.md) [![中文](https://img.shields.io/badge/中文-README-red?style=for-the-badge)](README_ZH.md)

---

## 与 DeepDrone 的区别

DeepDrone-Bridge 在 DeepDrone 基础平台之上新增了 `bridge/` 桥梁检测专用模块：

| 模块 | 描述 |
|------|------|
| `bridge/bridge_knowledge.py` | 桥梁领域知识库，中英双语术语，5 级损伤严重性分类 |
| `bridge/damage_detector.py` | 损伤检测接口（Mock / 本地 YOLO / 远程 API） |
| `bridge/adaptive_planner.py` | LLM 驱动的损伤感知航点重规划，支持自适应巡检 |
| `bridge/inspection_logger.py` | 巡检会话日志，结构化报告生成（JSON 和 Markdown） |

**桥梁专用 API 端点**（`web_api.py`）：
- `POST /api/bridge/mode` — 开关桥梁检测模式
- `POST /api/bridge/inspection/start` — 启动巡检会话，生成初始航点
- `POST /api/bridge/damage/report` — 上报损伤并触发自适应重规划
- `POST /api/bridge/inspection/end` — 结束巡检并生成报告

---

## 快速开始

### 终端界面
```bash
# 1. 安装依赖
uv sync

# 2. 启动交互式设置
uv run main.py
```

### Web 界面
```bash
# 一键启动 Web 界面
uv run start_web.py
# 访问：http://localhost:8000
```

应用程序将引导您完成：
- **AI 提供商选择**：从 12 个提供商中选择最新模型
- **模型选择**：选择前沿 AI 模型（支持网络 Ollama）
- **无人机连接**：连接到模拟器或真实无人机
- **桥梁检测模式**：启用桥梁专用损伤检测和自适应规划
- **自然语言控制**："检测主梁"、"上报 2 号桥墩裂缝"

## 命令示例

```
DeepDrone-Bridge> 连接模拟器并起飞到 20 米
DeepDrone-Bridge> 启用桥梁检测模式
DeepDrone-Bridge> 开始桥面板常规巡检
DeepDrone-Bridge> 上报 3 号桥墩检测到裂缝，严重等级 3
DeepDrone-Bridge> 生成巡检报告并降落
```

## 支持的 AI 提供商

| 提供商 | 模型 | API 类型 | 描述 |
|--------|------|----------|------|
| **OpenAI** | GPT-5.4, GPT-5.4-mini, GPT-5.4-nano | 云端 | 最新 GPT-5.4 系列模型 |
| **Anthropic** | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 | 云端 | 先进的 Claude 4.6 模型 |
| **Google** | Gemini 3.1 Pro Preview, Gemini 3 Flash Preview, Gemini 3.1 Flash Lite Preview | 云端 | 来自 Google AI Studio 的 Gemini 3.1 系列模型 |
| **Qwen** | Qwen3.5 Plus, Qwen3.5 Flash, Qwen3.5 397B, Qwen3.5 122B, Qwen3.5 27B | 云端 | DashScope 提供的 OpenAI 兼容接口 |
| **xAI** | Grok 4.1 Fast Reasoning, Grok 4.1 Fast Non-Reasoning, Grok 4 | 云端 | xAI Grok 模型 |
| **智谱AI** | GLM-5-Turbo, GLM-5, GLM-4.7, GLM-4.7-Flash | 云端 | 中文 AI 模型，JWT 认证 |
| **MiniMax** | MiniMax-M2.7, MiniMax-M2.7-highspeed | 云端 | MiniMax-M2.7 模型 |
| **DeepSeek** | DeepSeek Chat, DeepSeek Reasoner | 云端 | 高级推理模型 |
| **月之暗面（Kimi）** | Kimi K2.5, Kimi K2 Thinking Turbo, Kimi K2 Turbo, Kimi K2 Thinking | 云端 | 月之暗面 Kimi 模型，支持思维链 |
| **美团 LongCat** | LongCat Flash Thinking, LongCat Flash Chat, LongCat Flash Omni 2603, LongCat Flash Lite | 云端 | OpenAI 兼容的 LongCat Flash 系列模型 |
| **Meta** | Llama 4 Maverick, Llama 3.3 Turbo | 云端 | 通过提供商的最新 Llama 模型 |
| **Ollama** | NanBeige4.1, Qwen3.5:4B, Qwen3.5:Latest, GLM-4.7-Flash | 本地/网络 | 本地和远程服务器支持 |

## 系统要求

- Python 3.9+
- [uv](https://docs.astral.sh/uv/)（包管理器）
- DroneKit-Python
- LiteLLM（云端模型）
- Ollama（本地/网络模型，可选）

## 技术栈

- **uv** - 快速 Python 包管理和项目工具
- **LiteLLM** - 云端 AI 模型统一接口（OpenAI、Anthropic、Google、xAI 等）
- **直接 API 集成** - 原生支持智谱AI、Qwen（DashScope）、MiniMax、DeepSeek、月之暗面 Kimi
- **Ollama** - 本地/网络 AI 模型执行，支持自定义服务器
- **DroneKit-Python** - 真实无人机控制和遥测
- **Rich** - 美观的终端界面和格式化
- **Typer** - 命令行界面框架
- **Pydantic** - 配置管理和验证

## 桥梁检测架构

```
bridge/
  bridge_knowledge.py    # 领域知识库 & 系统提示词
  damage_detector.py     # 检测后端（Mock/YOLO/API）
  adaptive_planner.py    # LLM 驱动的航点重规划
  inspection_logger.py   # 会话日志 & 报告生成
```

**巡检工作流：**
1. 通过 API 或对话启用桥梁检测模式
2. 启动巡检会话 — 生成桥梁各构件的常规巡检航点
3. 无人机按航点飞行，损伤检测器并行运行
4. 检测到损伤时，自适应规划器生成补充航点进行详细检查
5. 结束会话，生成结构化巡检报告（兼容 JTG/T H21-2011 标准）

## Web 界面

DeepDrone-Bridge 包含现代化的 Web 界面，支持基于浏览器的无人机控制，采用简洁响应式设计。

### Web 快速启动

```bash
# 方式 1：一键启动（推荐）
uv run start_web.py

# 方式 2：手动启动
uv run web_api.py
# 然后访问：http://localhost:8000
```

### Web 技术栈

- **后端**：FastAPI + Uvicorn，RESTful API
- **前端**：React 18 + 自定义 CSS 设计系统
- **实时通信**：WebSocket 支持实时更新
- **响应式**：移动端优先设计，支持触摸操作

## 网络功能

- **Ollama 网络支持**：连接到局域网或互联网上的 Ollama 服务器
- **自定义服务器 URL**：配置远程 Ollama 实例
- **自动模型检测**：自动检测任何服务器上的可用模型
- **灵活部署**：在本地或强大的远程服务器上运行模型

## 部署

### 开发环境
```bash
# 终端界面
uv run main.py

# Web 界面热重载
cd frontend
npm start  # 前端（端口 3000）
# 在另一个终端中：
uv run uvicorn web_api:app --reload  # 后端（端口 8000）
```

### 生产环境
```bash
# 构建前端
cd frontend
npm run build

# 启动生产服务器
uv run start_web.py
```

## 贡献

欢迎贡献！请随时提交问题和拉取请求。

---

**DeepDrone-Bridge v3.0** | 基于 [DeepDrone](https://github.com/LeaderOnePro/deepdrone)
