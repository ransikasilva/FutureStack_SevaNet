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
            # Prepare issue data
            data = {
                "id": str(uuid.uuid4()),
                "user_id": issue_data.get("user_id"),
                "category": issue_data.get("category"),
                "title": issue_data.get("title"),
                "description": issue_data.get("description"),
                "location": issue_data.get("location"),
                "latitude": issue_data.get("latitude"),
                "longitude": issue_data.get("longitude"),
                "severity_level": issue_data.get("severity_level", 2),
                "status": "pending",
                "image_url": issue_data.get("image_url"),
                "ai_analysis": issue_data.get("ai_analysis"),
                "booking_reference": f"ISS{str(uuid.uuid4())[:6].upper()}",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
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
        officer_notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Update issue status"""
        try:
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            if officer_notes:
                update_data["officer_notes"] = officer_notes
            
            result = await supabase_client.update(
                table=self.table,
                data=update_data,
                filters={"id": issue_id}
            )
            return result
            
        except Exception as e:
            print(f"Error updating issue status: {e}")
            return None
    
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