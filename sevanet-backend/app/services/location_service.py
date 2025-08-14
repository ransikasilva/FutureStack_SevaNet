"""
Location service for address geocoding and coordinate conversion
"""

import httpx
import json
from typing import Dict, Any, Optional, Tuple
from decouple import config


class LocationService:
    def __init__(self):
        # You can use Google Maps API, OpenStreetMap Nominatim, or other services
        # For demo, using OpenStreetMap Nominatim (free, no API key required)
        self.nominatim_base = "https://nominatim.openstreetmap.org"
        self.google_api_key = config("GOOGLE_MAPS_API_KEY", default="")
        
    async def geocode_address(self, address: str) -> Optional[Dict[str, Any]]:
        """
        Convert address to coordinates using OpenStreetMap Nominatim
        """
        try:
            # Enhance address for Sri Lanka context
            enhanced_address = self._enhance_sri_lanka_address(address)
            
            url = f"{self.nominatim_base}/search"
            params = {
                "q": enhanced_address,
                "format": "json",
                "limit": 1,
                "countrycodes": "lk",  # Restrict to Sri Lanka
                "addressdetails": 1
            }
            
            headers = {
                "User-Agent": "SevaNet-IssueReporting/1.0"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                if data and len(data) > 0:
                    result = data[0]
                    return {
                        "latitude": float(result["lat"]),
                        "longitude": float(result["lon"]),
                        "formatted_address": result.get("display_name", ""),
                        "address_components": {
                            "road": result.get("address", {}).get("road", ""),
                            "suburb": result.get("address", {}).get("suburb", ""),
                            "city": result.get("address", {}).get("city", result.get("address", {}).get("town", "")),
                            "district": result.get("address", {}).get("state_district", ""),
                            "province": result.get("address", {}).get("state", ""),
                            "postcode": result.get("address", {}).get("postcode", ""),
                            "country": result.get("address", {}).get("country", "Sri Lanka")
                        },
                        "confidence": float(result.get("importance", 0.5)),
                        "type": result.get("type", "unknown")
                    }
                    
        except Exception as e:
            print(f"Geocoding error: {e}")
            
        return None
    
    async def reverse_geocode(self, latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """
        Convert coordinates to address
        """
        try:
            url = f"{self.nominatim_base}/reverse"
            params = {
                "lat": latitude,
                "lon": longitude,
                "format": "json",
                "addressdetails": 1,
                "zoom": 18
            }
            
            headers = {
                "User-Agent": "SevaNet-IssueReporting/1.0"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                if data:
                    return {
                        "formatted_address": data.get("display_name", ""),
                        "address_components": {
                            "road": data.get("address", {}).get("road", ""),
                            "suburb": data.get("address", {}).get("suburb", ""),
                            "city": data.get("address", {}).get("city", data.get("address", {}).get("town", "")),
                            "district": data.get("address", {}).get("state_district", ""),
                            "province": data.get("address", {}).get("state", ""),
                            "postcode": data.get("address", {}).get("postcode", ""),
                            "country": data.get("address", {}).get("country", "Sri Lanka")
                        },
                        "type": data.get("type", "unknown")
                    }
                    
        except Exception as e:
            print(f"Reverse geocoding error: {e}")
            
        return None
    
    def _enhance_sri_lanka_address(self, address: str) -> str:
        """
        Enhance address for better Sri Lankan geocoding results
        """
        address = address.strip()
        
        # Common Sri Lankan location improvements
        enhancements = {
            "colombo main street": "Main Street, Colombo, Sri Lanka",
            "galle road": "Galle Road, Colombo, Sri Lanka",
            "kandy road": "Kandy Road, Sri Lanka",
            "negombo": "Negombo, Western Province, Sri Lanka",
            "gampaha": "Gampaha, Western Province, Sri Lanka",
            "mount lavinia": "Mount Lavinia, Colombo, Sri Lanka",
            "dehiwala": "Dehiwala, Colombo, Sri Lanka",
            "moratuwa": "Moratuwa, Western Province, Sri Lanka",
            "kelaniya": "Kelaniya, Western Province, Sri Lanka",
            "maharagama": "Maharagama, Western Province, Sri Lanka",
            "kotte": "Sri Jayawardenepura Kotte, Western Province, Sri Lanka",
            "battaramulla": "Battaramulla, Western Province, Sri Lanka"
        }
        
        address_lower = address.lower()
        for key, enhanced in enhancements.items():
            if key in address_lower:
                return enhanced
        
        # If not in common enhancements, add Sri Lanka suffix if not present
        if "sri lanka" not in address_lower:
            address += ", Sri Lanka"
            
        return address
    
    async def get_location_suggestions(self, query: str, limit: int = 5) -> list:
        """
        Get location suggestions for autocomplete
        """
        try:
            enhanced_query = self._enhance_sri_lanka_address(query)
            
            url = f"{self.nominatim_base}/search"
            params = {
                "q": enhanced_query,
                "format": "json",
                "limit": limit,
                "countrycodes": "lk",
                "addressdetails": 1
            }
            
            headers = {
                "User-Agent": "SevaNet-IssueReporting/1.0"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                suggestions = []
                
                for result in data:
                    suggestions.append({
                        "formatted_address": result.get("display_name", ""),
                        "latitude": float(result["lat"]),
                        "longitude": float(result["lon"]),
                        "type": result.get("type", "unknown"),
                        "importance": float(result.get("importance", 0.5))
                    })
                
                return suggestions
                
        except Exception as e:
            print(f"Location suggestions error: {e}")
            return []
    
    def get_sri_lankan_districts(self) -> list:
        """
        Get list of Sri Lankan districts for reference
        """
        return [
            {"name": "Colombo", "province": "Western"},
            {"name": "Gampaha", "province": "Western"},
            {"name": "Kalutara", "province": "Western"},
            {"name": "Kandy", "province": "Central"},
            {"name": "Matale", "province": "Central"},
            {"name": "Nuwara Eliya", "province": "Central"},
            {"name": "Galle", "province": "Southern"},
            {"name": "Matara", "province": "Southern"},
            {"name": "Hambantota", "province": "Southern"},
            {"name": "Jaffna", "province": "Northern"},
            {"name": "Kilinochchi", "province": "Northern"},
            {"name": "Mannar", "province": "Northern"},
            {"name": "Vavuniya", "province": "Northern"},
            {"name": "Mullaitivu", "province": "Northern"},
            {"name": "Batticaloa", "province": "Eastern"},
            {"name": "Ampara", "province": "Eastern"},
            {"name": "Trincomalee", "province": "Eastern"},
            {"name": "Kurunegala", "province": "North Western"},
            {"name": "Puttalam", "province": "North Western"},
            {"name": "Anuradhapura", "province": "North Central"},
            {"name": "Polonnaruwa", "province": "North Central"},
            {"name": "Badulla", "province": "Uva"},
            {"name": "Moneragala", "province": "Uva"},
            {"name": "Ratnapura", "province": "Sabaragamuwa"},
            {"name": "Kegalle", "province": "Sabaragamuwa"}
        ]
    
    async def validate_sri_lankan_location(self, address: str) -> Dict[str, Any]:
        """
        Validate if address is within Sri Lanka and get detailed info
        """
        location_data = await self.geocode_address(address)
        
        if not location_data:
            return {
                "valid": False,
                "error": "Could not find this location",
                "suggestions": await self.get_location_suggestions(address, 3)
            }
        
        # Check if coordinates are within Sri Lanka bounds
        lat, lon = location_data["latitude"], location_data["longitude"]
        sri_lanka_bounds = {
            "north": 9.8,
            "south": 5.9,
            "east": 81.9,
            "west": 79.6
        }
        
        within_bounds = (
            sri_lanka_bounds["south"] <= lat <= sri_lanka_bounds["north"] and
            sri_lanka_bounds["west"] <= lon <= sri_lanka_bounds["east"]
        )
        
        return {
            "valid": within_bounds,
            "location_data": location_data if within_bounds else None,
            "warning": "Location appears to be outside Sri Lanka" if not within_bounds else None,
            "confidence": location_data.get("confidence", 0)
        }


# Global instance
location_service = LocationService()