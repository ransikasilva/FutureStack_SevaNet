from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import uuid
import json

from app.crud.supabase_issues import supabase_issues
from app.services.gemini_analysis import gemini_service
from app.services.supabase_client import supabase_client

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
    latitude: float = Form(None),
    longitude: float = Form(None),
    ai_analysis: str = Form(None),
    image: UploadFile = File(None)
):
    """
    Report a new civic issue using Supabase REST API
    """
    try:
        # Handle image upload (in real implementation, save to Supabase storage)
        image_url = None
        if image:
            image_url = f"https://storage.supabase.co/issues/{uuid.uuid4()}/{image.filename}"
        
        # Parse AI analysis if provided
        ai_analysis_data = None
        if ai_analysis:
            try:
                ai_analysis_data = json.loads(ai_analysis)
            except json.JSONDecodeError:
                ai_analysis_data = {"raw_analysis": ai_analysis}
        
        # Prepare issue data
        issue_data = {
            "user_id": user_id,
            "category": category,
            "title": title or f"{category.title()} Issue",
            "description": description,
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "severity_level": severity_level,
            "image_url": image_url,
            "ai_analysis": ai_analysis_data
        }
        
        # Try to save to Supabase first
        if supabase_client.is_available:
            try:
                saved_issue = await supabase_issues.create_issue(issue_data)
                if saved_issue:
                    return {
                        "success": True,
                        "message": "Issue reported successfully to database",
                        "issue": saved_issue,
                        "next_steps": [
                            f"Your issue has been logged with reference {saved_issue.get('booking_reference')}",
                            "A government officer will review your submission within 24 hours",
                            "You will receive SMS and email notifications about status updates",
                            "Track your issue progress in the 'My Reports' section"
                        ]
                    }
            except Exception as db_error:
                print(f"Database save failed: {db_error}")
        
        # Fallback to mock response
        mock_issue = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "category": category,
            "title": title or f"{category.title()} Issue",
            "description": description,
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "severity_level": severity_level,
            "status": "pending",
            "image_url": image_url,
            "ai_analysis": ai_analysis_data,
            "booking_reference": f"ISS{str(uuid.uuid4())[:6].upper()}",
            "created_at": "2025-01-12T10:30:00Z",
            "estimated_resolution": "3-5 working days"
        }
        
        return {
            "success": True,
            "message": "Issue reported successfully (mock mode)",
            "issue": mock_issue,
            "next_steps": [
                f"Your issue has been logged with reference {mock_issue['booking_reference']}",
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
    limit: int = 10
):
    """
    Get reported issues for a specific user using Supabase REST API
    """
    try:
        # Try to fetch from Supabase first
        if supabase_client.is_available:
            try:
                user_issues = await supabase_issues.get_issues_by_user(
                    user_id=user_id,
                    limit=limit,
                    offset=skip
                )
                
                if user_issues:
                    return {
                        "success": True,
                        "message": "Reports fetched from database",
                        "reports": user_issues,
                        "total_count": len(user_issues),
                        "page": skip // limit + 1 if limit > 0 else 1
                    }
            except Exception as db_error:
                print(f"Database fetch failed: {db_error}")
        
        # Fallback to mock data
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
            "message": "Reports fetched (mock mode)",
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
    Get list of government authorities using Supabase REST API
    """
    try:
        # Try to fetch from Supabase first
        if supabase_client.is_available:
            try:
                authorities = await supabase_issues.get_authorities(category)
                if authorities:
                    return {
                        "success": True,
                        "message": "Authorities fetched from database",
                        "authorities": authorities
                    }
            except Exception as db_error:
                print(f"Database fetch failed: {db_error}")
        
        # Fallback to mock data
        authorities = MOCK_AUTHORITIES
        
        if category:
            authorities = [auth for auth in authorities if auth["category"] == category]
        
        return {
            "success": True,
            "message": "Authorities fetched (mock mode)",
            "authorities": authorities
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch authorities: {str(e)}")

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
    note: str = Form(None)
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

@router.post("/analyze-image", response_model=dict)
async def analyze_image_with_ai(
    image: UploadFile = File(...),
    latitude: float = Form(None),
    longitude: float = Form(None),
    address: str = Form(None)
):
    """
    AI Analysis of uploaded image to detect civic issues using Google Gemini Vision API
    """
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Please upload a valid image file")
        
        if image.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 10MB")
        
        # Read image content
        image_content = await image.read()
        
        # Prepare location context
        location_context = None
        if address:
            location_context = address
        elif latitude and longitude:
            location_context = f"GPS Coordinates: {latitude:.6f}, {longitude:.6f}"
        
        # Perform AI analysis using Gemini
        try:
            analysis_result = await gemini_service.analyze_image(
                image_content=image_content,
                location=location_context
            )
            
            return {
                "success": True,
                "message": "AI analysis completed successfully",
                "analysis": analysis_result,
                "processing_info": {
                    "model": "Google Gemini Pro Vision",
                    "image_size": f"{len(image_content)} bytes",
                    "location_provided": location_context is not None
                }
            }
            
        except ValueError as ve:
            # Handle validation errors (missing API key, invalid image, etc.)
            raise HTTPException(status_code=400, detail=str(ve))
        
        except Exception as ai_error:
            # Handle AI service errors
            raise HTTPException(
                status_code=500, 
                detail=f"AI analysis service error: {str(ai_error)}"
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error during image analysis: {str(e)}"
        )