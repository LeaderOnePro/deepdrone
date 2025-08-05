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

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "DeepDrone API Server", "version": "1.0.0"}

@app.get("/api/providers")
async def get_providers():
    """Get available AI providers"""
    providers = {
        "OpenAI": {
            "name": "openai",
            "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
            "api_key_url": "https://platform.openai.com/api-keys",
            "description": "GPT models from OpenAI"
        },
        "Anthropic": {
            "name": "anthropic",
            "models": ["claude-3-5-sonnet-20241022", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
            "api_key_url": "https://console.anthropic.com/",
            "description": "Claude models from Anthropic"
        },
        "Google": {
            "name": "vertex_ai",
            "models": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"],
            "api_key_url": "https://console.cloud.google.com/",
            "description": "Gemini models from Google"
        },
        "ZhipuAI": {
            "name": "zhipuai",
            "models": ["glm-4.5", "glm-4.5-air", "glm-4.5-flash"],
            "api_key_url": "https://open.bigmodel.cn/usercenter/apikeys",
            "description": "GLM models from ZhipuAI"
        },
        "Ollama": {
            "name": "ollama",
            "models": ["llama3.1:latest", "codestral:latest", "qwen2.5-coder:latest"],
            "api_key_url": "https://ollama.ai/ (No API key needed)",
            "description": "Local models via Ollama"
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

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Send chat message to AI"""
    global current_llm
    
    if not current_llm:
        raise HTTPException(status_code=400, detail="No AI model configured")
    
    try:
        # Prepare messages
        messages = [
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
                    # Get AI response
                    messages = [{"role": "user", "content": message_data["content"]}]
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
    app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")
    
    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        """Serve React frontend"""
        if path and not path.startswith("api"):
            return HTMLResponse(open("frontend/build/index.html").read())
        return HTMLResponse(open("frontend/build/index.html").read())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")