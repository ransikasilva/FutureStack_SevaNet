"""
Supabase REST API client for database operations
"""

import httpx
import json
from typing import Dict, List, Optional, Any
from decouple import config


class SupabaseClient:
    def __init__(self):
        self.base_url = config("SUPABASE_URL", default="")
        self.anon_key = config("SUPABASE_ANON_KEY", default="")
        self.service_role_key = config("SUPABASE_SERVICE_ROLE_KEY", default="")
        
        # Check if Supabase is configured
        self.is_available = bool(self.base_url and self.anon_key)
        
        if not self.is_available:
            print("WARNING: Supabase REST API not configured. Using mock data.")
            return
        
        # Use service role key for backend operations (more permissions)
        self.api_key = self.service_role_key if self.service_role_key else self.anon_key
        
        self.headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        print(f"Supabase REST API client initialized: {self.base_url}")
    
    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Insert a record into a table"""
        if not self.is_available:
            return None
            
        try:
            url = f"{self.base_url}/rest/v1/{table}"
            headers = {**self.headers, "Prefer": "return=representation"}
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                response.raise_for_status()
                
                result = response.json()
                return result[0] if result else None
                
        except Exception as e:
            print(f"Supabase insert error: {e}")
            return None
    
    async def select(
        self, 
        table: str, 
        columns: str = "*", 
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        order: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Select records from a table"""
        if not self.is_available:
            return []
            
        try:
            url = f"{self.base_url}/rest/v1/{table}?select={columns}"
            
            # Add filters
            if filters:
                for key, value in filters.items():
                    # Handle special filter syntax for PostgREST
                    if key.endswith('.not.is'):
                        # For "not is null" queries
                        field_name = key.replace('.not.is', '')
                        if value == "null":
                            url += f"&{field_name}=not.is.null"
                        else:
                            url += f"&{field_name}=not.eq.{value}"
                    elif key.endswith('.is'):
                        # For "is null" queries
                        field_name = key.replace('.is', '')
                        if value == "null":
                            url += f"&{field_name}=is.null"
                        else:
                            url += f"&{field_name}=eq.{value}"
                    else:
                        # Standard equality filter
                        url += f"&{key}=eq.{value}"
            
            # Add ordering
            if order:
                url += f"&order={order}"
            
            # Add limit
            if limit:
                url += f"&limit={limit}"
            
            # Add offset
            if offset:
                url += f"&offset={offset}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                return response.json()
                
        except Exception as e:
            print(f"Supabase select error: {e}")
            return []
    
    async def update(
        self, 
        table: str, 
        data: Dict[str, Any], 
        filters: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update records in a table"""
        if not self.is_available:
            return None
            
        try:
            url = f"{self.base_url}/rest/v1/{table}?"
            
            # Add filters for WHERE clause
            filter_params = []
            for key, value in filters.items():
                filter_params.append(f"{key}=eq.{value}")
            url += "&".join(filter_params)
            
            headers = {**self.headers, "Prefer": "return=representation"}
            
            async with httpx.AsyncClient() as client:
                response = await client.patch(url, json=data, headers=headers)
                response.raise_for_status()
                
                result = response.json()
                return result[0] if result else None
                
        except Exception as e:
            print(f"Supabase update error: {e}")
            return None
    
    async def delete(self, table: str, filters: Dict[str, Any]) -> bool:
        """Delete records from a table"""
        if not self.is_available:
            return False
            
        try:
            url = f"{self.base_url}/rest/v1/{table}?"
            
            # Add filters for WHERE clause
            filter_params = []
            for key, value in filters.items():
                filter_params.append(f"{key}=eq.{value}")
            url += "&".join(filter_params)
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(url, headers=self.headers)
                response.raise_for_status()
                
                return True
                
        except Exception as e:
            print(f"Supabase delete error: {e}")
            return False
    
    async def rpc(self, function_name: str, params: Dict[str, Any] = None) -> Any:
        """Call a Supabase RPC function"""
        if not self.is_available:
            return None
            
        try:
            url = f"{self.base_url}/rest/v1/rpc/{function_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=params or {}, headers=self.headers)
                response.raise_for_status()
                
                return response.json()
                
        except Exception as e:
            print(f"Supabase RPC error: {e}")
            return None


# Global instance
supabase_client = SupabaseClient()