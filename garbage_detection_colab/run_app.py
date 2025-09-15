#!/usr/bin/env python3
"""
Launch script for SWACH Garbage Detection Streamlit App
"""

import subprocess
import sys
import os

def main():
    print("🚀 Starting SWACH - Smart Garbage Detection App...")
    print("📝 Make sure you have installed the requirements:")
    print("   pip install -r requirements.txt")
    print()
    
    # Check if streamlit_app.py exists
    if not os.path.exists("streamlit_app.py"):
        print("❌ Error: streamlit_app.py not found!")
        print("   Make sure you're in the correct directory.")
        return
    
    # Check if model file exists
    model_files = [f for f in os.listdir('.') if f.endswith('.pt')]
    if not model_files:
        print("❌ Error: No .pt model files found!")
        print("   Make sure your trained model (e.g., bestyolov8s.pt) is in this directory.")
        return
    
    print(f"✅ Found model files: {', '.join(model_files)}")
    print("🌐 Launching Streamlit app...")
    
    # Try to find an available port
    import socket
    def find_free_port(start_port=8501):
        for port in range(start_port, start_port + 10):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('localhost', port))
                    return port
            except OSError:
                continue
        return 8501  # fallback
    
    port = find_free_port()
    print(f"   Using port: {port}")
    print(f"   The app will open in your default web browser.")
    print(f"   If not, go to: http://localhost:{port}")
    print()
    
    try:
        # Launch Streamlit with available port
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", "streamlit_app.py",
            "--server.headless", "false",
            "--server.port", str(port),
            "--browser.gatherUsageStats", "false"
        ])
    except KeyboardInterrupt:
        print("\n👋 App stopped by user.")
    except Exception as e:
        print(f"❌ Error launching app: {e}")
        print(f"💡 Try running manually: streamlit run streamlit_app.py --server.port {port + 1}")

if __name__ == "__main__":
    main() 