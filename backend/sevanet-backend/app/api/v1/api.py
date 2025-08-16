from fastapi import APIRouter

from app.api.v1.endpoints import issues, analytics

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(issues.router, prefix="/issues", tags=["issues"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])