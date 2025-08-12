from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
import json

from app.database import get_db
from app.schemas.issues import Issue, IssueCreate, IssueUpdate, Authority, IssueCategory, AIAnalysis
from app.crud.issues import issue_crud, authority_crud

router = APIRouter()

# Mock data for categories
MOCK_CATEGORIES = [
    {"name": "roads", "description": "Road damages, potholes, traffic issues", "icon": "road"},
    {"name": "electricity", "description": "Power outages, electrical faults", "icon": "zap"},
    {"name": "water", "description": "Water supply issues, leaks", "icon": "droplet"},
    {"name": "waste", "description": "Garbage collection, waste management", "icon": "trash"},
    {"name": "safety", "description": "Security, crime, emergency issues", "icon": "shield"},
    {"name": "health", "description": "Public health concerns", "icon": "heart"},
    {"name": "environment", "description": "Environmental issues, pollution", "icon": "leaf"},
    {"name": "infrastructure", "description": "Public buildings, facilities", "icon": "building"}
]

# Mock authorities data
MOCK_AUTHORITIES = [
    {
        "id": str(uuid.uuid4()),
        "name": "Road Development Authority",
        "department": "Infrastructure",
        "category": "roads",
        "contact_phone": "+94-11-2691211",
        "contact_email": "info@rda.gov.lk",
        "emergency_contact": "+94-11-2691999",
        "is_emergency_service": False,
        "coverage_area": "National"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Ceylon Electricity Board",
        "department": "Utilities",
        "category": "electricity",
        "contact_phone": "+94-11-2445678",
        "contact_email": "complaints@ceb.lk",
        "emergency_contact": "+94-11-2445999",
        "is_emergency_service": True,
        "coverage_area": "National"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "National Water Supply & Drainage Board",
        "department": "Utilities",
        "category": "water",
        "contact_phone": "+94-11-2446622",
        "contact_email": "info@nwsdb.lk",
        "emergency_contact": "+94-11-2446999",
        "is_emergency_service": False,
        "coverage_area": "National"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Sri Lanka Police",
        "department": "Safety & Security",
        "category": "safety",
        "contact_phone": "+94-11-2421111",
        "contact_email": "complaints@police.lk",
        "emergency_contact": "119",
        "is_emergency_service": True,
        "coverage_area": "National"
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Municipal Council Colombo",
        "department": "Local Government",
        "category": "waste",
        "contact_phone": "+94-11-2323232",
        "contact_email": "info@colombo.mc.gov.lk",
        "emergency_contact": "+94-11-2323999",
        "is_emergency_service": False,
        "coverage_area": "Colombo"
    }
]

@router.post("/report", response_model=dict)
async def report_issue(
    category: str = Form(...),
    title: str = Form(None),
    description: str = Form(...),
    location: str = Form(...),
    user_id: str = Form(...),
    severity_level: int = Form(1),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """
    Report a new civic issue (DUMMY IMPLEMENTATION)
    """
    try:
        # Generate mock issue ID
        issue_id = str(uuid.uuid4())
        
        # Mock image upload (in real implementation, save to cloud storage)
        image_url = None
        if image:
            image_url = f"https://mock-storage.com/issues/{issue_id}/{image.filename}"
        
        # Create mock response
        mock_issue = {
            "id": issue_id,
            "user_id": user_id,
            "category": category,
            "title": title or f"{category.title()} Issue",
            "description": description,
            "location": location,
            "severity_level": severity_level,
            "status": "pending",
            "image_url": image_url,
            "booking_reference": f"ISS{str(uuid.uuid4())[:6].upper()}",
            "created_at": "2025-01-12T10:30:00Z",
            "estimated_resolution": "3-5 working days"
        }
        
        return {
            "success": True,
            "message": "Issue reported successfully",
            "issue": mock_issue,
            "next_steps": [
                "Your issue has been logged with reference " + mock_issue["booking_reference"],
                "A government officer will review your submission within 24 hours",
                "You will receive SMS and email notifications about status updates",
                "Track your issue progress in the 'My Reports' section"
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to report issue: {str(e)}")

@router.get("/my-reports/{user_id}", response_model=dict)
async def get_my_reports(
    user_id: str,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get reported issues for a specific user (DUMMY IMPLEMENTATION)
    """
    try:
        # Mock reported issues data
        mock_reports = [
            {
                "id": str(uuid.uuid4()),
                "title": "Pothole on Main Street",
                "category": "roads",
                "description": "Large pothole causing traffic issues",
                "location": "Main Street, Colombo 03",
                "status": "in_progress",
                "severity_level": 2,
                "booking_reference": "ISS12345A",
                "created_at": "2025-01-10T14:20:00Z",
                "updated_at": "2025-01-11T09:15:00Z",
                "assigned_authority": "Road Development Authority",
                "estimated_completion": "2025-01-15"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Street Light Not Working",
                "category": "electricity",
                "description": "Street light near bus stop not working for 3 days",
                "location": "Bus Stop, Galle Road",
                "status": "pending",
                "severity_level": 1,
                "booking_reference": "ISS12346B",
                "created_at": "2025-01-12T08:45:00Z",
                "updated_at": "2025-01-12T08:45:00Z",
                "assigned_authority": None,
                "estimated_completion": None
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Garbage Not Collected",
                "category": "waste",
                "description": "Garbage collection missed for 2 weeks",
                "location": "Residential Area, Mount Lavinia",
                "status": "resolved",
                "severity_level": 2,
                "booking_reference": "ISS12347C",
                "created_at": "2025-01-08T16:30:00Z",
                "updated_at": "2025-01-11T11:20:00Z",
                "assigned_authority": "Municipal Council",
                "estimated_completion": "2025-01-11"
            }
        ]
        
        return {
            "success": True,
            "reports": mock_reports[:limit],
            "total_count": len(mock_reports),
            "page": skip // limit + 1 if limit > 0 else 1
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@router.get("/categories", response_model=dict)
async def get_issue_categories():
    """
    Get list of available issue categories (DUMMY IMPLEMENTATION)
    """
    return {
        "success": True,
        "categories": MOCK_CATEGORIES
    }

@router.get("/authorities", response_model=dict)
async def get_authorities(category: Optional[str] = None):
    """
    Get list of government authorities (DUMMY IMPLEMENTATION)
    """
    authorities = MOCK_AUTHORITIES
    
    if category:
        authorities = [auth for auth in authorities if auth["category"] == category]
    
    return {
        "success": True,
        "authorities": authorities
    }

@router.post("/{issue_id}/analyze", response_model=dict)
async def analyze_issue(issue_id: str):
    """
    AI analysis of the issue (DUMMY IMPLEMENTATION)
    """
    try:
        # Mock AI analysis response
        mock_analysis = {
            "issue_id": issue_id,
            "analysis": {
                "severity_assessment": "Medium Priority",
                "recommended_authority": "Road Development Authority",
                "priority_score": 7.5,
                "estimated_resolution_time": "5-7 working days",
                "analysis_summary": "Based on the image and description, this appears to be a significant road infrastructure issue that requires immediate attention. The pothole size and location suggest it could pose safety risks to vehicles and pedestrians.",
                "recommended_actions": [
                    "Immediate temporary filling with asphalt",
                    "Proper road surface repair within 1 week",
                    "Traffic warning signs during repair",
                    "Quality inspection after completion"
                ],
                "similar_issues_resolved": 23,
                "average_resolution_time": "6.2 days",
                "success_rate": "94%"
            },
            "confidence_level": 0.87,
            "generated_at": "2025-01-12T10:35:00Z"
        }
        
        return {
            "success": True,
            "message": "AI analysis completed",
            "analysis": mock_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@router.get("/{issue_id}/status", response_model=dict)
async def get_issue_status(issue_id: str):
    """
    Get detailed status of a specific issue (DUMMY IMPLEMENTATION)
    """
    try:
        mock_status = {
            "issue_id": issue_id,
            "current_status": "in_progress",
            "status_history": [
                {
                    "status": "pending",
                    "timestamp": "2025-01-10T14:20:00Z",
                    "note": "Issue reported by citizen"
                },
                {
                    "status": "under_review", 
                    "timestamp": "2025-01-10T16:45:00Z",
                    "note": "Assigned to Road Development Authority for review"
                },
                {
                    "status": "assigned",
                    "timestamp": "2025-01-11T09:15:00Z", 
                    "note": "Field inspection scheduled"
                },
                {
                    "status": "in_progress",
                    "timestamp": "2025-01-11T14:30:00Z",
                    "note": "Repair work has begun"
                }
            ],
            "assigned_officer": {
                "name": "Engineer Kamal Silva",
                "department": "Road Development Authority",
                "contact": "+94-77-1234567"
            },
            "estimated_completion": "2025-01-15T17:00:00Z",
            "progress_percentage": 65,
            "updates": [
                "Temporary filling completed",
                "Proper repair materials ordered", 
                "Work scheduled for completion by Jan 15"
            ]
        }
        
        return {
            "success": True,
            "status": mock_status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.put("/{issue_id}/update", response_model=dict)
async def update_issue_status(
    issue_id: str,
    status: str = Form(...),
    note: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Update issue status (for officers) - DUMMY IMPLEMENTATION
    """
    try:
        # Mock status update
        return {
            "success": True,
            "message": f"Issue {issue_id} status updated to {status}",
            "updated_at": "2025-01-12T10:40:00Z",
            "note": note
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")