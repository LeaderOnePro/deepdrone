# DeepDrone-Bridge - AI-Powered Bridge Structural Health Inspection

![DeepDrone Demo](media/demo.png?v=2)

**DeepDrone-Bridge** is a specialized fork of [DeepDrone](https://github.com/LeaderOnePro/deepdrone) for **bridge structural health inspection**. It extends the core drone control system with LLM-driven damage-aware inspection planning, real-time damage detection, and adaptive waypoint replanning — all guided by natural language through 12 major AI providers.

> Based on JTG/T H21-2011 bridge inspection standards.

---

## What's Different from DeepDrone?

DeepDrone-Bridge adds a dedicated `bridge/` module on top of the base DeepDrone platform:

| Module | Description |
|--------|-------------|
| `bridge/bridge_knowledge.py` | Bridge domain knowledge base with bilingual terminology and 5-level damage severity taxonomy |
| `bridge/damage_detector.py` | Damage detection interface (Mock / local YOLO / remote API) |
| `bridge/adaptive_planner.py` | LLM-driven damage-aware waypoint replanning for adaptive inspections |
| `bridge/inspection_logger.py` | Inspection session logging, structured report generation (JSON & Markdown) |

**Bridge-specific API endpoints** in `web_api.py`:
- `POST /api/bridge/mode` — Toggle bridge inspection mode
- `POST /api/bridge/inspection/start` — Start inspection session with initial waypoints
- `POST /api/bridge/damage/report` — Report damage and trigger adaptive replanning
- `POST /api/bridge/inspection/end` — End session and generate reports

---

## Quick Start

### Terminal Interface
```bash
# 1. Install dependencies
uv sync

# 2. Start interactive setup
uv run main.py
```

### Web Interface
```bash
# One-click web start
uv run start_web.py
# Visit: http://localhost:8000
```

The app will guide you through:
- **AI Provider Selection**: Choose from 12 providers with latest models
- **Model Selection**: Pick from cutting-edge AI models (network Ollama supported)
- **Drone Connection**: Connect to simulator or real drone
- **Bridge Inspection Mode**: Enable bridge-specific damage detection and adaptive planning
- **Natural Language Control**: "Inspect the main girder", "Report crack on pier #2"

## Example Commands

```
DeepDrone-Bridge> Connect to simulator and take off to 20 meters
DeepDrone-Bridge> Enable bridge inspection mode
DeepDrone-Bridge> Start routine inspection of the deck slab
DeepDrone-Bridge> Report crack detected on pier #3, severity level 3
DeepDrone-Bridge> Generate inspection report and land
```

## Supported AI Providers

| Provider | Models | API Type | Description |
|----------|--------|----------|-------------|
| **OpenAI** | GPT-5.4, GPT-5.4-mini, GPT-5.4-nano | Cloud | Latest GPT-5.4 series models |
| **Anthropic** | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 | Cloud | Advanced Claude 4.6 models |
| **Google** | Gemini 3.1 Pro Preview, Gemini 3 Flash Preview, Gemini 3.1 Flash Lite Preview | Cloud | Gemini 3.1 models from Google AI Studio |
| **Qwen** | Qwen3.5 Plus, Qwen3.5 Flash, Qwen3.5 397B, Qwen3.5 122B, Qwen3.5 27B | Cloud | DashScope OpenAI-compatible endpoints |
| **xAI** | Grok 4.1 Fast Reasoning, Grok 4.1 Fast Non-Reasoning, Grok 4 | Cloud | Grok models from xAI |
| **ZhipuAI** | GLM-5-Turbo, GLM-5, GLM-4.7, GLM-4.7-Flash | Cloud | Chinese AI models with JWT auth |
| **MiniMax** | MiniMax-M2.7, MiniMax-M2.7-highspeed | Cloud | MiniMax-M2.7 models |
| **DeepSeek** | DeepSeek Chat, DeepSeek Reasoner | Cloud | Advanced reasoning models |
| **Moonshot (Kimi)** | Kimi K2.5, Kimi K2 Thinking Turbo, Kimi K2 Turbo, Kimi K2 Thinking | Cloud | Moonshot AI Kimi models with thinking support |
| **LongCat** | LongCat Flash Thinking, LongCat Flash Chat, LongCat Flash Omni 2603, LongCat Flash Lite | Cloud | OpenAI-compatible LongCat Flash models |
| **Meta** | Llama 4 Maverick, Llama 3.3 Turbo | Cloud | Latest Llama models via providers |
| **Ollama** | NanBeige4.1, Qwen3.5:4B, Qwen3.5:Latest, GLM-4.7-Flash | Local/Network | Local & remote server support |

## Requirements

- Python 3.9+
- [uv](https://docs.astral.sh/uv/) (package manager)
- DroneKit-Python
- LiteLLM for cloud models
- Ollama for local/network models (optional)

## Tech Stack

- **uv** - Fast Python package manager and project tool
- **LiteLLM** - Unified interface for cloud AI models (OpenAI, Anthropic, Google, xAI, etc.)
- **Direct API Integration** - Native support for ZhipuAI, Qwen (DashScope), MiniMax, DeepSeek, Moonshot Kimi
- **Ollama** - Local/Network AI model execution with custom server support
- **DroneKit-Python** - Real drone control and telemetry
- **Rich** - Beautiful terminal interface and formatting
- **Typer** - Command-line interface framework
- **Pydantic** - Configuration management and validation

## Bridge Inspection Architecture

```
bridge/
  bridge_knowledge.py    # Domain knowledge & system prompts
  damage_detector.py     # Detection backends (Mock/YOLO/API)
  adaptive_planner.py    # LLM-driven waypoint replanning
  inspection_logger.py   # Session logging & report generation
```

**Inspection workflow:**
1. Enable bridge mode via API or chat
2. Start inspection session — generates routine waypoints for bridge elements
3. Drone follows waypoints; damage detector runs in parallel
4. On damage detection, adaptive planner generates supplementary waypoints
5. End session to produce structured inspection report (JTG/T H21-2011 compatible)

## Web Interface

DeepDrone-Bridge includes a modern web interface for browser-based drone control with a sleek, responsive design.

### Web Quick Start

```bash
# Option 1: One-click start (recommended)
uv run start_web.py

# Option 2: Manual start
uv run web_api.py
# Then visit: http://localhost:8000
```

### Web Tech Stack

- **Backend**: FastAPI + Uvicorn with RESTful API
- **Frontend**: React 18 with custom CSS design system
- **Real-time**: WebSocket support for live updates
- **Responsive**: Mobile-first design with touch support

## Network Features

- **Ollama Network Support**: Connect to Ollama servers on LAN or internet
- **Custom Server URLs**: Configure remote Ollama instances
- **Auto Model Detection**: Automatically detect available models on any server
- **Flexible Deployment**: Run models locally or on powerful remote servers

## Deployment

### Development
```bash
# Terminal interface
uv run main.py

# Web interface with hot reload
cd frontend
npm start  # Frontend (port 3000)
# In another terminal:
uv run uvicorn web_api:app --reload  # Backend (port 8000)
```

### Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
uv run start_web.py
```

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

---

**DeepDrone-Bridge v3.0** | Based on [DeepDrone](https://github.com/LeaderOnePro/deepdrone)
