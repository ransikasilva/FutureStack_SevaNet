import os
import base64
import json
from typing import Dict, Any, Optional
from PIL import Image
from io import BytesIO
from decouple import config
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage


class GeminiAnalysisService:
    def __init__(self):
        # Initialize Gemini API
        self.api_key = config("GOOGLE_API_KEY", default="")
        self.api_available = bool(self.api_key and self.api_key != "your-gemini-api-key-here")
        
        if not self.api_available:
            print("WARNING: GOOGLE_API_KEY not set. AI analysis will return mock responses.")
            return
        else:
            print(f"Gemini API initialized successfully with key: {self.api_key[:10]}...")
            print(f"API available: {self.api_available}")
        
        genai.configure(api_key=self.api_key)
        
        # Initialize LangChain with Gemini
        try:
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=self.api_key,
                temperature=0.3
            )
            print("LangChain Gemini model initialized successfully")
        except Exception as e:
            print(f"Error initializing LangChain model: {e}")
            self.api_available = False
        
        # Authority mapping for Sri Lankan government departments
        self.authority_mapping = {
            "roads": {
                "name": "Road Development Authority",
                "contact_phone": "+94-11-2691211",
                "contact_email": "info@rda.gov.lk",
                "emergency_contact": "+94-11-2691999"
            },
            "electricity": {
                "name": "Ceylon Electricity Board",
                "contact_phone": "+94-11-2445678",
                "contact_email": "complaints@ceb.lk",
                "emergency_contact": "+94-11-2445999"
            },
            "water": {
                "name": "National Water Supply & Drainage Board",
                "contact_phone": "+94-11-2446622",
                "contact_email": "info@nwsdb.lk",
                "emergency_contact": "+94-11-2446999"
            },
            "waste": {
                "name": "Municipal Council Colombo - Waste",
                "contact_phone": "+94-11-2323232",
                "contact_email": "waste@colombo.mc.gov.lk",
                "emergency_contact": "+94-11-2323999"
            },
            "safety": {
                "name": "Sri Lanka Police - Traffic Division",
                "contact_phone": "+94-11-2421111",
                "contact_email": "traffic@police.lk",
                "emergency_contact": "119"
            },
            "health": {
                "name": "Ministry of Health",
                "contact_phone": "+94-11-2694033",
                "contact_email": "info@health.gov.lk",
                "emergency_contact": "+94-11-2694999"
            },
            "environment": {
                "name": "Central Environmental Authority",
                "contact_phone": "+94-11-2872278",
                "contact_email": "info@cea.lk",
                "emergency_contact": "+94-11-2872999"
            },
            "infrastructure": {
                "name": "Urban Development Authority",
                "contact_phone": "+94-11-2581581",
                "contact_email": "info@uda.gov.lk",
                "emergency_contact": "+94-11-2581999"
            }
        }
    
    def prepare_image(self, image_content: bytes) -> str:
        """Convert image to base64 for Gemini API"""
        try:
            # Open and process image
            image = Image.open(BytesIO(image_content))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (Gemini has size limits)
            max_size = (1024, 1024)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Convert to base64
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=85)
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return image_base64
        except Exception as e:
            raise ValueError(f"Error processing image: {str(e)}")
    
    def create_analysis_prompt(self, location: Optional[str] = None) -> str:
        """Create a structured prompt for civic issue analysis"""
        location_context = f"\nLocation context: {location}" if location else ""
        
        return f"""
You are an AI assistant specialized in analyzing civic infrastructure issues for government services in Sri Lanka. 
Analyze the provided image and identify any civic issues that require government attention.

{location_context}

Please analyze the image and provide a JSON response with the following structure:
{{
    "detected_issue": "Brief description of the main issue (max 100 chars)",
    "category": "One of: roads, electricity, water, waste, safety, health, environment, infrastructure",
    "description": "Detailed description of the issue and its potential impact (max 300 chars)",
    "severity_level": "Number from 1-4 (1=low, 2=medium, 3=high, 4=critical)",
    "confidence_score": "Float from 0.0-1.0 indicating analysis confidence",
    "analysis_details": {{
        "issue_type": "Specific type of issue detected",
        "urgency_indicators": ["List", "of", "urgency", "factors"],
        "safety_concerns": "Any safety risks identified",
        "estimated_impact": "Potential impact on community"
    }}
}}

Categories explained:
- roads: Potholes, cracks, traffic signs, road damage
- electricity: Power lines, street lights, electrical hazards
- water: Leaks, flooding, drainage, water supply issues  
- waste: Garbage, illegal dumping, sanitation
- safety: Traffic hazards, damaged barriers, security concerns
- health: Public health hazards, hygiene issues
- environment: Pollution, environmental damage
- infrastructure: Buildings, public facilities, general infrastructure

Focus on issues that require government intervention. Be specific and accurate in your assessment.
Provide only the JSON response, no additional text.
"""

    async def analyze_image(
        self, 
        image_content: bytes, 
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze civic issue in image using Gemini Vision"""
        
        # If API is not available, return mock response
        if not self.api_available:
            return self._create_mock_response(location)
            
        try:
            # Prepare image
            image_base64 = self.prepare_image(image_content)
            
            # Create prompt
            prompt = self.create_analysis_prompt(location)
            
            # Use Gemini Pro Vision model directly for better image analysis
            # Note: 'gemini-pro-vision' has been deprecated, using 'gemini-1.5-flash' instead
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Prepare the image for Gemini
            image_part = {
                "mime_type": "image/jpeg",
                "data": base64.b64decode(image_base64)
            }
            
            # Generate response
            response = model.generate_content([prompt, image_part])
            
            # Parse JSON response
            try:
                # Clean the response text
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text.replace('```json', '').replace('```', '').strip()
                elif response_text.startswith('```'):
                    response_text = response_text.replace('```', '').strip()
                
                analysis_result = json.loads(response_text)
                
                # Validate required fields
                required_fields = ['detected_issue', 'category', 'description', 'severity_level', 'confidence_score']
                for field in required_fields:
                    if field not in analysis_result:
                        raise ValueError(f"Missing required field: {field}")
                
                # Get appropriate authority based on category
                category = analysis_result.get('category', 'infrastructure')
                recommended_authority = self.authority_mapping.get(category, self.authority_mapping['infrastructure'])
                
                # Structure final response
                final_result = {
                    "detected_issue": analysis_result['detected_issue'],
                    "category": category,
                    "description": analysis_result['description'],
                    "severity_level": int(analysis_result['severity_level']),
                    "confidence_score": float(analysis_result['confidence_score']),
                    "recommended_authority": recommended_authority,
                    "analysis_details": analysis_result.get('analysis_details', {}),
                    "suggested_location": location
                }
                
                return final_result
                
            except json.JSONDecodeError as e:
                # Fallback: create structured response from text
                return self._create_fallback_response(response.text, location)
                
        except Exception as e:
            # Log the actual error for debugging
            print(f"AI Analysis Error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            # Return error analysis
            return self._create_error_response(str(e), location)
    
    def _create_fallback_response(self, response_text: str, location: Optional[str]) -> Dict[str, Any]:
        """Create fallback response when JSON parsing fails"""
        # Simple keyword-based category detection
        text_lower = response_text.lower()
        
        category = "infrastructure"  # default
        if any(word in text_lower for word in ['pothole', 'road', 'traffic', 'pavement']):
            category = "roads"
        elif any(word in text_lower for word in ['light', 'power', 'electric', 'cable']):
            category = "electricity"
        elif any(word in text_lower for word in ['water', 'leak', 'flood', 'drainage']):
            category = "water"
        elif any(word in text_lower for word in ['garbage', 'waste', 'trash', 'litter']):
            category = "waste"
        elif any(word in text_lower for word in ['safety', 'danger', 'hazard', 'barrier']):
            category = "safety"
        
        # Determine severity based on keywords
        severity = 2  # default medium
        if any(word in text_lower for word in ['critical', 'dangerous', 'emergency', 'urgent']):
            severity = 4
        elif any(word in text_lower for word in ['serious', 'significant', 'major']):
            severity = 3
        elif any(word in text_lower for word in ['minor', 'small', 'slight']):
            severity = 1
        
        return {
            "detected_issue": "Civic infrastructure issue detected",
            "category": category,
            "description": f"AI analysis detected a {category} issue requiring attention.",
            "severity_level": severity,
            "confidence_score": 0.75,
            "recommended_authority": self.authority_mapping.get(category, self.authority_mapping['infrastructure']),
            "analysis_details": {
                "raw_response": response_text[:200]  # First 200 chars
            },
            "suggested_location": location
        }
    
    def _create_mock_response(self, location: Optional[str]) -> Dict[str, Any]:
        """Create mock response when API is not available"""
        import random
        
        # Select random mock scenario
        mock_scenarios = [
            {
                "detected_issue": "Road surface damage detected",
                "category": "roads",
                "description": "Mock AI analysis - detected potential road infrastructure issue.",
                "severity_level": 2,
                "confidence_score": 0.85
            },
            {
                "detected_issue": "Street lighting issue",
                "category": "electricity", 
                "description": "Mock AI analysis - detected potential electrical infrastructure issue.",
                "severity_level": 2,
                "confidence_score": 0.82
            },
            {
                "detected_issue": "Waste management concern",
                "category": "waste",
                "description": "Mock AI analysis - detected potential waste management issue.",
                "severity_level": 1,
                "confidence_score": 0.78
            }
        ]
        
        selected = random.choice(mock_scenarios)
        category = selected['category']
        
        return {
            "detected_issue": selected['detected_issue'],
            "category": category,
            "description": selected['description'],
            "severity_level": selected['severity_level'],
            "confidence_score": selected['confidence_score'],
            "recommended_authority": self.authority_mapping.get(category, self.authority_mapping['infrastructure']),
            "analysis_details": {
                "note": "This is a mock response - set GOOGLE_API_KEY for real AI analysis"
            },
            "suggested_location": location
        }

    def _create_error_response(self, error_message: str, location: Optional[str]) -> Dict[str, Any]:
        """Create error response when analysis fails"""
        return {
            "detected_issue": "Unable to analyze image",
            "category": "infrastructure",
            "description": "Image analysis failed. Please provide manual description.",
            "severity_level": 2,
            "confidence_score": 0.0,
            "recommended_authority": self.authority_mapping['infrastructure'],
            "analysis_details": {
                "error": error_message
            },
            "suggested_location": location
        }


# Global instance
gemini_service = GeminiAnalysisService()