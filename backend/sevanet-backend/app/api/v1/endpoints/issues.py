from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import uuid
import json

from app.crud.supabase_issues import supabase_issues
from app.services.gemini_analysis import gemini_service
from app.services.supabase_client import supabase_client
from app.services.location_service import location_service

router = APIRouter()

# Pydantic model for user creation
class CreateAuthorityOfficerRequest(BaseModel):
    email: str
    full_name: str
    nic: str
    authority_id: str
    phone: Optional[str] = None

# Pydantic models for request validation
class NearbyIssuesRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 10
    limit: int = 100

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

@router.post("/create-authority-officer", response_model=dict)
async def create_authority_officer(request: CreateAuthorityOfficerRequest):
    """
    Create or update a user as an authority officer
    """
    try:
        if supabase_client.is_available:
            # First check if user exists by email
            existing_profiles = await supabase_issues.client.table('profiles').select('*').eq('nic', request.nic).execute()
            
            profile_data = {
                'full_name': request.full_name,
                'nic': request.nic,
                'phone': request.phone,
                'role': 'officer',
                'authority_id': request.authority_id,
                'department_id': None,  # Authority officers don't have department_id
                'is_verified': True
            }
            
            if existing_profiles.data:
                # Update existing profile
                result = await supabase_issues.client.table('profiles').update(profile_data).eq('nic', request.nic).execute()
                return {
                    "success": True,
                    "message": f"Updated existing user {request.email} as authority officer",
                    "profile": result.data[0] if result.data else None
                }
            else:
                # Check if we can find by email in auth.users (we need user_id)
                # For now, we'll create without user_id and let the system handle it on login
                result = await supabase_issues.client.table('profiles').insert(profile_data).execute()
                return {
                    "success": True,
                    "message": f"Created authority officer profile for {request.email}",
                    "profile": result.data[0] if result.data else None
                }
        else:
            return {
                "success": False,
                "message": "Database not available - mock mode"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create authority officer: {str(e)}")

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
    Get detailed status of a specific issue using real database data
    """
    try:
        # Get real status history from database
        status_data = await supabase_issues.get_issue_status_history(issue_id)
        
        if status_data:
            return {
                "success": True,
                "status": status_data
            }
        else:
            raise HTTPException(status_code=404, detail="Issue not found")
            
    except HTTPException:
        raise
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.put("/{issue_id}/update", response_model=dict)
async def update_issue_status(
    issue_id: str,
    status: str = Form(...),
    note: str = Form(None),
    updated_by_user_id: str = Form(...)
):
    """
    Update issue status (for officers) using real Supabase database
    """
    try:
        # Update issue status in database with real data
        result = await supabase_issues.update_issue_status(
            issue_id=issue_id, 
            status=status, 
            officer_notes=note,
            updated_by_user_id=updated_by_user_id
        )
        
        if result:
            return {
                "success": True,
                "message": f"Issue {issue_id} status updated to {status}",
                "updated_at": result.get("updated_at"),
                "note": note
            }
        else:
            raise HTTPException(status_code=404, detail="Issue not found or update failed")
        
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

# Location Services Endpoints

@router.post("/location/geocode", response_model=dict)
async def geocode_address(address: str = Form(...)):
    """
    Convert address to coordinates (e.g., "Colombo Main Street" -> lat/lng)
    """
    try:
        location_data = await location_service.geocode_address(address)
        
        if location_data:
            return {
                "success": True,
                "message": "Address geocoded successfully",
                "location": location_data
            }
        else:
            # Try to get suggestions for failed geocoding
            suggestions = await location_service.get_location_suggestions(address, 3)
            return {
                "success": False,
                "message": "Could not find exact location",
                "suggestions": suggestions
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding failed: {str(e)}")

@router.post("/location/reverse-geocode", response_model=dict)
async def reverse_geocode_coordinates(
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    Convert coordinates to address (lat/lng -> "Colombo Main Street")
    """
    try:
        address_data = await location_service.reverse_geocode(latitude, longitude)
        
        if address_data:
            return {
                "success": True,
                "message": "Coordinates converted to address",
                "address": address_data
            }
        else:
            return {
                "success": False,
                "message": "Could not determine address for these coordinates"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reverse geocoding failed: {str(e)}")

@router.get("/location/suggestions", response_model=dict)
async def get_location_suggestions(q: str, limit: int = 5):
    """
    Get location suggestions for autocomplete
    """
    try:
        suggestions = await location_service.get_location_suggestions(q, limit)
        
        return {
            "success": True,
            "message": f"Found {len(suggestions)} location suggestions",
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

@router.post("/location/validate", response_model=dict)
async def validate_location(address: str = Form(...)):
    """
    Validate if location exists and is within Sri Lanka
    """
    try:
        validation_result = await location_service.validate_sri_lankan_location(address)
        
        return {
            "success": True,
            "message": "Location validation completed",
            "validation": validation_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location validation failed: {str(e)}")

@router.get("/location/districts", response_model=dict)
async def get_sri_lankan_districts():
    """
    Get list of Sri Lankan districts for reference
    """
    try:
        districts = location_service.get_sri_lankan_districts()
        
        return {
            "success": True,
            "message": f"Found {len(districts)} districts",
            "districts": districts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get districts: {str(e)}")


@router.post("/nearby", response_model=dict)
async def get_nearby_issues(request: NearbyIssuesRequest):
    """
    Get issues near a specific location using Supabase REST API
    """
    try:
        # Try to fetch from Supabase first
        if supabase_client.is_available:
            try:
                nearby_issues = await supabase_issues.get_nearby_issues(
                    latitude=request.latitude,
                    longitude=request.longitude,
                    radius_km=request.radius_km,
                    limit=request.limit
                )
                
                if nearby_issues:
                    return {
                        "success": True,
                        "message": f"Found {len(nearby_issues)} nearby issues from database",
                        "issues": nearby_issues,
                        "search_params": {
                            "latitude": request.latitude,
                            "longitude": request.longitude,
                            "radius_km": request.radius_km,
                            "limit": request.limit
                        }
                    }
            except Exception as db_error:
                print(f"Database fetch failed: {db_error}")
        
        # Fallback to mock data with calculated distances
        import math
        
        # Mock issues with real locations around Sri Lanka
        mock_issues = [
            {
                "id": str(uuid.uuid4()),
                "title": "Large pothole on Galle Road",
                "category": "roads", 
                "description": "Dangerous pothole causing vehicle damage near Kollupitiya Junction",
                "location": "Galle Road, Kollupitiya, Colombo 03",
                "latitude": 6.9089,
                "longitude": 79.8564,
                "status": "pending",
                "severity_level": 3,
                "created_at": "2025-01-12T10:15:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Broken street light near Viharamahadevi Park",
                "category": "electricity",
                "description": "Street light not working for 3 days, creating safety hazard",
                "location": "Viharamahadevi Park, Cinnamon Gardens, Colombo 07", 
                "latitude": 6.9147,
                "longitude": 79.8560,
                "status": "under_review",
                "severity_level": 2,
                "created_at": "2025-01-11T18:30:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Waste accumulation in Bambalapitiya",
                "category": "waste",
                "description": "Garbage not collected for over a week, causing health hazard",
                "location": "Galle Road, Bambalapitiya, Colombo 04",
                "latitude": 6.8947,
                "longitude": 79.8561,
                "status": "in_progress", 
                "severity_level": 2,
                "created_at": "2025-01-10T14:45:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Water pipe leak on Duplication Road",
                "category": "water",
                "description": "Major water leak flooding the road, disrupting traffic",
                "location": "Duplication Road, Borella, Colombo 08",
                "latitude": 6.9173,
                "longitude": 79.8823,
                "status": "assigned",
                "severity_level": 4,
                "created_at": "2025-01-12T06:20:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Fallen tree blocking Independence Square",
                "category": "infrastructure",
                "description": "Large tree fell during storm, blocking pedestrian access",
                "location": "Independence Square, Colombo 07",
                "latitude": 6.9034,
                "longitude": 79.8680,
                "status": "resolved",
                "severity_level": 4, 
                "created_at": "2025-01-09T22:10:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Unsafe building condition at Fort Railway Station",
                "category": "safety",
                "description": "Old building wall cracking near main entrance",
                "location": "Fort Railway Station, Colombo 01",
                "latitude": 6.9344,
                "longitude": 79.8428,
                "status": "pending",
                "severity_level": 3,
                "created_at": "2025-01-11T12:30:00Z", 
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Road surface damage near Temple of the Tooth",
                "category": "roads",
                "description": "Severe road damage affecting tourist traffic",
                "location": "Temple of the Tooth, Kandy",
                "latitude": 7.2906,
                "longitude": 80.6337,
                "status": "pending",
                "severity_level": 3,
                "created_at": "2025-01-12T09:00:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Power outage in Galle Fort area",
                "category": "electricity",
                "description": "Frequent power cuts affecting businesses",
                "location": "Galle Fort, Galle",
                "latitude": 6.0235,
                "longitude": 80.2168,
                "status": "under_review",
                "severity_level": 2,
                "created_at": "2025-01-11T16:45:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Damaged drainage system in Negombo",
                "category": "infrastructure",
                "description": "Blocked drainage causing flooding during rain",
                "location": "Main Street, Negombo",
                "latitude": 7.2084,
                "longitude": 79.8380,
                "status": "assigned",
                "severity_level": 3,
                "created_at": "2025-01-10T11:20:00Z",
                "user_id": str(uuid.uuid4())
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Water quality issue in Kurunegala",
                "category": "water",
                "description": "Discolored water supply affecting entire neighborhood",
                "location": "Clock Tower Area, Kurunegala",
                "latitude": 7.4818,
                "longitude": 80.3609,
                "status": "in_progress",
                "severity_level": 3,
                "created_at": "2025-01-09T14:30:00Z",
                "user_id": str(uuid.uuid4())
            }
        ]
        
        # Calculate distances and filter by radius
        def calculate_distance(lat1, lon1, lat2, lon2):
            """Calculate distance between two points using Haversine formula"""
            R = 6371  # Earth's radius in km
            
            lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
            lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
            
            dlat = lat2_rad - lat1_rad
            dlon = lon2_rad - lon1_rad
            
            a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            
            return R * c
        
        # Add distance to each issue and filter
        nearby_issues = []
        for issue in mock_issues:
            distance = calculate_distance(
                request.latitude, request.longitude,
                issue["latitude"], issue["longitude"]
            )
            
            if distance <= request.radius_km:
                issue["distance_km"] = round(distance, 2)
                nearby_issues.append(issue)
        
        # Sort by distance and limit results
        nearby_issues.sort(key=lambda x: x["distance_km"])
        nearby_issues = nearby_issues[:request.limit]
        
        return {
            "success": True,
            "message": f"Found {len(nearby_issues)} nearby issues (mock mode)",
            "issues": nearby_issues,
            "search_params": {
                "latitude": request.latitude,
                "longitude": request.longitude,
                "radius_km": request.radius_km,
                "limit": request.limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch nearby issues: {str(e)}")

@router.get("/all", response_model=dict)
async def get_all_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    authority_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Get all issues with optional filtering for admin/officer views
    """
    try:
        # Try to fetch from Supabase first
        if supabase_client.is_available:
            try:
                # If authority_id is provided, use the authority-specific method
                if authority_id:
                    all_issues = await supabase_issues.get_issues_by_authority_category(
                        authority_id=authority_id,
                        category=category,
                        status=status,
                        limit=limit,
                        offset=skip
                    )
                else:
                    all_issues = await supabase_issues.get_all_issues(
                        category=category,
                        status=status,
                        department_id=department_id,
                        authority_id=authority_id,
                        limit=limit,
                        offset=skip
                    )
                
                if all_issues:
                    return {
                        "success": True,
                        "message": f"Fetched {len(all_issues)} issues from database",
                        "issues": all_issues,
                        "filters": {
                            "category": category,
                            "status": status,
                            "department_id": department_id,
                            "authority_id": authority_id
                        }
                    }
            except Exception as db_error:
                print(f"Database fetch failed: {db_error}")
        
        # Fallback to mock data
        mock_issues = [
            {
                "id": str(uuid.uuid4()),
                "title": "Road repair needed",
                "category": "roads",
                "description": "Multiple potholes on main road",
                "location": "Kandy Road, Colombo",
                "status": "pending",
                "severity_level": 2,
                "created_at": "2025-01-12T08:00:00Z",
                "user_id": str(uuid.uuid4()),
                "latitude": 6.9218,
                "longitude": 79.8604
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Power outage",
                "category": "electricity", 
                "description": "Entire area without power for 6 hours",
                "location": "Mount Lavinia",
                "status": "in_progress",
                "severity_level": 3,
                "created_at": "2025-01-11T20:00:00Z", 
                "user_id": str(uuid.uuid4()),
                "latitude": 6.8373,
                "longitude": 79.8638
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Water supply disruption",
                "category": "water",
                "description": "No water supply for 2 days",
                "location": "Nugegoda",
                "status": "resolved",
                "severity_level": 3,
                "created_at": "2025-01-10T12:00:00Z",
                "user_id": str(uuid.uuid4()),
                "latitude": 6.8649,
                "longitude": 79.8997
            }
        ]
        
        # Apply filters
        filtered_issues = mock_issues
        
        if category:
            filtered_issues = [issue for issue in filtered_issues if issue["category"] == category]
        
        if status:
            filtered_issues = [issue for issue in filtered_issues if issue["status"] == status]
        
        # Apply pagination
        filtered_issues = filtered_issues[skip:skip+limit]
        
        return {
            "success": True,
            "message": f"Fetched {len(filtered_issues)} issues (mock mode)",
            "issues": filtered_issues,
            "filters": {
                "category": category,
                "status": status,
                "department_id": department_id,
                "authority_id": authority_id
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch issues: {str(e)}")

@router.post("/analyze-image-with-location", response_model=dict)
async def analyze_image_with_enhanced_location(
    image: UploadFile = File(...),
    location_address: str = Form(None),
    latitude: float = Form(None),
    longitude: float = Form(None)
):
    """
    Enhanced AI image analysis with advanced location processing
    """
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Please upload a valid image file")
        
        if image.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image file too large. Maximum size is 10MB")
        
        # Read image content
        image_content = await image.read()
        
        # Enhanced location processing
        location_context = None
        location_data = None
        
        if location_address:
            # Geocode the address
            location_data = await location_service.geocode_address(location_address)
            if location_data:
                location_context = f"{location_data['formatted_address']} (GPS: {location_data['latitude']:.6f}, {location_data['longitude']:.6f})"
            else:
                location_context = location_address
        elif latitude and longitude:
            # Reverse geocode the coordinates
            address_data = await location_service.reverse_geocode(latitude, longitude)
            if address_data:
                location_context = f"{address_data['formatted_address']} (GPS: {latitude:.6f}, {longitude:.6f})"
            else:
                location_context = f"GPS Coordinates: {latitude:.6f}, {longitude:.6f}"
        
        # Perform AI analysis with enhanced location context
        try:
            analysis_result = await gemini_service.analyze_image(
                image_content=image_content,
                location=location_context
            )
            
            # Add location data to the response
            if location_data:
                analysis_result["location_data"] = location_data
            
            return {
                "success": True,
                "message": "AI analysis with enhanced location completed successfully",
                "analysis": analysis_result,
                "location_info": {
                    "provided_address": location_address,
                    "coordinates": {"latitude": latitude, "longitude": longitude} if latitude and longitude else None,
                    "geocoded_data": location_data,
                    "context_used": location_context
                },
                "processing_info": {
                    "model": "Google Gemini 1.5 Flash",
                    "image_size": f"{len(image_content)} bytes",
                    "location_enhanced": location_context is not None
                }
            }
            
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        
        except Exception as ai_error:
            raise HTTPException(
                status_code=500, 
                detail=f"AI analysis service error: {str(ai_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error during enhanced image analysis: {str(e)}"
        )