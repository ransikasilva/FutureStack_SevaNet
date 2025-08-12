from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
import uvicorn
import logging

from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=config("PROJECT_NAME", default="SevaNet Issue Reporting API"),
    version="1.0.0",
    description="API for reporting and managing civic issues in government portal"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "message": "SevaNet Issue Reporting API", 
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/test")
def test_endpoint():
    """Test endpoint that doesn't require database"""
    return {
        "message": "API is working!",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": "/api/v1",
            "analyze_image": "/api/v1/issues/analyze-image"
        },
        "status": "ready"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config("DEBUG", default=False, cast=bool)
    )