# 🚁 DeepDrone - AI-Powered Drone Control Terminal

![DeepDrone Demo](media/demo.png)

**Control drones with natural language using the latest AI models from 10 major providers: OpenAI GPT-5, Anthropic Claude-4, Google Gemini-2.5, Meta Llama-4, xAI Grok, ZhipuAI, Qwen, DeepSeek, Kimi, and local/network Ollama models.**

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start interactive setup
python main.py
```

The app will guide you through:
- **AI Provider Selection**: Choose from 10 providers with latest models
- **Model Selection**: Pick from cutting-edge AI models (network Ollama supported)
- **Drone Connection**: Connect to simulator or real drone
- **Natural Language Control**: "Take off to 30 meters", "Fly in a square pattern"

## ✨ Features

- 🤖 **Comprehensive AI Support**: 10 major providers with latest models (GPT-5, Claude-4, Gemini-2.5, Llama-4, Grok, etc.)
- 🌐 **Network Flexibility**: Local, LAN, and internet Ollama server support
- 🚁 **Real Drone Control**: DroneKit integration for actual flight control
- 💬 **Natural Language**: Control drones with conversational commands
- 🛠️ **Built-in Simulator**: Includes drone simulator for testing
- 🔒 **Safe Operations**: Emergency stops and return-to-home functions

## 🛠️ Simulator Setup

```bash
# Quick simulator (included)
python simulate_drone.py

# Advanced SITL (optional)
# Follow ArduPilot SITL installation guide
```

## 📝 Example Commands

```
🚁 DeepDrone> Connect to simulator and take off to 20 meters
🚁 DeepDrone> Fly to GPS coordinates 37.7749, -122.4194
🚁 DeepDrone> Execute a square flight pattern with 50m sides
🚁 DeepDrone> Return home and land safely
```

## 🤖 Supported AI Providers

| Provider | Models | API Type | Description |
|----------|--------|----------|-------------|
| **OpenAI** | GPT-5, GPT-5-mini, GPT-5-nano, etc | Cloud | Latest GPT-5 series models |
| **Anthropic** | Claude-Opus-4.1, Claude-Sonnet-4, etc | Cloud | Advanced Claude-4 models |
| **Google** | Gemini-2.5-Pro, Gemini-2.5-Flash, etc | Cloud | Google AI Studio integration |
| **Meta** | Llama-4-Maverick, Llama-3.3-Turbo, etc | Cloud | Latest Llama models via providers |
| **xAI** | Grok-4, Grok-3, Grok-3-mini, etc | Cloud | Elon Musk's xAI models |
| **ZhipuAI** | GLM-4.5, GLM-4.5-Air, etc | Cloud | Chinese AI models with JWT auth |
| **Qwen** | Qwen3-235B, Qwen3-Coder, etc | Cloud | Alibaba's latest Qwen3 models |
| **DeepSeek** | DeepSeek-Chat, DeepSeek-Reasoner, etc | Cloud | Advanced reasoning models |
| **Kimi** | Kimi-K2-Turbo, Kimi-K2-Preview, etc | Cloud | Moonshot AI models |
| **Ollama** | Qwen3:4B, GPT-OSS, Qwen3:30B, etc | Local/Network | Local & remote server support |

## 🔧 Requirements

- Python 3.8+
- DroneKit-Python
- LiteLLM for cloud models
- Ollama for local/network models (optional)

## 💻 Tech Stack

- **LiteLLM** - Unified interface for cloud AI models (OpenAI, Anthropic, Google, xAI, etc.)
- **Direct API Integration** - Native support for ZhipuAI, Qwen, DeepSeek, Kimi
- **Ollama** - Local/Network AI model execution with custom server support
- **DroneKit-Python** - Real drone control and telemetry
- **Rich** - Beautiful terminal interface and formatting
- **Typer** - Command-line interface framework
- **Pydantic** - Configuration management and validation

## 🌐 Network Features

- **Ollama Network Support**: Connect to Ollama servers on LAN or internet
- **Custom Server URLs**: Configure remote Ollama instances
- **Auto Model Detection**: Automatically detect available models on any server
- **Flexible Deployment**: Run models locally or on powerful remote servers