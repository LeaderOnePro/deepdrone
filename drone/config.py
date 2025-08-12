"""
Configuration management for DeepDrone terminal application.
"""

import os
import json
from pathlib import Path
from typing import Dict, Optional, List
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

class ModelConfig(BaseModel):
    """Configuration for a specific model."""
    name: str
    provider: str  # 'openai', 'anthropic', 'ollama', etc.
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_id: str
    max_tokens: int = 2048
    temperature: float = 0.7

class DroneConfig(BaseModel):
    """Configuration for drone connection."""
    default_connection_string: str = "tcp:127.0.0.1:5762"
    timeout: int = 30
    default_altitude: float = 30.0
    max_altitude: float = 100.0

class AppSettings(BaseSettings):
    """Main application settings."""
    
    # File paths
    config_dir: Path = Field(default_factory=lambda: Path.home() / ".deepdrone")
    models_file: Path = Field(default_factory=lambda: Path.home() / ".deepdrone" / "models.json")
    
    # Default model
    default_model: str = "gpt-5"
    
    # Drone settings
    drone: DroneConfig = Field(default_factory=DroneConfig)
    
    # Terminal settings
    show_thinking: bool = True
    auto_save_chat: bool = True
    chat_history_limit: int = 100
    
    class Config:
        env_prefix = "DEEPDRONE_"
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables

class ConfigManager:
    """Manages application configuration and model settings."""
    
    def __init__(self):
        self.settings = AppSettings()
        self.models: Dict[str, ModelConfig] = {}
        self._ensure_config_dir()
        self._load_models()
    
    def _ensure_config_dir(self):
        """Ensure configuration directory exists."""
        self.settings.config_dir.mkdir(exist_ok=True)
    
    def _load_models(self):
        """Load model configurations from file."""
        if self.settings.models_file.exists():
            try:
                with open(self.settings.models_file, 'r') as f:
                    models_data = json.load(f)
                    self.models = {
                        name: ModelConfig(**config)
                        for name, config in models_data.items()
                    }
            except Exception as e:
                print(f"Error loading models config: {e}")
                self.models = {}
        else:
            # Create default models
            self._create_default_models()
    
    def _create_default_models(self):
        """Create default model configurations."""
        self.models = {
            "gpt-5": ModelConfig(
                name="gpt-5",
                provider="openai",
                model_id="gpt-5",
                max_tokens=2048,
                temperature=0.7
            ),
            "gpt-5-mini": ModelConfig(
                name="gpt-5-mini",
                provider="openai", 
                model_id="gpt-5-mini",
                max_tokens=2048,
                temperature=0.7
            ),
            "gpt-5-nano": ModelConfig(
                name="gpt-5-nano",
                provider="openai", 
                model_id="gpt-5-nano",
                max_tokens=2048,
                temperature=0.7
            ),
            "claude-opus-4-1-20250805": ModelConfig(
                name="claude-opus-4-1-20250805",
                provider="anthropic",
                model_id="claude-opus-4-1-20250805",
                max_tokens=2048,
                temperature=0.7
            ),
            "claude-sonnet-4-20250514": ModelConfig(
                name="claude-sonnet-4-20250514",
                provider="anthropic",
                model_id="claude-sonnet-4-20250514",
                max_tokens=2048,
                temperature=0.7
            ),
            "claude-3-haiku-20240307": ModelConfig(
                name="claude-3-haiku-20240307",
                provider="anthropic",
                model_id="claude-3-haiku-20240307",
                max_tokens=2048,
                temperature=0.7
            ),
            "gemini-2.5-pro": ModelConfig(
                name="gemini-2.5-pro",
                provider="google",
                model_id="gemini/gemini-2.5-pro",
                max_tokens=2048,
                temperature=0.7
            ),
            "gemini-2.5-flash": ModelConfig(
                name="gemini-2.5-flash",
                provider="google",
                model_id="gemini/gemini-2.5-flash",
                max_tokens=2048,
                temperature=0.7
            ),
            "gemini-2.5-flash-lite": ModelConfig(
                name="gemini-2.5-flash-lite",
                provider="google",
                model_id="gemini/gemini-2.5-flash-lite",
                max_tokens=2048,
                temperature=0.7
            ),
            "llama-4-maverick-17b-128e-instruct-fp8": ModelConfig(
                name="llama-4-maverick-17b-128e-instruct-fp8",
                provider="openai",
                model_id="meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
                max_tokens=2048,
                temperature=0.7
            ),
            "llama-3.3-70b-instruct-turbo": ModelConfig(
                name="llama-3.3-70b-instruct-turbo",
                provider="openai",
                model_id="llama/Llama-3.3-70B-Instruct-Turbo",
                max_tokens=2048,
                temperature=0.7
            ),
            "qwen3-4b": ModelConfig(
                name="qwen3-4b",
                provider="ollama",
                model_id="qwen3:4b",
                base_url="http://localhost:11434",
                max_tokens=2048,
                temperature=0.7
            ),
            "gpt-oss-latest": ModelConfig(
                name="gpt-oss-latest",
                provider="ollama",
                model_id="gpt-oss:latest",
                base_url="http://localhost:11434",
                max_tokens=2048,
                temperature=0.7
            ),
            "qwen3-30b": ModelConfig(
                name="qwen3-30b",
                provider="ollama",
                model_id="qwen3:30b",
                base_url="http://localhost:11434",
                max_tokens=2048,
                temperature=0.7
            ),
            "glm-4.5": ModelConfig(
                name="glm-4.5",
                provider="zhipuai",
                model_id="glm-4.5",
                max_tokens=2048,
                temperature=0.7
            ),
            "glm-4.5-air": ModelConfig(
                name="glm-4.5-air",
                provider="zhipuai", 
                model_id="glm-4.5-air",
                max_tokens=2048,
                temperature=0.7
            ),
            "glm-4.5-flash": ModelConfig(
                name="glm-4.5-flash",
                provider="zhipuai",
                model_id="glm-4.5-flash",
                max_tokens=2048,
                temperature=0.7
            ),
            # Qwen via LiteLLM (OpenAI-compatible)
            "qwen3-235b-a22b-thinking-2507": ModelConfig(
                name="qwen3-235b-a22b-thinking-2507",
                provider="qwen",
                model_id="qwen3-235b-a22b-thinking-2507",
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            "qwen3-coder-480b-a35b-instruct": ModelConfig(
                name="qwen3-coder-480b-a35b-instruct",
                provider="qwen",
                model_id="qwen3-coder-480b-a35b-instruct",
                base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            # DeepSeek via OpenAI-compatible
            "deepseek-chat": ModelConfig(
                name="deepseek-chat",
                provider="deepseek",
                model_id="deepseek-chat",
                base_url="https://api.deepseek.com/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            "deepseek-reasoner": ModelConfig(
                name="deepseek-reasoner",
                provider="deepseek",
                model_id="deepseek-reasoner",
                base_url="https://api.deepseek.com/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            # Kimi (Moonshot) via OpenAI-compatible
            "kimi-k2-turbo-preview": ModelConfig(
                name="kimi-k2-turbo-preview",
                provider="moonshot",
                model_id="kimi-k2-turbo-preview",
                base_url="https://api.moonshot.cn/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            "kimi-k2-0711-preview": ModelConfig(
                name="kimi-k2-0711-preview",
                provider="moonshot",
                model_id="kimi-k2-0711-preview",
                base_url="https://api.moonshot.cn/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            # xAI Grok via OpenAI-compatible
            "grok-4-0709": ModelConfig(
                name="grok-4-0709",
                provider="xai",
                model_id="grok-4-0709",
                base_url="https://api.x.ai/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            "grok-3": ModelConfig(
                name="grok-3",
                provider="xai",
                model_id="grok-3",
                base_url="https://api.x.ai/v1",
                max_tokens=2048,
                temperature=0.7
            ),
            "grok-3-mini": ModelConfig(
                name="grok-3-mini",
                provider="xai",
                model_id="grok-3-mini",
                base_url="https://api.x.ai/v1",
                max_tokens=2048,
                temperature=0.7
            )
        }
        self.save_models()
    
    def save_models(self):
        """Save model configurations to file."""
        try:
            models_data = {
                name: config.model_dump()
                for name, config in self.models.items()
            }
            with open(self.settings.models_file, 'w') as f:
                json.dump(models_data, f, indent=2)
        except Exception as e:
            print(f"Error saving models config: {e}")
    
    def add_model(self, config: ModelConfig):
        """Add a new model configuration."""
        self.models[config.name] = config
        self.save_models()
    
    def remove_model(self, name: str) -> bool:
        """Remove a model configuration."""
        if name in self.models:
            del self.models[name]
            self.save_models()
            return True
        return False
    
    def get_model(self, name: str) -> Optional[ModelConfig]:
        """Get a model configuration by name."""
        return self.models.get(name)
    
    def list_models(self) -> List[str]:
        """List all available model names."""
        return list(self.models.keys())
    
    def set_api_key(self, model_name: str, api_key: str) -> bool:
        """Set API key for a model."""
        if model_name in self.models:
            self.models[model_name].api_key = api_key
            self.save_models()
            return True
        return False
    
    def get_ollama_models(self) -> List[str]:
        """Get list of available Ollama models."""
        ollama_models = []
        for name, config in self.models.items():
            if config.provider == "ollama":
                ollama_models.append(name)
        return ollama_models
    
    def get_api_models(self) -> List[str]:
        """Get list of models that require API keys."""
        api_models = []
        for name, config in self.models.items():
            if config.provider in ["openai", "anthropic", "zhipuai", "qwen", "deepseek", "moonshot"]:
                api_models.append(name)
        return api_models

# Global config manager instance
config_manager = ConfigManager()