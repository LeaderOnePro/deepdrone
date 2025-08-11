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
from datetime import datetime

from drone.config import ModelConfig, config_manager
from drone.llm_interface import LLMInterface
from drone.drone_chat_interface import DroneChatInterface

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
            "models": ["gpt-5", "gpt-5-mini", "gpt-5-nano"],
            "api_key_url": "https://platform.openai.com/api-keys",
            "description": "Latest GPT-5 series models"
        },
        "Anthropic": {
            "name": "anthropic",
            "models": ["claude-opus-4-1-20250805", "claude-sonnet-4-20250514", "claude-3-haiku-20240307"],
            "api_key_url": "https://console.anthropic.com/",
            "description": "Advanced Claude-4 models"
        },
        "Google": {
            "name": "google",
            "models": ["gemini/gemini-2.5-pro", "gemini/gemini-2.5-flash", "gemini/gemini-2.5-flash-lite"],
            "api_key_url": "https://aistudio.google.com/app/apikey",
            "description": "Gemini 2.5 models from Google AI Studio"
        },
        "Meta": {
            "name": "openai",
            "models": ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "llama/Llama-3.3-70B-Instruct-Turbo"],
            "api_key_url": "https://together.ai/ or https://replicate.com/",
            "description": "Latest Llama models via providers"
        },
        "xAI": {
            "name": "xai",
            "models": ["grok-4-0709", "grok-3", "grok-3-mini"],
            "api_key_url": "https://console.x.ai/",
            "description": "Grok models from xAI"
        },
        "ZhipuAI": {
            "name": "zhipuai",
            "models": ["glm-4.5", "glm-4.5-air", "glm-4.5-flash"],
            "api_key_url": "https://open.bigmodel.cn/usercenter/apikeys",
            "description": "GLM models from ZhipuAI"
        },
        "Qwen": {
            "name": "qwen",
            "models": ["qwen3-235b-a22b-thinking-2507", "qwen3-coder-480b-a35b-instruct"],
            "api_key_url": "https://bailian.console.aliyun.com/ai/ak",
            "description": "Qwen3 models via DashScope"
        },
        "DeepSeek": {
            "name": "deepseek",
            "models": ["deepseek-chat", "deepseek-reasoner"],
            "api_key_url": "https://platform.deepseek.com/",
            "description": "DeepSeek models with reasoning capabilities"
        },
        "Kimi": {
            "name": "moonshot",
            "models": ["kimi-k2-turbo-preview", "kimi-k2-0711-preview"],
            "api_key_url": "https://platform.moonshot.cn/console/api-keys",
            "description": "Kimi models from Moonshot AI"
        },
        "Ollama": {
            "name": "ollama",
            "models": ["qwen3:4b", "gpt-oss:latest", "qwen3:30b"],
            "api_key_url": "https://ollama.ai/ (No API key needed - supports local/network)",
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
                "message": "Model configured successfully",
                "model_info": current_llm.get_model_info()
            }
        else:
            return {
                "success": False,
                "message": f"Model configuration failed: {test_result['error']}"
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
        # Create system prompt for drone operations
        system_prompt = """You are DeepDrone AI, an advanced drone control assistant developed by Zhendian Technology (臻巅科技). You understand both Chinese and English commands and should respond in the same language the user uses.

Your main functions:
1. Understand user's natural language commands (Chinese or English)
2. Explain drone operations and flight principles
3. Provide safe flight recommendations
4. Answer questions about drone status and operations

Language adaptation rules:
- If user writes in Chinese, respond in Chinese
- If user writes in English, respond in English
- If mixed languages, use the primary language of the user's message
- Always prioritize safety and provide clear explanations

When users ask about drone operations:
- Clearly explain operation steps in their language
- Emphasize safety precautions
- Provide professional but understandable advice
- Maintain a friendly and professional tone

Example response styles:

English user: "Take off to 30 meters"
Response: "I'll help you with taking off to 30 meters. First, ensure the drone is connected and pre-flight checks are completed, then execute the takeoff command. Please make sure the surrounding environment is safe with no obstacles. Monitor the drone during takeoff."

Chinese user: "起飞到30米"
Response: "好的，我来为您解释起飞到30米的操作。首先需要确保无人机已连接并完成预检，然后执行起飞指令。请确保周围环境安全，无障碍物。起飞过程中请保持对无人机的监控。"

Always prioritize flight safety and communicate in the user's preferred language."""
        
        # Prepare messages with system prompt
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ]
        
        # Get AI response
        response = current_llm.chat(messages)
        
        return {
            "success": True,
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/drone/connect")
async def connect_drone(request: DroneConnectionRequest):
    """Connect to drone"""
    global current_drone_interface
    
    try:
        # This would integrate with the actual drone connection logic
        # For now, return a mock response
        return {
            "success": True,
            "message": f"Connected to drone at {request.connection_string}",
            "connection_string": request.connection_string
        }
        
    except Exception as e:
        logger.error(f"Drone connection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/drone/status")
async def get_drone_status():
    """Get drone status"""
    # Mock drone status - in real implementation, this would query actual drone
    return {
        "connected": True,
        "battery": 85,
        "altitude": 0,
        "location": {
            "lat": 37.7749,
            "lon": -122.4194
        },
        "mode": "STABILIZE",
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
                    # Create system prompt for drone operations
                    system_prompt = """You are DeepDrone AI, an advanced drone control assistant developed by Zhendian Technology (臻巅科技). You understand both Chinese and English commands and should respond in the same language the user uses.

Your main functions:
1. Understand user's natural language commands (Chinese or English)
2. Explain drone operations and flight principles
3. Provide safe flight recommendations
4. Answer questions about drone status and operations

Language adaptation rules:
- If user writes in Chinese, respond in Chinese
- If user writes in English, respond in English
- If mixed languages, use the primary language of the user's message
- Always prioritize safety and provide clear explanations

When users ask about drone operations:
- Clearly explain operation steps in their language
- Emphasize safety precautions
- Provide professional but understandable advice
- Maintain a friendly and professional tone

Example response styles:

English user: "Take off to 30 meters"
Response: "I'll help you with taking off to 30 meters. First, ensure the drone is connected and pre-flight checks are completed, then execute the takeoff command. Please make sure the surrounding environment is safe with no obstacles. Monitor the drone during takeoff."

Chinese user: "起飞到30米"
Response: "好的，我来为您解释起飞到30米的操作。首先需要确保无人机已连接并完成预检，然后执行起飞指令。请确保周围环境安全，无障碍物。起飞过程中请保持对无人机的监控。"

Always prioritize flight safety and communicate in the user's preferred language."""
                    
                    # Get AI response with system prompt
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message_data["content"]}
                    ]
                    response = current_llm.chat(messages)
                    
                    # Send response back
                    await websocket.send_text(json.dumps({
                        "type": "chat_response",
                        "content": response,
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
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")