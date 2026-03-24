#!/usr/bin/env python3
"""
DeepDrone Web Interface Launcher
Starts both the FastAPI backend and serves the React frontend
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        print("✅ Backend dependencies found")
    except ImportError as e:
        print(f"❌ Missing backend dependencies: {e}")
        print("Please run: pip install -r requirements.txt")
        return False
    
    return True

def check_frontend():
    """Check if frontend is built"""
    frontend_build = Path("frontend/build")
    if frontend_build.exists():
        print("✅ Frontend build found")
        return True
    else:
        print("⚠️  Frontend not built")
        return False

def check_npm():
    """Check if npm is available"""
    try:
        subprocess.run(["npm", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def build_frontend():
    """Build the React frontend"""
    print("🔨 Building frontend...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    # Check if npm is available
    if not check_npm():
        print("❌ npm not found in PATH")
        print("💡 Please ensure Node.js and npm are installed and available in your PATH")
        print("💡 You may need to restart your terminal or activate the correct environment")
        print("💡 Alternatively, you can manually build the frontend:")
        print("   cd frontend")
        print("   npm install")
        print("   npm run build")
        return False
    
    # Check if node_modules exists
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        print("📦 Installing frontend dependencies...")
        try:
            subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        except subprocess.CalledProcessError:
            print("❌ Failed to install frontend dependencies")
            print("Please make sure Node.js and npm are installed")
            return False
        except FileNotFoundError:
            print("❌ npm command not found")
            print("Please make sure Node.js and npm are installed and in your PATH")
            return False
    
    # Build the frontend
    try:
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
        print("✅ Frontend built successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to build frontend")
        return False
    except FileNotFoundError:
        print("❌ npm command not found")
        print("Please make sure Node.js and npm are installed and in your PATH")
        return False

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting DeepDrone Web Server...")
    print("📡 Server will be available at: http://localhost:8000")
    print("🎮 Web interface will open automatically")
    print("\nPress Ctrl+C to stop the server\n")
    
    # Wait a moment then open browser
    def open_browser():
        time.sleep(2)
        webbrowser.open("http://localhost:8000")
    
    import threading
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start the server
    try:
        import uvicorn
        uvicorn.run("web_api:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

def main():
    """Main launcher function"""
    print("🚁 DeepDrone Web Interface Launcher")
    print("=" * 40)
    
    # Check backend dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check and build frontend if needed
    if not check_frontend():
        print("🔨 Frontend needs to be built")
        if input("Build frontend now? (y/n): ").lower().startswith('y'):
            if not build_frontend():
                print("❌ Cannot start without frontend")
                sys.exit(1)
        else:
            print("⚠️  Starting without frontend (API only)")
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()