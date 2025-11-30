"""
Interactive setup and chat interface for DeepDrone.
"""

import os
import sys
import asyncio
from typing import Dict, Optional, Tuple, List
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.prompt import Prompt, Confirm
from rich.table import Table
from rich.live import Live
from rich.layout import Layout
from rich.spinner import Spinner
from prompt_toolkit import prompt
from prompt_toolkit.shortcuts import radiolist_dialog, input_dialog, message_dialog
from prompt_toolkit.styles import Style
import getpass

from .config import ModelConfig
from .drone_chat_interface import DroneChatInterface

console = Console()

# Global variable to store Ollama base URL
ollama_base_url = "http://localhost:11434"

# Provider configurations
PROVIDERS = {
    "OpenAI": {
        "name": "openai",
        "models": ["gpt-5.1", "gpt-5.1-codex", "gpt-5.1-codex-mini", "gpt-5", "gpt-5-mini", "gpt-5-nano"],
        "api_key_url": "https://platform.openai.com/api-keys",
        "description": "GPT models from OpenAI"
    },
    "Anthropic": {
        "name": "anthropic",
        "models": ["claude-opus-4-5-20251101", "claude-sonnet-4-5-20250929", "claude-3-haiku-20240307"],
        "api_key_url": "https://console.anthropic.com/",
        "description": "Claude models from Anthropic"
    },
    "Google": {
        "name": "google",
        "models": ["gemini/gemini-3-pro-preview", "gemini/gemini-2.5-pro", "gemini/gemini-2.5-flash", "gemini/gemini-2.5-flash-lite"],
        "api_key_url": "https://aistudio.google.com/app/apikey",
        "description": "Gemini models from Google AI Studio"
    },
    "Qwen": {
        "name": "qwen",
        "models": ["qwen3-max", "qwen3-235b-a22b-thinking-2507", "qwen3-235b-a22b-instruct-2507", "qwen3-coder-plus", "qwen3-next-80b-a3b-thinking", "qwen3-next-80b-a3b-instruct"],
        "api_key_url": "https://bailian.console.aliyun.com/ai/ak",
        "description": "Qwen3 models via DashScope (OpenAI-compatible)"
    },
    "xAI": {
        "name": "xai",
        "models": ["grok-4-1-fast-reasoning", "grok-4-1-fast-non-reasoning", "grok-4-0709"],
        "api_key_url": "https://console.x.ai/",
        "description": "Grok models from xAI (OpenAI-compatible)"
    },
    "ZhipuAI": {
        "name": "zhipuai",
        "models": ["glm-4.6", "glm-4.5-air", "glm-4.5-flash"],
        "api_key_url": "https://open.bigmodel.cn/usercenter/apikeys",
        "description": "GLM models from ZhipuAI"
    },
    "DeepSeek": {
        "name": "deepseek",
        "models": ["deepseek-chat", "deepseek-reasoner"],
        "api_key_url": "https://platform.deepseek.com/",
        "description": "DeepSeek models (OpenAI-compatible)"
    },
    "Kimi": {
        "name": "moonshot",
        "models": ["kimi-k2-thinking-turbo", "kimi-k2-turbo-preview", "kimi-k2-thinking", "kimi-k2-0905-preview"],
        "api_key_url": "https://platform.moonshot.cn/console/api-keys",
        "description": "Kimi models (OpenAI-compatible)"
    },
    "LongCat": {
        "name": "longcat",
        "models": ["LongCat-Flash-Chat", "LongCat-Flash-Thinking"],
        "api_key_url": "https://longcat.chat/platform/api_keys",
        "description": "LongCat Flash models (OpenAI-compatible)"
    },
    "Meta": {
        "name": "openai",  # Using OpenAI format for Llama models via providers
        "models": ["meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", "llama/Llama-3.3-70B-Instruct-Turbo"],
        "api_key_url": "https://together.ai/ or https://replicate.com/",
        "description": "Llama models from Meta (via Together.ai/Replicate)"
    },
    "Ollama": {
        "name": "ollama",
        "models": ["qwen3:4b", "gpt-oss:latest", "qwen3:30b"],
        "api_key_url": "https://ollama.ai/ (No API key needed - supports local/network)",
        "description": "Local/Network models via Ollama (supports custom server URL)"
    }
}

def show_welcome_banner():
    """Display the welcome banner."""
    banner = """
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║           🚁 DEEPDRONE AI CONTROL SYSTEM 🚁              ║
║                                                          ║
║        Advanced Drone Control with AI Integration        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    """
    
    console.print(Panel(
        Align.center(Text(banner.strip(), style="bold green")),
        border_style="bright_green",
        padding=(1, 2)
    ))

def select_provider() -> Optional[Tuple[str, Dict]]:
    """Interactive provider selection."""
    console.print("\n[bold cyan]📡 Select AI Provider[/bold cyan]\n")
    
    # Create provider table for display
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("№", style="bright_green", width=3)
    table.add_column("Provider", style="cyan", width=12)
    table.add_column("Description", style="white")
    table.add_column("Example Models", style="yellow")
    
    provider_list = list(PROVIDERS.items())
    
    for i, (name, config) in enumerate(provider_list, 1):
        example_models = ", ".join(config["models"][:2])
        if len(config["models"]) > 2:
            example_models += "..."
        table.add_row(str(i), name, config["description"], example_models)
    
    console.print(table)
    console.print()
    
    try:
        from rich.prompt import IntPrompt
        
        choice = IntPrompt.ask(
            "Select provider by number",
            choices=[str(i) for i in range(1, len(provider_list) + 1)],
            default=1
        )
        
        provider_name, provider_config = provider_list[choice - 1]
        return provider_name, provider_config
        
    except KeyboardInterrupt:
        console.print("\n[yellow]Selection cancelled[/yellow]")
        return None

def get_available_ollama_models(base_url: str = "http://localhost:11434") -> List[str]:
    """Get list of available Ollama models from specified server."""
    try:
        import ollama
        # Create client with custom base URL
        client = ollama.Client(host=base_url)
        models = client.list()
        # The models are returned as Model objects with a 'model' attribute
        return [model.model for model in models.models] if hasattr(models, 'models') else []
    except ImportError:
        return []
    except Exception as e:
        # Connection failed, return empty list
        return []

def install_ollama_model(model_name: str, base_url: str = "http://localhost:11434") -> bool:
    """Install an Ollama model on specified server."""
    try:
        import ollama
        console.print(f"[yellow]📥 Installing {model_name} on {base_url}... This may take a few minutes.[/yellow]")
        
        # Create client with custom base URL
        client = ollama.Client(host=base_url)
        
        with Live(
            Spinner("dots", text=f"Installing {model_name}..."),
            console=console,
            transient=True
        ) as live:
            client.pull(model_name)
            live.stop()
        
        console.print(f"[green]✅ Successfully installed {model_name}[/green]")
        return True
    except ImportError:
        console.print("[red]❌ Ollama package not installed[/red]")
        return False
    except Exception as e:
        console.print(f"[red]❌ Failed to install {model_name}: {e}[/red]")
        return False

def get_model_name(provider_name: str, provider_config: Dict) -> Optional[str]:
    """Get model name from user."""
    console.print(f"\n[bold cyan]🤖 Select Model for {provider_name}[/bold cyan]\n")
    
    # Special handling for Ollama
    if provider_name.lower() == "ollama":
        # First get the base URL
        console.print(f"\n[bold cyan]🌐 Ollama Server Configuration[/bold cyan]\n")
        console.print("Ollama server options:")
        console.print("  • [green]Local[/green]: [cyan]http://localhost:11434[/cyan] (default)")
        console.print("  • [blue]LAN[/blue]: [cyan]http://192.168.1.100:11434[/cyan] (replace with your server IP)")
        console.print("  • [blue]Internet[/blue]: [cyan]https://your-domain.com:11434[/cyan] (if exposed to internet)")
        console.print("\n[dim]Make sure Ollama server is running with: ollama serve[/dim]")
        console.print("[dim]For network access, start with: OLLAMA_HOST=0.0.0.0 ollama serve[/dim]\n")
        
        from rich.prompt import Prompt
        
        # Provide numbered options for common URLs
        console.print("Quick options:")
        console.print("  1. Local server (default)")
        console.print("  2. Custom URL")
        console.print()
        
        choice = Prompt.ask(
            "Select option or enter custom URL",
            default="1"
        )
        
        # Store the base_url for later use
        global ollama_base_url
        
        if choice == "1" or choice.lower() == "local":
            ollama_base_url = "http://localhost:11434"
        elif choice == "2" or choice.lower() == "custom":
            custom_url = Prompt.ask(
                "Enter custom Ollama server URL",
                default="http://localhost:11434"
            )
            ollama_base_url = custom_url.strip() if custom_url and custom_url.strip() else "http://localhost:11434"
        elif choice.startswith("http://") or choice.startswith("https://"):
            # User directly entered a URL
            ollama_base_url = choice.strip()
        else:
            # Default to local if invalid input
            ollama_base_url = "http://localhost:11434"
            console.print(f"[yellow]Invalid input, using default: {ollama_base_url}[/yellow]")
        
        console.print(f"\n[dim]Using Ollama server: {ollama_base_url}[/dim]")
        console.print(f"\n[bold cyan]🤖 Select Model for {provider_name}[/bold cyan]\n")
        
        # Check if Ollama is running and get local models
        local_models = get_available_ollama_models(ollama_base_url)
        
        if local_models:
            console.print("[bold green]✅ Ollama models found:[/bold green]")
            for i, model in enumerate(local_models, 1):
                console.print(f"  {i}. [green]{model}[/green]")
            
            console.print("\n[bold]Popular models (if not installed):[/bold]")
            start_idx = len(local_models) + 1
            for i, model in enumerate(provider_config["models"], start_idx):
                console.print(f"  {i}. [blue]{model}[/blue] [dim](will be downloaded)[/dim]")
            
            all_options = local_models + provider_config["models"]
            
        else:
            console.print(f"[yellow]⚠️  No models found on {ollama_base_url}[/yellow]")
            if ollama_base_url == "http://localhost:11434":
                console.print("Make sure Ollama is running locally: [cyan]ollama serve[/cyan]")
            else:
                console.print(f"Make sure Ollama server is running on: [cyan]{ollama_base_url}[/cyan]")
                console.print("For network access, start with: [cyan]OLLAMA_HOST=0.0.0.0 ollama serve[/cyan]")
            console.print()
            console.print("[bold]Popular models (will be downloaded):[/bold]")
            all_options = provider_config["models"]
            for i, model in enumerate(all_options, 1):
                console.print(f"  {i}. [blue]{model}[/blue] [dim](will be downloaded)[/dim]")
        
        console.print(f"\n[dim]Download from: {provider_config['api_key_url']}[/dim]\n")
        
        try:
            from rich.prompt import Prompt
            
            result = Prompt.ask(
                "Enter model name or number from list above",
                default="1"
            )
            
            if result:
                # Check if user entered a number (selecting from list)
                try:
                    choice_num = int(result.strip())
                    if 1 <= choice_num <= len(all_options):
                        selected_model = all_options[choice_num - 1]
                        
                        # Check if model needs to be installed
                        if selected_model not in local_models:
                            console.print(f"[yellow]Model '{selected_model}' not found locally.[/yellow]")
                            from rich.prompt import Confirm
                            if Confirm.ask(f"Would you like to install {selected_model}?", default=True):
                                if install_ollama_model(selected_model, ollama_base_url):
                                    return selected_model
                                else:
                                    return None
                            else:
                                console.print("[yellow]Model installation cancelled[/yellow]")
                                return None
                        
                        return selected_model
                except ValueError:
                    pass
                
                # User entered a custom model name
                model_name = result.strip()
                if model_name not in local_models:
                    console.print(f"[yellow]Model '{model_name}' not found locally.[/yellow]")
                    from rich.prompt import Confirm
                    if Confirm.ask(f"Would you like to install {model_name}?", default=True):
                        if install_ollama_model(model_name, ollama_base_url):
                            return model_name
                        else:
                            return None
                    else:
                        console.print("[yellow]Model installation cancelled[/yellow]")
                        return None
                
                return model_name
            
            return None
            
        except KeyboardInterrupt:
            console.print("\n[yellow]Input cancelled[/yellow]")
            return None
    
    else:
        # Standard handling for other providers
        console.print("[bold]Popular models for this provider:[/bold]")
        for i, model in enumerate(provider_config["models"], 1):
            console.print(f"  {i}. [green]{model}[/green]")
        
        console.print(f"\n[dim]Get API key from: {provider_config['api_key_url']}[/dim]\n")
        
        try:
            from rich.prompt import Prompt
            
            result = Prompt.ask(
                "Enter model name or number from list above",
                default="1"
            )
            
            if result:
                # Check if user entered a number (selecting from list)
                try:
                    choice_num = int(result.strip())
                    if 1 <= choice_num <= len(provider_config["models"]):
                        return provider_config["models"][choice_num - 1]
                except ValueError:
                    pass
                
                # Return the entered model name
                return result.strip()
            
            return None
            
        except KeyboardInterrupt:
            console.print("\n[yellow]Input cancelled[/yellow]")
            return None


def get_api_key(provider_name: str, model_name: str) -> Optional[str]:
    """Get API key from user."""
    console.print(f"\n[bold cyan]🔑 API Key for {provider_name}[/bold cyan]\n")
    console.print(f"Model: [green]{model_name}[/green]")
    console.print(f"Provider: [blue]{provider_name}[/blue]\n")
    
    # Ollama doesn't need an API key
    if provider_name.lower() == "ollama":
        console.print("[green]✅ Ollama runs locally - no API key required![/green]")
        console.print("[dim]Make sure Ollama is running: ollama serve[/dim]\n")
        return "local"  # Return a placeholder value
    
    # Provider-specific tips
    if provider_name.lower() == "zhipuai":
        console.print("[yellow]格式提示：请填写以 id.secret 形式的 API Key（示例：abc123.def456）。[/yellow]")
        console.print("[dim]该 Key 将用于生成 JWT 以调用 ZhipuAI API。[/dim]\n")
    elif provider_name.lower() == "qwen":
        console.print("[yellow]提示：Qwen 使用 OpenAI 兼容通道，请填入 DashScope 的 API Key。[/yellow]\n")
    
    try:
        # Use getpass for secure password input (works in all environments)
        api_key = getpass.getpass("Enter your API key (hidden): ")
        
        if api_key and api_key.strip():
            if provider_name.lower() == "zhipuai" and "." not in api_key.strip():
                console.print("[red]❌ 无效的 ZhipuAI API Key，必须为 id.secret 形式[/red]")
                return None
            return api_key.strip()
        
        console.print("[yellow]No API key provided[/yellow]")
        return None
        
    except KeyboardInterrupt:
        console.print("\n[yellow]Input cancelled[/yellow]")
        return None

def test_model_connection(model_config: ModelConfig) -> bool:
    """Test if the model configuration works."""
    console.print(f"\n[yellow]🔍 Testing connection to {model_config.name}...[/yellow]")
    
    try:
        from .llm_interface import LLMInterface
        
        with Live(
            Spinner("dots", text="Testing API connection..."),
            console=console,
            transient=True
        ) as live:
            llm = LLMInterface(model_config)
            result = llm.test_connection()
            
            live.stop()
            
            # Treat textual error responses as failures too
            if result["success"]:
                resp = str(result.get("response", ""))
                lower_resp = resp.lower()
                if any(x in lower_resp for x in ["❌", "error", "badrequest", "unauthorized", "invalid api key"]):
                    console.print(f"[red]❌ Connection failed: {resp[:200]}[/red]\n")
                    return False
                console.print("[green]✅ Connection successful![/green]")
                console.print(f"[dim]Response: {resp[:100]}...[/dim]\n")
                return True
            else:
                console.print(f"[red]❌ Connection failed: {result['error']}[/red]\n")
                return False
                
    except Exception as e:
        console.print(f"[red]❌ Error testing connection: {e}[/red]\n")
        return False

def start_interactive_session():
    """Start the interactive setup and chat session."""
    try:
        # Show welcome banner
        show_welcome_banner()
        
        # Step 1: Select provider
        console.print("[bold]Step 1: Choose your AI provider[/bold]\n")
        provider_result = select_provider()
        if not provider_result:
            console.print("[yellow]Setup cancelled. Goodbye![/yellow]")
            return
        
        provider_name, provider_config = provider_result
        
        # Step 2: Get model name
        console.print(f"[bold]Step 2: Select model for {provider_name}[/bold]")
        model_name = get_model_name(provider_name, provider_config)
        if not model_name:
            console.print("[yellow]Setup cancelled. Goodbye![/yellow]")
            return
        
        # Step 3: Get API key (Ollama base_url already configured in step 2)
        if provider_name.lower() == "ollama":
            console.print("[bold]Step 3: API key (not needed for Ollama)[/bold]")
            console.print("[green]✅ Ollama runs locally - no API key required![/green]")
            console.print(f"[dim]Using server: {ollama_base_url}[/dim]\n")
            api_key = "local"  # Ollama doesn't need API key
            base_url = ollama_base_url
        else:
            console.print("[bold]Step 3: Enter API key[/bold]")
            api_key = get_api_key(provider_name, model_name)
            if not api_key:
                console.print("[yellow]Setup cancelled. Goodbye![/yellow]")
                return
            base_url = None
        
        # Set base URLs for other providers
        if provider_name.lower() == "qwen":
            base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
        elif provider_name.lower() == "longcat":
            base_url = "https://api.longcat.chat/openai/v1"
        
        model_config = ModelConfig(
            name=f"{provider_name.lower()}-session",
            provider=provider_config["name"],
            model_id=model_name,
            api_key=api_key,
            base_url=base_url,
            max_tokens=2048,
            temperature=0.7
        )
        
        # Step 4: Test connection
        console.print("[bold]Step 4: Testing connection[/bold]")
        if not test_model_connection(model_config):
            if not Confirm.ask("Connection test failed. Continue anyway?"):
                console.print("[yellow]Setup cancelled. Goodbye![/yellow]")
                return
        
        # Step 5: Get drone connection string
        console.print("[bold yellow]🚁 Drone Connection Setup[/bold yellow]\n")
        
        # Check if simulator is already running
        import subprocess
        try:
            result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
            if 'mavproxy' in result.stdout.lower() or 'sitl' in result.stdout.lower():
                console.print("[green]✅ Detected running drone simulator![/green]")
                default_connection = "tcp:127.0.0.1:5762"
            else:
                console.print("[yellow]⚠️  No simulator detected[/yellow]")
                default_connection = "tcp:127.0.0.1:5762"
        except:
            default_connection = "tcp:127.0.0.1:5762"
        
        console.print("Connection options:")
        console.print("  • [green]Simulator[/green]: [cyan]tcp:127.0.0.1:5762[/cyan] (default)")
        console.print("  • [blue]Real Drone USB[/blue]: [cyan]/dev/ttyACM0[/cyan] (Linux) or [cyan]COM3[/cyan] (Windows)")
        console.print("  • [blue]Real Drone TCP[/blue]: [cyan]tcp:192.168.1.100:5760[/cyan]")
        console.print("  • [blue]Real Drone UDP[/blue]: [cyan]udp:192.168.1.100:14550[/cyan]\n")
        
        from rich.prompt import Prompt
        connection_string = Prompt.ask(
            "Enter drone connection string",
            default=default_connection
        )
        
        if not connection_string:
            console.print("[yellow]Using default connection: tcp:127.0.0.1:5762[/yellow]")
            connection_string = "tcp:127.0.0.1:5762"
        
        console.print(f"[dim]Will connect to: {connection_string}[/dim]\n")
        
        # Step 6: Start chat
        console.print("[bold green]🚀 Starting DeepDrone chat session...[/bold green]\n")
        
        # Small delay
        import time
        time.sleep(1)
        
        # Start the chat interface with the connection string
        chat_interface = DroneChatInterface(model_config, connection_string)
        chat_interface.start()
        
    except KeyboardInterrupt:
        console.print("\n[yellow]🚁 DeepDrone session interrupted. Goodbye![/yellow]")
        sys.exit(0)
    except Exception as e:
        console.print(f"[red]❌ Error in interactive session: {e}[/red]")
        sys.exit(1)