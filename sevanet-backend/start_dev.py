#!/usr/bin/env python3
"""
Development startup script for SevaNet Backend
This script starts the API server without requiring database connectivity
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def main():
    """Start the development server"""
    print("Starting SevaNet Issue Reporting API (Development Mode)")
    print("=" * 60)
    
    # Set development environment
    os.environ['DEBUG'] = 'True'
    
    # Check for Gemini API key
    google_api_key = os.environ.get('GOOGLE_API_KEY', '')
    if not google_api_key or google_api_key == 'your-gemini-api-key-here':
        print("WARNING: GOOGLE_API_KEY not set")
        print("   AI analysis will return mock responses")
        print("   Get your free key from: https://makersuite.google.com/app/apikey")
        print()
    else:
        print("Google Gemini API key configured")
        print()
    
    print("Server will be available at:")
    print("   * API: http://localhost:8000")
    print("   * Docs: http://localhost:8000/docs")
    print("   * Health: http://localhost:8000/health")
    print()
    print("Auto-reload enabled for development")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()