"""
Issue management using Supabase REST API
"""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.services.supabase_client import supabase_client


class SupabaseIssueCRUD:
    def __init__(self):
        self.table = "issues"
        self.authorities_table = "authorities"
    
    async def create_issue(self, issue_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new issue"""
        try:
            # Prepare issue data (let database auto-generate id, created_at, updated_at)
            data = {
                "user_id": issue_data.get("user_id"),
                "category": issue_data.get("category"),
                "title": issue_data.get("title"),
                "description": issue_data.get("description"),
                "location": issue_data.get("location"),
                "latitude": issue_data.get("latitude"),
                "longitude": issue_data.get("longitude"),
                "severity_level": issue_data.get("severity_level", 2),
                "status": "pending",
                "booking_reference": f"ISS{str(uuid.uuid4())[:6].upper()}"
            }
            
            # Only add optional fields if they have values
            if issue_data.get("image_url"):
                data["image_url"] = issue_data.get("image_url")
            # Temporarily skip ai_analysis to test basic fields
            # if issue_data.get("ai_analysis"):
            #     # Convert ai_analysis to JSON string for PostgreSQL JSONB compatibility
            #     import json
            #     data["ai_analysis"] = json.dumps(issue_data.get("ai_analysis"))
            
            result = await supabase_client.insert(self.table, data)
            return result
            
        except Exception as e:
            print(f"Error creating issue: {e}")
            return None
    
    async def get_issues_by_user(self, user_id: str, limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Get issues for a specific user"""
        try:
            issues = await supabase_client.select(
                table=self.table,
                columns="*",
                filters={"user_id": user_id},
                limit=limit,
                order="created_at.desc"
            )
            return issues
            
        except Exception as e:
            print(f"Error getting user issues: {e}")
            return []
    
    async def get_issue_by_id(self, issue_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific issue by ID"""
        try:
            issues = await supabase_client.select(
                table=self.table,
                columns="*",
                filters={"id": issue_id},
                limit=1
            )
            return issues[0] if issues else None
            
        except Exception as e:
            print(f"Error getting issue: {e}")
            return None
    
    async def update_issue_status(
        self, 
        issue_id: str, 
        status: str, 
        officer_notes: Optional[str] = None,
        updated_by_user_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Update issue status and create status update record"""
        try:
            # First, get the current issue to check previous status
            current_issue = await supabase_client.select(
                table=self.table,
                columns="*",
                filters={"id": issue_id},
                limit=1
            )
            
            if not current_issue:
                print(f"Issue {issue_id} not found")
                return None
                
            previous_status = current_issue[0].get("status")
            
            # Update the main issue record
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if officer_notes:
                update_data["resolution_notes"] = officer_notes
            
            result = await supabase_client.update(
                table=self.table,
                data=update_data,
                filters={"id": issue_id}
            )
            
            # Create a record in issue_updates table for tracking history
            if result and updated_by_user_id:
                update_record = {
                    "issue_id": issue_id,
                    "updated_by_user_id": updated_by_user_id,
                    "previous_status": previous_status,
                    "new_status": status,
                    "update_type": "status_change",
                    "comment": officer_notes,
                    "is_public": True
                }
                
                await supabase_client.insert("issue_updates", update_record)
            
            return result
            
        except Exception as e:
            print(f"Error updating issue status: {e}")
            return None
    
    async def get_issue_status_history(self, issue_id: str) -> Dict[str, Any]:
        """Get issue status history from issue_updates table"""
        try:
            # Get the current issue details
            issue = await supabase_client.select(
                table=self.table,
                columns="*",
                filters={"id": issue_id},
                limit=1
            )
            
            if not issue:
                return {}
            
            current_issue = issue[0]
            
            # Get status update history
            updates = await supabase_client.select(
                table="issue_updates",
                columns="*",
                filters={"issue_id": issue_id},
                order="created_at.asc"
            )
            
            # Format the status history
            status_history = []
            for update in updates:
                status_history.append({
                    "status": update["new_status"],
                    "timestamp": update["created_at"],
                    "note": update.get("comment") or f"Status changed to {update['new_status'].replace('_', ' ').title()}",
                    "updated_by": update.get("updated_by_user_id")
                })
            
            # If no updates exist, create initial status from issue creation
            if not status_history:
                status_history.append({
                    "status": "pending",
                    "timestamp": current_issue["created_at"],
                    "note": "Issue reported by citizen"
                })
            
            return {
                "issue_id": issue_id,
                "current_status": current_issue["status"],
                "status_history": status_history,
                "assigned_officer": {
                    "id": current_issue.get("officer_assigned_id"),
                    "department": "Government Department"  # Would need to join with profiles/departments
                },
                "estimated_completion": current_issue.get("estimated_completion_date"),
                "actual_completion": current_issue.get("actual_completion_date"),
                "resolution_notes": current_issue.get("resolution_notes")
            }
            
        except Exception as e:
            print(f"Error getting issue status history: {e}")
            return {}
    
    async def get_issues_by_category(self, category: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get issues by category"""
        try:
            issues = await supabase_client.select(
                table=self.table,
                columns="*",
                filters={"category": category},
                limit=limit,
                order="created_at.desc"
            )
            return issues
            
        except Exception as e:
            print(f"Error getting issues by category: {e}")
            return []
    
    async def get_all_issues(
        self, 
        category: str = None, 
        status: str = None, 
        department_id: str = None,
        authority_id: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all issues with optional filtering"""
        try:
            filters = {}
            if category:
                filters["category"] = category
            if status:
                filters["status"] = status
            if department_id:
                filters["assigned_authority_id"] = department_id
            if authority_id:
                filters["assigned_authority_id"] = authority_id
            
            issues = await supabase_client.select(
                table=self.table,
                columns="*",
                filters=filters if filters else None,
                limit=limit,
                offset=offset,
                order="created_at.desc"
            )
            return issues
            
        except Exception as e:
            print(f"Error getting all issues: {e}")
            return []

    async def get_issues_by_authority_category(
        self, 
        authority_id: str,
        category: str = None,
        status: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get issues for a specific authority by category"""
        try:
            # First get the authority details to know its category
            authority = await supabase_client.select(
                table=self.authorities_table,
                columns="category",
                filters={"id": authority_id},
                limit=1
            )
            
            if not authority:
                return []
            
            authority_category = authority[0]["category"]
            
            # Build filters - only show issues in this authority's category
            filters = {"category": authority_category}
            if status:
                filters["status"] = status
            
            issues = await supabase_client.select(
                table=self.table,
                columns="*",
                filters=filters,
                limit=limit,
                offset=offset,
                order="created_at.desc"
            )
            return issues
            
        except Exception as e:
            print(f"Error getting issues by authority category: {e}")
            return []
    
    async def get_authorities(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get authorities, optionally filtered by category"""
        try:
            filters = {"category": category} if category else None
            authorities = await supabase_client.select(
                table=self.authorities_table,
                columns="*",
                filters=filters
            )
            return authorities
            
        except Exception as e:
            print(f"Error getting authorities: {e}")
            return []
    
    async def create_authority(self, authority_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new authority"""
        try:
            data = {
                "id": str(uuid.uuid4()),
                "name": authority_data.get("name"),
                "department": authority_data.get("department"),
                "category": authority_data.get("category"),
                "contact_phone": authority_data.get("contact_phone"),
                "contact_email": authority_data.get("contact_email"),
                "emergency_contact": authority_data.get("emergency_contact"),
                "is_emergency_service": authority_data.get("is_emergency_service", False),
                "coverage_area": authority_data.get("coverage_area", "National"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = await supabase_client.insert(self.authorities_table, data)
            return result
            
        except Exception as e:
            print(f"Error creating authority: {e}")
            return None
    
    async def get_nearby_issues(
        self, 
        latitude: float, 
        longitude: float, 
        radius_km: float = 10, 
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get issues near a location"""
        try:
            # Get all issues with coordinates
            issues = await supabase_client.select(
                table=self.table,
                columns="*",
                filters={
                    "latitude.not.is": "null",
                    "longitude.not.is": "null"
                },
                limit=limit * 2,  # Get more to filter by distance
                order="created_at.desc"
            )
            
            # Calculate distances and filter
            nearby_issues = []
            for issue in issues:
                if issue.get("latitude") is None or issue.get("longitude") is None:
                    continue
                    
                # Calculate distance using Haversine formula
                lat1, lon1 = latitude, longitude
                lat2, lon2 = float(issue["latitude"]), float(issue["longitude"])
                
                import math
                
                # Convert to radians
                lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                
                # Haversine formula
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                distance_km = 6371 * c  # Earth's radius in km
                
                if distance_km <= radius_km:
                    issue["distance_km"] = round(distance_km, 2)
                    nearby_issues.append(issue)
            
            # Sort by distance and limit
            nearby_issues.sort(key=lambda x: x.get("distance_km", 0))
            return nearby_issues[:limit]
            
        except Exception as e:
            print(f"Error getting nearby issues: {e}")
            return []

    async def get_analytics_data(self, days: int = 30) -> Dict[str, Any]:
        """Get analytics data for dashboard"""
        try:
            # Get recent issues
            recent_issues = await supabase_client.select(
                table=self.table,
                columns="category,status,severity_level,created_at",
                limit=1000,
                order="created_at.desc"
            )
            
            # Process analytics
            analytics = {
                "total_issues": len(recent_issues),
                "by_category": {},
                "by_status": {},
                "by_severity": {}
            }
            
            for issue in recent_issues:
                # Category breakdown
                category = issue.get("category", "unknown")
                analytics["by_category"][category] = analytics["by_category"].get(category, 0) + 1
                
                # Status breakdown
                status = issue.get("status", "unknown")
                analytics["by_status"][status] = analytics["by_status"].get(status, 0) + 1
                
                # Severity breakdown
                severity = str(issue.get("severity_level", "unknown"))
                analytics["by_severity"][severity] = analytics["by_severity"].get(severity, 0) + 1
            
            return analytics
            
        except Exception as e:
            print(f"Error getting analytics: {e}")
            return {}


# Global instance
supabase_issues = SupabaseIssueCRUD()