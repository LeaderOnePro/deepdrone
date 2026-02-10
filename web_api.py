#!/usr/bin/env python3
"""
DeepDrone Web API Server
FastAPI backend for the DeepDrone web interface
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import json
import logging
import os
import re
import time
from datetime import datetime

from drone.config import ModelConfig, config_manager
from drone.llm_interface import LLMInterface
from drone.drone_chat_interface import DroneChatInterface
from drone.drone_tools import DroneToolsManager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="DeepDrone API",
    description="AI-Powered Drone Control System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
active_connections: List[WebSocket] = []
current_llm: Optional[LLMInterface] = None
current_drone_interface: Optional[DroneChatInterface] = None
drone_tools: Optional[DroneToolsManager] = None

# Initialize drone tools with default connection
def initialize_drone_tools():
    """Initialize drone tools manager"""
    global drone_tools
    if drone_tools is None:
        drone_tools = DroneToolsManager("tcp:127.0.0.1:5762")

# Code execution functions

def extract_code_blocks(text: str) -> List[str]:
    """Extract Python code blocks from markdown text."""
    pattern = r'```(?:python)?\n(.*?)\n```'
    matches = re.findall(pattern, text, re.DOTALL)
    return [match.strip() for match in matches if match.strip()]

async def execute_drone_code_from_response(response: str) -> List[Dict[str, Any]]:
    """Extract and execute Python code blocks from AI response."""
    global drone_tools
    
    # Initialize drone tools if not already done
    if drone_tools is None:
        initialize_drone_tools()
    
    code_blocks = extract_code_blocks(response)
    results = []
    
    for i, code in enumerate(code_blocks, 1):
        try:
            # Execute with timeout to prevent blocking
            result = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, execute_drone_code_safely, code
                ),
                timeout=45.0  # 45 second timeout
            )
            results.append({
                "block_number": i,
                "code": code,
                "success": True,
                "output": result
            })
        except asyncio.TimeoutError:
            results.append({
                "block_number": i,
                "code": code,
                "success": False,
                "error": "Code execution timed out (45 seconds)"
            })
        except Exception as e:
            results.append({
                "block_number": i,
                "code": code,
                "success": False,
                "error": str(e)
            })
    
    return results

def execute_drone_code_safely(code: str) -> str:
    """Execute drone code safely with limited scope."""
    global drone_tools
    
    # Create safe execution environment
    safe_globals = {
        '__builtins__': {
            'print': print,
            'len': len,
            'str': str,
            'int': int,
            'float': float,
            'dict': dict,
            'list': list,
            'range': range,
            '__import__': __import__,
        },
        'connect_drone': drone_tools.connect_drone,
        'disconnect_drone': drone_tools.disconnect_drone,
        'takeoff': drone_tools.takeoff,
        'land': drone_tools.land,
        'return_home': drone_tools.return_home,
        'return_and_land': drone_tools.return_and_land,
        'fly_to': drone_tools.fly_to,
        'get_location': drone_tools.get_location,
        'get_battery': drone_tools.get_battery,
        'execute_mission': drone_tools.execute_mission,
        'time': time,
    }
    
    # Capture output
    output_lines = []
    
    def capture_print(*args, **kwargs):
        output_lines.append(' '.join(str(arg) for arg in args))
    
    safe_globals['print'] = capture_print
    
    # Execute code
    exec(code, safe_globals)
    
    return '\n'.join(output_lines) if output_lines else "Code executed successfully"

# Pydantic models
class ModelConfigRequest(BaseModel):
    name: str
    provider: str
    model_id: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    max_tokens: int = 2048
    temperature: float = 0.7

class OllamaServerRequest(BaseModel):
    base_url: str = "http://localhost:11434"

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class DroneConnectionRequest(BaseModel):
    connection_string: str

class DroneCommandRequest(BaseModel):
    command: str

# API Routes

@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {"message": "DeepDrone API Server", "version": "1.0.0"}

@app.get("/api/providers")
async def get_providers():
    """Get available AI providers"""
    providers = {
        "OpenAI": {
            "name": "openai",
            "models": ["gpt-5.2", "gpt-5.1-codex-max", "gpt-5.1-codex-mini", "gpt-5.1-codex", "gpt-5.1", "gpt-5-mini", "gpt-5-nano"],
            "api_key_url": "https://platform.openai.com/api-keys",
            "description": "Latest GPT-5.2 and GPT-5.1 series models"
        },
        "Anthropic": {
            "name": "anthropic",
            "models": ["claude-opus-4-5-20251101", "claude-sonnet-4-5-20250929", "claude-3-haiku-20240307"],
            "api_key_url": "https://console.anthropic.com",
            "description": "Advanced Claude 4.5 models"
        },
        "Google": {
            "name": "google",
            "models": ["gemini/gemini-3-pro-preview", "gemini/gemini-3-flash-preview", "gemini/gemini-2.5-pro", "gemini/gemini-2.5-flash", "gemini/gemini-2.5-flash-lite"],
            "api_key_url": "https://aistudio.google.com/app/apikey",
            "description": "Gemini 3 models from Google AI Studio"
        },
        "Qwen": {
            "name": "qwen",
            "models": ["qwen3-max", "qwen3-235b-a22b-thinking-2507", "qwen3-235b-a22b-instruct-2507", "qwen3-coder-plus", "qwen3-next-80b-a3b-thinking", "qwen3-next-80b-a3b-instruct"],
            "api_key_url": "https://bailian.console.aliyun.com/ai/ak",
            "description": "Qwen3 models via DashScope"
        },
        "xAI": {
            "name": "xai",
            "models": ["grok-4-1-fast-reasoning", "grok-4-1-fast-non-reasoning", "grok-4-0709"],
            "api_key_url": "https://console.x.ai",
            "description": "Grok models from xAI"
        },
        "ZhipuAI": {
            "name": "zhipuai",
            "models": ["glm-4.7", "glm-4.7-flash", "glm-4.5-air"],
            "api_key_url": "https://open.bigmodel.cn/usercenter/apikeys",
            "description": "GLM models from ZhipuAI"
        },
        "DeepSeek": {
            "name": "deepseek",
            "models": ["deepseek-chat", "deepseek-reasoner"],
            "api_key_url": "https://platform.deepseek.com",
            "description": "DeepSeek models with reasoning capabilities"
        },
        "Kimi": {
            "name": "moonshot",
            "models": ["kimi-k2.5", "kimi-k2-thinking-turbo", "kimi-k2-turbo-preview", "kimi-k2-thinking", "kimi-k2-0905-preview"],
            "api_key_url": "https://platform.moonshot.cn/console/api-keys",
            "description": "Kimi models from Moonshot AI"
        },
        "LongCat": {
            "name": "longcat",
            "models": ["LongCat-Flash-Thinking-2601", "LongCat-Flash-Chat", "LongCat-Flash-Thinking", "LongCat-Flash-Lite"],
            "api_key_url": "https://longcat.chat/platform/api_keys",
            "description": "LongCat Flash models with thinking support"
        },
        "Meta": {
            "name": "meta",
            "models": ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "llama/Llama-3.3-70B-Instruct-Turbo"],
            "api_key_url": "https://together.ai",
            "api_key_alternatives": ["https://replicate.com", "https://openrouter.ai"],
            "description": "Latest Llama models via providers"
        },
        "Ollama": {
            "name": "ollama",
            "models": ["qwen3:4b", "gpt-oss:latest", "glm-4.7-flash"],
            "api_key_url": "https://ollama.com (No API key needed - supports local/network)",
            "description": "Local/Network models via Ollama with custom server support"
        }
    }
    return providers

@app.post("/api/models/configure")
async def configure_model(config: ModelConfigRequest):
    """Configure AI model"""
    global current_llm
    
    try:
        # Create model configuration
        model_config = ModelConfig(
            name=config.name,
            provider=config.provider,
            model_id=config.model_id,
            api_key=config.api_key,
            base_url=config.base_url,
            max_tokens=config.max_tokens,
            temperature=config.temperature
        )
        
        # Initialize LLM interface
        current_llm = LLMInterface(model_config)
        
        # Test connection
        test_result = current_llm.test_connection()
        
        if test_result["success"]:
            return {
                "success": True,
                "message": "AI模型配置成功！",
                "model_info": current_llm.get_model_info()
            }
        else:
            # Translate error messages to Chinese
            error_msg = test_result["error"]
            if "api key" in error_msg.lower():
                error_msg = "API密钥错误，请检查您的API密钥"
            elif "quota" in error_msg.lower() or "billing" in error_msg.lower():
                error_msg = "配额不足或账单问题，请检查您的账户"
            elif "model" in error_msg.lower() and "not found" in error_msg.lower():
                error_msg = f"模型 '{test_result['model']}' 未找到"
            elif "connection" in error_msg.lower() or "network" in error_msg.lower():
                error_msg = "网络连接失败，请检查网络连接"
            elif "timeout" in error_msg.lower():
                error_msg = "连接超时，请重试"
            
            return {
                "success": False,
                "message": f"模型配置失败：{error_msg}"
            }
            
    except Exception as e:
        logger.error(f"Error configuring model: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/models/current")
async def get_current_model():
    """Get current model information"""
    if current_llm:
        return {
            "configured": True,
            "model_info": current_llm.get_model_info()
        }
    else:
        return {"configured": False}

@app.post("/api/models/test")
async def test_model_connection(config: ModelConfigRequest):
    """Test AI model connection without saving configuration"""
    try:
        # Create temporary model configuration
        model_config = ModelConfig(
            name=config.name,
            provider=config.provider,
            model_id=config.model_id,
            api_key=config.api_key,
            base_url=config.base_url,
            max_tokens=config.max_tokens,
            temperature=config.temperature
        )
        
        # Initialize temporary LLM interface
        temp_llm = LLMInterface(model_config)
        
        # Test connection
        test_result = temp_llm.test_connection()
        
        if test_result["success"]:
            # Check if response indicates an error (since test_connection might return success even with errors)
            response = test_result.get("response", "")
            response_lower = response.lower() if response else ""
            error_indicators = [
                "❌", "error", "api key", "authentication", "unauthorized", 
                "invalid", "quota", "billing", "timeout", "failed", "denied",
                "connection refused", "connection failed", "network error",
                "internal server error", "internal error", "service unavailable"
            ]
            
            # If response contains error indicators, treat as failure
            # Use more specific connection error patterns to avoid false positives
            if any(indicator in response_lower for indicator in error_indicators):
                # Translate error messages to Chinese
                error_msg = response
                error_msg_lower = error_msg.lower()
                if "api key" in error_msg_lower:
                    error_msg = "API密钥错误，请检查您的API密钥"
                elif "internal server error" in error_msg_lower or "internal error" in error_msg_lower:
                    error_msg = "AI服务提供商内部错误，请稍后重试"
                elif "quota" in error_msg_lower or "billing" in error_msg_lower:
                    error_msg = "配额不足或账单问题，请检查您的账户"
                elif "model" in error_msg_lower and "not found" in error_msg_lower:
                    error_msg = f"模型 '{test_result['model']}' 未找到"
                elif "connection" in error_msg_lower or "network" in error_msg_lower:
                    error_msg = "网络连接失败，请检查网络连接"
                elif "timeout" in error_msg_lower:
                    error_msg = "连接超时，请重试"
                
                return {
                    "success": False,
                    "message": error_msg,
                    "provider": test_result["provider"],
                    "model": test_result["model"]
                }
            
            # Additional check: response should be reasonable length and not just an error message
            if len(response.strip()) < 5:
                return {
                    "success": False,
                    "message": "连接失败，未收到有效响应",
                    "provider": test_result["provider"],
                    "model": test_result["model"]
                }
            
            return {
                "success": True,
                "message": "连接测试成功！",
                "provider": test_result["provider"],
                "model": test_result["model"]
            }
        else:
            # Translate error messages to Chinese
            error_msg = test_result.get("error", "未知错误")
            if error_msg and isinstance(error_msg, str):
                error_msg_lower = error_msg.lower()
                if "api key" in error_msg_lower:
                    error_msg = "API密钥错误，请检查您的API密钥"
                elif "internal server error" in error_msg_lower or "internal error" in error_msg_lower:
                    error_msg = "AI服务提供商内部错误，请稍后重试"
                elif "quota" in error_msg_lower or "billing" in error_msg_lower:
                    error_msg = "配额不足或账单问题，请检查您的账户"
                elif "model" in error_msg_lower and "not found" in error_msg_lower:
                    error_msg = f"模型 '{test_result.get('model', '未知')}' 未找到"
                elif "connection" in error_msg_lower or "network" in error_msg_lower:
                    error_msg = "网络连接失败，请检查网络连接"
                elif "timeout" in error_msg_lower:
                    error_msg = "连接超时，请重试"
            else:
                error_msg = "连接测试失败，请重试"
            
            return {
                "success": False,
                "message": error_msg,
                "provider": test_result.get("provider", "未知"),
                "model": test_result.get("model", "未知")
            }
            
    except Exception as e:
        logger.error(f"Error testing model connection: {e}")
        error_msg = str(e) if e else "未知错误"
        
        # Translate common error messages to Chinese
        if error_msg:
            error_msg_lower = error_msg.lower()
            if "api key" in error_msg_lower:
                error_msg = "API密钥错误，请检查您的API密钥"
            elif "internal server error" in error_msg_lower or "internal error" in error_msg_lower:
                error_msg = "AI服务提供商内部错误，请稍后重试"
            elif "connection" in error_msg_lower:
                error_msg = "连接失败，请检查网络连接"
            elif "timeout" in error_msg_lower:
                error_msg = "连接超时，请重试"
            elif "quota" in error_msg_lower or "billing" in error_msg_lower:
                error_msg = "配额不足或账单问题，请检查您的账户"
            else:
                error_msg = f"连接测试失败：{error_msg}"
        else:
            error_msg = "连接测试失败，请重试"
        
        return {
            "success": False,
            "message": error_msg
        }

@app.post("/api/ollama/models")
async def get_ollama_models(request: OllamaServerRequest):
    """Get available models from Ollama server"""
    try:
        import ollama
        
        # Create client with custom base URL
        client = ollama.Client(host=request.base_url)
        models = client.list()
        
        # Extract model names
        model_list = []
        if hasattr(models, 'models'):
            model_list = [model.model for model in models.models]
        
        return {
            "success": True,
            "server_url": request.base_url,
            "models": model_list,
            "count": len(model_list)
        }
        
    except ImportError:
        raise HTTPException(status_code=400, detail="Ollama package not installed")
    except Exception as e:
        logger.error(f"Error getting Ollama models: {e}")
        return {
            "success": False,
            "server_url": request.base_url,
            "error": str(e),
            "models": []
        }

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Send chat message to AI"""
    global current_llm
    
    if not current_llm:
        raise HTTPException(status_code=400, detail="No AI model configured")
    
    try:
        # Get current drone status
        drone_status = await get_drone_status()
        is_connected = drone_status.get("connected", False)
        
        # Create system prompt for drone operations with current status
        connection_status = "CONNECTED" if is_connected else "DISCONNECTED"
        system_prompt = """You are DeepDrone AI, an advanced drone control assistant developed by Zhendian Technology (臻巅科技). You can control real drones through Python code. You understand both Chinese and English commands and should respond in the same language the user uses.

CURRENT DRONE STATUS: """ + connection_status + """

CRITICAL CONNECTION RULES:
- If status shows CONNECTED: NEVER call connect_drone() - the drone is already connected!
- If status shows DISCONNECTED: Call connect_drone('tcp:127.0.0.1:5762') first
- ALWAYS check the status above before deciding whether to connect

IMPORTANT: When drone status is CONNECTED, skip connection and go directly to the requested operation!

Available drone functions (use these in Python code blocks):
- connect_drone(connection_string): Connect to drone / 连接到无人机 (ONLY if currently DISCONNECTED)
- takeoff(altitude): Take off to specified altitude in meters / 起飞到指定高度（米）
- land(): Land the drone / 降落无人机
- return_home(): Return to launch point / 返回起飞点
- fly_to(lat, lon, alt): Fly to GPS coordinates / 飞行到GPS坐标
- get_location(): Get current GPS position / 获取当前GPS位置
- get_battery(): Get battery status / 获取电池状态
- execute_mission(waypoints): Execute mission with waypoints list / 执行航点任务
- disconnect_drone(): Disconnect from drone / 断开无人机连接

Language adaptation rules:
- If user writes in Chinese, respond in Chinese
- If user writes in English, respond in English
- If mixed languages, use the primary language of the user's message
- Always prioritize safety and provide clear explanations

When user asks for drone operations:
1. Check current drone status (CONNECTED/DISCONNECTED)
2. Explain what you'll do in the same language as the user
3. Provide Python code in ```python code blocks
4. The code will be executed automatically
5. Provide status updates

Example response styles:

When CONNECTED:
English user: "Take off to 30 meters"
Response: "I'll take off to 30 meters altitude since the drone is already connected.

```python
# Take off to 30 meters (drone already connected)
takeoff(30)

# Get status
location = get_location()
battery = get_battery()
print(f"Location: {location}")
print(f"Battery: {battery}")
```

The drone should now be airborne at 30 meters altitude."

When DISCONNECTED:
Chinese user: "起飞到30米"
Response: "我将先连接到无人机，然后起飞到30米高度。

```python
# 连接到无人机
connect_drone('tcp:127.0.0.1:5762')

# 起飞到30米
takeoff(30)

# 获取状态
location = get_location()
battery = get_battery()
print(f"位置: {location}")
print(f"电池: {battery}")
```

无人机现在应该已经在30米高度悬停。"

Always prioritize safety and explain each operation clearly in the user's language."""
        
        # Prepare messages with system prompt
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ]
        
        # Get AI response
        response = current_llm.chat(messages)
        
        # Extract and execute Python code blocks if present
        execution_results = []
        if "```python" in response:
            try:
                execution_results = await execute_drone_code_from_response(response)
            except Exception as exec_error:
                logger.error(f"Code execution error: {exec_error}")
                execution_results = [{
                    "block_number": 1,
                    "code": "# Code execution failed",
                    "success": False,
                    "error": f"Execution error: {str(exec_error)}"
                }]
        
        return {
            "success": True,
            "response": response,
            "execution_results": execution_results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/drone/connect")
async def connect_drone(request: DroneConnectionRequest):
    """Connect to drone"""
    global drone_tools
    
    try:
        # Initialize drone tools if not already done
        if drone_tools is None:
            initialize_drone_tools()
        
        # Disconnect any existing connection first
        if (hasattr(drone_tools, 'connected') and drone_tools.connected):
            logger.info("Disconnecting existing drone connection before reconnecting")
            drone_tools.disconnect_drone()
        
        # Attempt to connect to the drone
        logger.info(f"Attempting to connect to drone at: {request.connection_string}")
        
        # Use the drone tools to connect
        success = drone_tools.connect_drone(request.connection_string)
        
        # Check if connection was successful
        if success:
            return {
                "success": True,
                "message": "无人机连接成功！",
                "connection_string": request.connection_string
            }
        else:
            return {
                "success": False,
                "message": "无人机连接失败，请检查连接字符串和网络设置",
                "connection_string": request.connection_string
            }
        
    except Exception as e:
        logger.error(f"Drone connection error: {e}")
        return {
            "success": False,
            "message": f"连接失败：{str(e)}",
            "connection_string": request.connection_string
        }

@app.post("/api/drone/disconnect")
async def disconnect_drone():
    """Disconnect from drone"""
    global drone_tools
    
    try:
        # Initialize drone tools if not already done
        if drone_tools is None:
            initialize_drone_tools()
        
        # Check if there's an active connection
        if hasattr(drone_tools, 'connected') and drone_tools.connected:
            logger.info("Disconnecting from drone")
            drone_tools.disconnect_drone()
            return {
                "success": True,
                "message": "无人机已断开连接"
            }
        else:
            return {
                "success": True,
                "message": "无人机未连接，无需断开"
            }
        
    except Exception as e:
        logger.error(f"Drone disconnection error: {e}")
        return {
            "success": False,
            "message": f"断开连接失败：{str(e)}"
        }

@app.get("/api/drone/status")
async def get_drone_status():
    """Get drone status"""
    global drone_tools
    
    # Initialize drone tools if not already done
    if drone_tools is None:
        initialize_drone_tools()
    
    try:
        # Check if drone is actually connected - simplified and more reliable check
        if (hasattr(drone_tools, 'connected') and drone_tools.connected):
            # Get real drone status
            location = drone_tools.get_location()
            battery = drone_tools.get_battery()
            
            return {
                "connected": True,
                "battery": battery.get("level", 0) if isinstance(battery, dict) else 0,
                "altitude": location.get("alt", 0) if isinstance(location, dict) else 0,
                "location": {
                    "lat": location.get("lat", 0) if isinstance(location, dict) else 0,
                    "lon": location.get("lon", 0) if isinstance(location, dict) else 0
                },
                "mode": "STABILIZE",  # Default mode when connected
                "armed": False
            }
        else:
            # Return disconnected status
            return {
                "connected": False,
                "battery": 0,
                "altitude": 0,
                "location": {
                    "lat": 0,
                    "lon": 0
                },
                "mode": "UNKNOWN",
                "armed": False
            }
    except Exception as e:
        logger.error(f"Error getting drone status: {e}")
        # Return disconnected status on error
        return {
            "connected": False,
            "battery": 0,
            "altitude": 0,
            "location": {
                "lat": 0,
                "lon": 0
            },
            "mode": "ERROR",
            "armed": False
        }

# WebSocket for real-time communication
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process message based on type
            if message_data.get("type") == "chat":
                if current_llm:
                    # Get current drone status for WebSocket
                    drone_status = await get_drone_status()
                    is_connected = drone_status.get("connected", False)
                    connection_status = "CONNECTED" if is_connected else "DISCONNECTED"
                    
                    # Create system prompt for drone operations with current status
                    system_prompt = """You are DeepDrone AI, an advanced drone control assistant developed by Zhendian Technology (臻巅科技). You can control real drones through Python code. You understand both Chinese and English commands and should respond in the same language the user uses.

CURRENT DRONE STATUS: """ + connection_status + """

CRITICAL CONNECTION RULES:
- If status shows CONNECTED: NEVER call connect_drone() - the drone is already connected!
- If status shows DISCONNECTED: Call connect_drone('tcp:127.0.0.1:5762') first
- ALWAYS check the status above before deciding whether to connect

IMPORTANT: When drone status is CONNECTED, skip connection and go directly to the requested operation!

Available drone functions (use these in Python code blocks):
- connect_drone(connection_string): Connect to drone / 连接到无人机 (ONLY if currently DISCONNECTED)
- takeoff(altitude): Take off to specified altitude in meters / 起飞到指定高度（米）
- land(): Land the drone / 降落无人机
- return_home(): Return to launch point / 返回起飞点
- fly_to(lat, lon, alt): Fly to GPS coordinates / 飞行到GPS坐标
- get_location(): Get current GPS position / 获取当前GPS位置
- get_battery(): Get battery status / 获取电池状态
- execute_mission(waypoints): Execute mission with waypoints list / 执行航点任务
- disconnect_drone(): Disconnect from drone / 断开无人机连接

Language adaptation rules:
- If user writes in Chinese, respond in Chinese
- If user writes in English, respond in English
- If mixed languages, use the primary language of the user's message
- Always prioritize safety and provide clear explanations

When user asks for drone operations:
1. Check current drone status (CONNECTED/DISCONNECTED)
2. Explain what you'll do in the same language as the user
3. Provide Python code in ```python code blocks
4. The code will be executed automatically
5. Provide status updates

Example response styles:

English user: "Take off to 30 meters"
Response: "I'll connect to the drone and take off to 30 meters altitude.

```python
# Connect to the drone
connect_drone('tcp:127.0.0.1:5762')

# Take off to 30 meters
takeoff(30)

# Get status
location = get_location()
battery = get_battery()
print(f"Location: {location}")
print(f"Battery: {battery}")
```

The drone should now be airborne at 30 meters altitude."

When DISCONNECTED:
Chinese user: "起飞到30米"
Response: "我将先连接到无人机，然后起飞到30米高度。

```python
# 连接到无人机
connect_drone('tcp:127.0.0.1:5762')

# 起飞到30米
takeoff(30)

# 获取状态
location = get_location()
battery = get_battery()
print(f"位置: {location}")
print(f"电池: {battery}")
```

无人机现在应该已经在30米高度悬停。"

Always prioritize safety and explain each operation clearly in the user's language."""
                    
                    # Get AI response with system prompt
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message_data["content"]}
                    ]
                    response = current_llm.chat(messages)
                    
                    # Extract and execute Python code blocks if present
                    execution_results = []
                    if "```python" in response:
                        try:
                            execution_results = await execute_drone_code_from_response(response)
                        except Exception as exec_error:
                            logger.error(f"Code execution error: {exec_error}")
                            execution_results = [{
                                "block_number": 1,
                                "code": "# Code execution failed",
                                "success": False,
                                "error": f"Execution error: {str(exec_error)}"
                            }]
                    
                    # Send response back
                    await websocket.send_text(json.dumps({
                        "type": "chat_response",
                        "content": response,
                        "execution_results": execution_results,
                        "timestamp": datetime.now().isoformat()
                    }))
                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "content": "No AI model configured"
                    }))
            
            elif message_data.get("type") == "drone_command":
                # Process drone command
                await websocket.send_text(json.dumps({
                    "type": "drone_response",
                    "content": f"Executing: {message_data['content']}",
                    "timestamp": datetime.now().isoformat()
                }))
                
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("WebSocket client disconnected")

# Serve static files (frontend)
if os.path.exists("frontend/build"):
    # Only mount static files if the static directory exists
    if os.path.exists("frontend/build/static"):
        app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")
    
    # Root route - serve React frontend
    @app.get("/")
    async def serve_frontend_root():
        """Serve React frontend at root"""
        index_path = "frontend/build/index.html"
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                return HTMLResponse(f.read())
        else:
            return HTMLResponse("""
            <html>
                <head><title>DeepDrone</title></head>
                <body>
                    <h1>🚁 DeepDrone Web Interface</h1>
                    <p>Frontend not built yet. Please run:</p>
                    <pre>cd frontend && npm install && npm run build</pre>
                    <p>Or use the API directly at <a href="/docs">/docs</a></p>
                </body>
            </html>
            """)
    
    # Catch-all route for React Router
    @app.get("/{path:path}")
    async def serve_frontend_routes(path: str):
        """Serve React frontend for all non-API routes"""
        # Don't serve frontend for API routes
        if path.startswith("api") or path.startswith("docs") or path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Serve index.html for all frontend routes
        index_path = "frontend/build/index.html"
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                return HTMLResponse(f.read())
        else:
            raise HTTPException(status_code=404, detail="Frontend not available")
            
else:
    # Serve a simple message if frontend build doesn't exist
    @app.get("/")
    async def serve_no_frontend():
        """Serve message when no frontend build exists"""
        return HTMLResponse("""
        <html>
            <head><title>DeepDrone API</title></head>
            <body>
                <h1>🚁 DeepDrone API Server</h1>
                <p>Frontend not available. Build the frontend first:</p>
                <pre>cd frontend && npm install && npm run build</pre>
                <p>API documentation: <a href="/docs">/docs</a></p>
                <p>API endpoints: <a href="/api/providers">/api/providers</a></p>
            </body>
        </html>
        """)

if __name__ == "__main__":
    import uvicorn
    
    # Initialize drone tools
    initialize_drone_tools()
    
    print("🚀 Starting DeepDrone API server...")
    print("📡 API will be available at: http://localhost:8000")
    print("📖 API docs at: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
