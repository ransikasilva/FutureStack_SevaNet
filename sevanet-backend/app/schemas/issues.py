from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.issues import IssueStatus, SeverityLevel

# Base schema for Issue
class IssueBase(BaseModel):
    category: str
    title: Optional[str] = None
    description: str
    location: str
    severity_level: Optional[int] = 1

# Schema for creating an issue
class IssueCreate(IssueBase):
    user_id: UUID

# Schema for updating an issue
class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[IssueStatus] = None
    severity_level: Optional[int] = None
    assigned_authority_id: Optional[UUID] = None

# Schema for response
class Issue(IssueBase):
    id: UUID
    user_id: UUID
    status: IssueStatus
    image_url: Optional[str] = None
    assigned_authority_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema for authority information
class AuthorityBase(BaseModel):
    name: str
    department: Optional[str] = None
    category: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_emergency_service: Optional[bool] = False
    coverage_area: Optional[str] = None

class Authority(AuthorityBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Schema for issue categories
class IssueCategory(BaseModel):
    name: str
    description: str
    icon: Optional[str] = None

# Schema for AI analysis (dummy implementation)
class AIAnalysis(BaseModel):
    issue_id: UUID
    severity_assessment: str
    recommended_authority: Optional[str] = None
    priority_score: float
    estimated_resolution_time: str
    analysis_summary: str