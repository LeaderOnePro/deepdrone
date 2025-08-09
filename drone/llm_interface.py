"""
LLM Interface for DeepDrone supporting LiteLLM and Ollama.
"""

import os
from typing import List, Dict, Any, Optional
import json
import logging

from .config import ModelConfig

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMInterface:
    """Interface for interacting with various LLM providers."""
    
    def __init__(self, model_config: ModelConfig):
        self.model_config = model_config
        self._setup_client()
    
    def _setup_client(self):
        """Set up the appropriate client based on model provider."""
        if self.model_config.provider == "ollama":
            self._setup_ollama()
        elif self.model_config.provider == "zhipuai":
            self._setup_zhipuai()
        elif self.model_config.provider in ["qwen", "deepseek"]:
            # Use OpenAI-compatible HTTP for providers with OpenAI-style endpoints
            self._setup_openai_compatible()
        else:
            self._setup_litellm()
    
    def _setup_ollama(self):
        """Set up Ollama client."""
        try:
            import ollama
            self.client = ollama
            self.client_type = "ollama"
            
            # Test connection
            try:
                models = self.client.list()
                available_models = models.models if hasattr(models, 'models') else []
                logger.info(f"Connected to Ollama. Available models: {len(available_models)}")
                
                # Check if the requested model is available
                model_names = [model.model for model in available_models]
                if self.model_config.model_id not in model_names:
                    logger.warning(f"Model '{self.model_config.model_id}' not found locally. Available models: {model_names}")
                    
            except Exception as e:
                logger.warning(f"Could not connect to Ollama: {e}")
                logger.info("Make sure Ollama is running: ollama serve")
                
        except ImportError:
            raise ImportError("Ollama package not installed. Install with: pip install ollama")
    
    def _setup_zhipuai(self):
        """Set up ZhipuAI client using direct API calls."""
        try:
            import requests
            import time
            import jwt
            
            self.client = requests
            self.client_type = "zhipuai"
            
            # Validate API key
            if not self.model_config.api_key or self.model_config.api_key == "local":
                raise ValueError("ZhipuAI requires a valid API key")
            
            # Store API key for JWT generation
            self.zhipuai_api_key = self.model_config.api_key
            
            logger.info(f"Set up ZhipuAI direct client for {self.model_config.model_id}")
            
        except ImportError as e:
            missing_packages = []
            if "requests" in str(e):
                missing_packages.append("requests")
            if "jwt" in str(e):
                missing_packages.append("PyJWT")
            
            if missing_packages:
                raise ImportError(f"Missing packages for ZhipuAI: {', '.join(missing_packages)}. Install with: pip install {' '.join(missing_packages)}")
            else:
                raise e
    
    def _setup_litellm(self):
        """Set up LiteLLM client."""
        try:
            import litellm
            
            # Set API key in environment if provided (skip for local/placeholder keys)
            if self.model_config.api_key and self.model_config.api_key != "local":
                if self.model_config.provider == "openai":
                    os.environ["OPENAI_API_KEY"] = self.model_config.api_key
                elif self.model_config.provider == "anthropic":
                    os.environ["ANTHROPIC_API_KEY"] = self.model_config.api_key
                elif self.model_config.provider == "mistral":
                    os.environ["MISTRAL_API_KEY"] = self.model_config.api_key
                elif self.model_config.provider == "vertex_ai":
                    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = self.model_config.api_key
                elif self.model_config.provider == "zhipuai":
                    os.environ["ZHIPUAI_API_KEY"] = self.model_config.api_key
                elif self.model_config.provider == "qwen":
                    # DashScope OpenAI 兼容通道使用 OPENAI_API_KEY 头
                    os.environ["OPENAI_API_KEY"] = self.model_config.api_key
            
            # Set base URL if provided
            if self.model_config.base_url:
                litellm.api_base = self.model_config.base_url
            
            self.client = litellm
            self.client_type = "litellm"
            
            logger.info(f"Set up LiteLLM for {self.model_config.provider}")
            
        except ImportError:
            raise ImportError("LiteLLM package not installed. Install with: pip install litellm")

    def _setup_openai_compatible(self):
        """Set up a direct OpenAI-compatible HTTP client (e.g., DashScope/Qwen)."""
        try:
            import requests

            if not self.model_config.api_key or self.model_config.api_key == "local":
                raise ValueError("OpenAI-compatible provider requires a valid API key")

            self.client = requests
            self.client_type = "openai_compatible"

            # Determine base URL
            base_url = self.model_config.base_url
            if not base_url:
                # Provide sensible defaults if not configured
                if self.model_config.provider == "qwen":
                    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
                elif self.model_config.provider == "deepseek":
                    base_url = "https://api.deepseek.com/v1"
                else:
                    raise ValueError("Base URL required for OpenAI-compatible provider")

            self.openai_base_url = base_url.rstrip("/")
            self.openai_api_key = self.model_config.api_key

            logger.info(f"Set up OpenAI-compatible client for {self.model_config.provider} at {self.openai_base_url}")

        except ImportError:
            raise ImportError("Missing 'requests' package. Install with: pip install requests")
    
    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Send chat messages and get response."""
        try:
            if self.client_type == "ollama":
                return self._chat_ollama(messages)
            elif self.client_type == "zhipuai":
                return self._chat_zhipuai(messages)
            elif self.client_type == "openai_compatible":
                return self._chat_openai_compatible(messages)
            else:
                return self._chat_litellm(messages)
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return f"Error communicating with {self.model_config.provider}: {str(e)}"
    
    def _chat_ollama(self, messages: List[Dict[str, str]]) -> str:
        """Chat using Ollama."""
        try:
            # Convert messages to Ollama format
            prompt = self._messages_to_prompt(messages)
            
            response = self.client.generate(
                model=self.model_config.model_id,
                prompt=prompt,
                options={
                    'temperature': self.model_config.temperature,
                    'num_predict': self.model_config.max_tokens,
                }
            )
            
            return response['response']
            
        except Exception as e:
            error_str = str(e).lower()
            
            if "model not found" in error_str or "model does not exist" in error_str:
                available_models = []
                try:
                    models = self.client.list()
                    available_models = [m.model for m in models.models] if hasattr(models, 'models') else []
                except:
                    pass
                
                error_msg = f"❌ Model '{self.model_config.model_id}' not found in Ollama.\n\n"
                
                if available_models:
                    error_msg += f"📋 Available local models:\n"
                    for model in available_models:
                        error_msg += f"  • {model}\n"
                    error_msg += f"\n💡 To install {self.model_config.model_id}, run:\n"
                    error_msg += f"   ollama pull {self.model_config.model_id}\n"
                else:
                    error_msg += "📭 No models found locally.\n\n"
                    error_msg += f"💡 To install {self.model_config.model_id}, run:\n"
                    error_msg += f"   ollama pull {self.model_config.model_id}\n\n"
                    error_msg += "🎯 Popular models to try:\n"
                    error_msg += "   • ollama pull llama3.1\n"
                    error_msg += "   • ollama pull codestral\n"
                    error_msg += "   • ollama pull qwen2.5-coder\n"
                
                return error_msg
            
            elif "connection" in error_str or "refused" in error_str:
                return "❌ Cannot connect to Ollama.\n\n💡 Make sure Ollama is running:\n   ollama serve\n\n📥 Download Ollama from: https://ollama.com/download"
            
            return f"❌ Ollama error: {str(e)}"

    def _chat_openai_compatible(self, messages: List[Dict[str, str]]) -> str:
        """Chat using OpenAI-compatible HTTP API (e.g., DashScope/Qwen)."""
        try:
            url = f"{self.openai_base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json",
            }
            data = {
                "model": self.model_config.model_id,
                "messages": messages,
                "max_tokens": self.model_config.max_tokens,
                "temperature": self.model_config.temperature,
                "stream": False,
            }

            resp = self.client.post(url, headers=headers, json=data, timeout=30)

            if resp.status_code != 200:
                msg = f"OpenAI-compatible API error (status {resp.status_code})"
                try:
                    j = resp.json()
                    if isinstance(j, dict) and "error" in j:
                        err = j["error"]
                        if isinstance(err, dict) and "message" in err:
                            msg += f": {err['message']}"
                except Exception:
                    msg += f": {resp.text}"
                return f"❌ {msg}"

            j = resp.json()
            if not isinstance(j, dict) or "choices" not in j or not j.get("choices"):
                return "❌ Invalid response format from OpenAI-compatible API"

            return j["choices"][0]["message"]["content"]

        except Exception as e:
            s = str(e).lower()
            if "api key" in s or "unauthorized" in s:
                return "❌ API key error. Please check your API key"
            if "timeout" in s:
                return "❌ API timeout. Please try again."
            if "connection" in s or "failed to establish" in s:
                return "❌ Cannot connect to API. Please check your network."
            return f"❌ OpenAI-compatible error: {str(e)}"
    
    def _generate_zhipuai_token(self) -> str:
        """Generate JWT token for ZhipuAI API authentication."""
        try:
            import jwt
            import time
            
            # Split API key (format: "id.secret")
            api_key_parts = self.zhipuai_api_key.split(".")
            if len(api_key_parts) != 2:
                raise ValueError("Invalid ZhipuAI API key format. Expected format: 'id.secret'")
            
            api_key_id, api_key_secret = api_key_parts
            
            # Create JWT payload according to ZhipuAI documentation
            # Reference: https://open.bigmodel.cn/dev/api#nosdk
            current_time = int(time.time())
            payload = {
                "iss": api_key_id,
                "exp": current_time + 3600,  # Token expires in 1 hour
                "iat": current_time,
                "api_key": api_key_id
            }
            
            # Generate JWT token with header
            headers = {
                "alg": "HS256",
                "sign_type": "SIGN"
            }
            
            token = jwt.encode(payload, api_key_secret, algorithm="HS256", headers=headers)
            
            # Ensure token is a string (PyJWT might return bytes in some versions)
            if isinstance(token, bytes):
                token = token.decode('utf-8')
            
            logger.info(f"Generated JWT token for ZhipuAI (expires in 1 hour)")
            return token
            
        except Exception as e:
            logger.error(f"Failed to generate ZhipuAI token: {e}")
            raise e
    
    def _chat_zhipuai(self, messages: List[Dict[str, str]]) -> str:
        """Chat using ZhipuAI direct API."""
        try:
            # Generate authentication token
            token = self._generate_zhipuai_token()
            
            # Prepare API request
            url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Prepare request data
            data = {
                "model": self.model_config.model_id,
                "messages": messages,
                "max_tokens": self.model_config.max_tokens,
                "temperature": self.model_config.temperature,
                "stream": False
            }
            
            logger.info(f"Sending request to ZhipuAI API with model: {self.model_config.model_id}")
            
            # Make API request
            response = self.client.post(url, headers=headers, json=data, timeout=30)
            
            # Check response status
            if response.status_code != 200:
                error_msg = f"ZhipuAI API error (status {response.status_code})"
                try:
                    error_data = response.json()
                    if "error" in error_data:
                        error_msg += f": {error_data['error'].get('message', 'Unknown error')}"
                except:
                    error_msg += f": {response.text}"
                
                logger.error(error_msg)
                return f"❌ {error_msg}"
            
            # Parse response
            response_data = response.json()
            
            if "choices" not in response_data or not response_data["choices"]:
                logger.error("Invalid response format from ZhipuAI API")
                return "❌ Invalid response format from ZhipuAI API"
            
            # Extract message content
            content = response_data["choices"][0]["message"]["content"]
            logger.info("Successfully received response from ZhipuAI")
            
            return content
            
        except Exception as e:
            error_str = str(e).lower()
            
            if "invalid api key" in error_str or "authentication" in error_str:
                return "❌ ZhipuAI API key error. Please check your API key format (should be 'id.secret')"
            elif "quota" in error_str or "billing" in error_str:
                return "❌ ZhipuAI quota exceeded. Please check your account balance."
            elif "timeout" in error_str:
                return "❌ ZhipuAI API timeout. Please try again."
            elif "connection" in error_str:
                return "❌ Cannot connect to ZhipuAI API. Please check your network connection."
            
            logger.error(f"ZhipuAI API error: {e}")
            return f"❌ ZhipuAI error: {str(e)}"
    
    def _chat_litellm(self, messages: List[Dict[str, str]]) -> str:
        """Chat using LiteLLM."""
        try:
            response = self.client.completion(
                model=self.model_config.model_id,
                messages=messages,
                max_tokens=self.model_config.max_tokens,
                temperature=self.model_config.temperature,
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            if "api key" in str(e).lower():
                return f"API key error for {self.model_config.provider}. Please set your API key with: deepdrone models set-key {self.model_config.name}"
            elif "quota" in str(e).lower() or "billing" in str(e).lower():
                return f"Billing/quota error for {self.model_config.provider}. Please check your account."
            elif "model" in str(e).lower() and "not found" in str(e).lower():
                return f"Model '{self.model_config.model_id}' not found for {self.model_config.provider}."
            
            raise e
    
    def _messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Convert messages to a single prompt for models that don't support chat format."""
        prompt_parts = []
        
        for message in messages:
            role = message["role"]
            content = message["content"]
            
            if role == "system":
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"Human: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        prompt_parts.append("Assistant: ")
        
        return "\n\n".join(prompt_parts)
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to the LLM service."""
        try:
            test_messages = [
                {"role": "user", "content": "Hello, please respond with 'Connection test successful'"}
            ]
            
            response = self.chat(test_messages)
            
            return {
                "success": True,
                "response": response,
                "provider": self.model_config.provider,
                "model": self.model_config.model_id
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "provider": self.model_config.provider,
                "model": self.model_config.model_id
            }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model."""
        info = {
            "name": self.model_config.name,
            "provider": self.model_config.provider,
            "model_id": self.model_config.model_id,
            "max_tokens": self.model_config.max_tokens,
            "temperature": self.model_config.temperature,
            "client_type": self.client_type,
        }
        
        if self.model_config.base_url:
            info["base_url"] = self.model_config.base_url
        
        return info