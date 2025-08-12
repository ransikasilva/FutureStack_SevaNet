from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
import uvicorn

from app.api.v1.api import api_router
from app.database import engine
from app.models import issues, authorities

# Create database tables
issues.Base.metadata.create_all(bind=engine)
authorities.Base.metadata.create_all(bind=engine)

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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config("DEBUG", default=False, cast=bool)
    )