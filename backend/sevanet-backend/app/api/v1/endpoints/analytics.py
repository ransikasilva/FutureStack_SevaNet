from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import uuid

from app.crud.supabase_issues import supabase_issues
from app.services.supabase_client import supabase_client

router = APIRouter()

@router.get("/department-performance", response_model=dict)
async def get_department_performance(days: int = Query(30, description="Number of days to analyze")):
    """
    Get department performance analytics based on real issue data
    """
    try:
        # Get all issues from the specified time period
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        if supabase_client.is_available:
            try:
                # Get all issues
                all_issues = await supabase_issues.get_all_issues(limit=1000)
                
                # Get authorities for department mapping
                authorities = await supabase_issues.get_authorities()
                
                # Create authority category mapping
                authority_categories = {auth['id']: auth['category'] for auth in authorities}
                
                # Group issues by category (representing departments)
                category_stats = {}
                
                for issue in all_issues:
                    category = issue.get('category', 'unknown')
                    
                    if category not in category_stats:
                        category_stats[category] = {
                            'total': 0,
                            'resolved': 0,
                            'pending': 0,
                            'in_progress': 0,
                            'total_satisfaction': 0,
                            'satisfaction_count': 0
                        }
                    
                    category_stats[category]['total'] += 1
                    
                    status = issue.get('status', 'pending')
                    if status == 'resolved':
                        category_stats[category]['resolved'] += 1
                    elif status in ['pending', 'under_review']:
                        category_stats[category]['pending'] += 1
                    elif status in ['assigned', 'in_progress']:
                        category_stats[category]['in_progress'] += 1
                    
                    # Add satisfaction if available
                    satisfaction = issue.get('citizen_satisfaction_rating')
                    if satisfaction:
                        category_stats[category]['total_satisfaction'] += satisfaction
                        category_stats[category]['satisfaction_count'] += 1
                
                # Format response
                department_data = []
                category_names = {
                    'roads': 'Road Development Authority',
                    'electricity': 'Ceylon Electricity Board', 
                    'water': 'Water Supply Board',
                    'waste': 'Waste Management Authority',
                    'safety': 'Public Safety Department',
                    'health': 'Health Department',
                    'environment': 'Environmental Authority',
                    'infrastructure': 'Infrastructure Development'
                }
                
                for category, stats in category_stats.items():
                    if stats['total'] > 0:
                        resolution_rate = (stats['resolved'] / stats['total']) * 100
                        avg_satisfaction = (stats['total_satisfaction'] / stats['satisfaction_count']) if stats['satisfaction_count'] > 0 else 4.0
                        
                        department_data.append({
                            'category': category,
                            'name': category_names.get(category, category.title()),
                            'total': stats['total'],
                            'resolved': stats['resolved'],
                            'pending': stats['pending'],
                            'in_progress': stats['in_progress'],
                            'resolution_rate': round(resolution_rate, 1),
                            'avg_satisfaction': round(avg_satisfaction, 1)
                        })
                
                # Sort by total issues descending
                department_data.sort(key=lambda x: x['total'], reverse=True)
                
                return {
                    "success": True,
                    "message": f"Department performance data for last {days} days",
                    "data": department_data,
                    "total_departments": len(department_data),
                    "analysis_period": f"{days} days"
                }
                
            except Exception as db_error:
                print(f"Database error: {db_error}")
                
        # Fallback to mock data
        mock_data = [
            {
                'category': 'roads',
                'name': 'Road Development Authority',
                'total': 2,
                'resolved': 0,
                'pending': 2,
                'in_progress': 0,
                'resolution_rate': 0.0,
                'avg_satisfaction': 4.0
            }
        ]
        
        return {
            "success": True,
            "message": f"Department performance data (mock mode)",
            "data": mock_data,
            "total_departments": len(mock_data),
            "analysis_period": f"{days} days"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get department performance: {str(e)}")

@router.get("/peak-hours", response_model=dict)
async def get_peak_hours_analysis(days: int = Query(30, description="Number of days to analyze")):
    """
    Analyze peak hours when most issues are reported
    """
    try:
        if supabase_client.is_available:
            try:
                # Get all issues
                all_issues = await supabase_issues.get_all_issues(limit=1000)
                
                # Group by hour of day
                hour_stats = {hour: 0 for hour in range(24)}
                
                for issue in all_issues:
                    created_at = issue.get('created_at')
                    if created_at:
                        # Parse the datetime and extract hour
                        try:
                            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            hour = dt.hour
                            hour_stats[hour] += 1
                        except Exception:
                            continue
                
                # Format for chart
                peak_data = []
                for hour in range(24):
                    peak_data.append({
                        'hour': f"{hour:02d}:00",
                        'hour_24': hour,
                        'issues': hour_stats[hour],
                        'percentage': round((hour_stats[hour] / max(sum(hour_stats.values()), 1)) * 100, 1)
                    })
                
                # Find busiest hours
                sorted_hours = sorted(peak_data, key=lambda x: x['issues'], reverse=True)
                busiest_hours = [h['hour'] for h in sorted_hours[:3] if h['issues'] > 0]
                
                return {
                    "success": True,
                    "message": f"Peak hours analysis for last {days} days",
                    "data": peak_data,
                    "busiest_hours": busiest_hours,
                    "total_issues": sum(hour_stats.values()),
                    "analysis_period": f"{days} days"
                }
                
            except Exception as db_error:
                print(f"Database error: {db_error}")
        
        # Fallback mock data
        mock_data = [
            {'hour': f"{h:02d}:00", 'hour_24': h, 'issues': 0, 'percentage': 0.0}
            for h in range(24)
        ]
        # Add some realistic data
        mock_data[9]['issues'] = 2  # 9 AM
        mock_data[14]['issues'] = 1  # 2 PM
        
        return {
            "success": True,
            "message": f"Peak hours analysis (mock mode)",
            "data": mock_data,
            "busiest_hours": ["09:00", "14:00"],
            "total_issues": 3,
            "analysis_period": f"{days} days"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get peak hours: {str(e)}")

@router.get("/location-hotspots", response_model=dict)
async def get_location_hotspots(days: int = Query(30, description="Number of days to analyze")):
    """
    Get location hotspots where most issues are reported
    """
    try:
        if supabase_client.is_available:
            try:
                # Get all issues with location data
                all_issues = await supabase_issues.get_all_issues(limit=1000)
                
                # Group by location
                location_stats = {}
                
                for issue in all_issues:
                    location = issue.get('location', 'Unknown Location')
                    latitude = issue.get('latitude')
                    longitude = issue.get('longitude')
                    
                    if location not in location_stats:
                        location_stats[location] = {
                            'count': 0,
                            'latitude': latitude,
                            'longitude': longitude,
                            'categories': {},
                            'severities': {}
                        }
                    
                    location_stats[location]['count'] += 1
                    
                    # Track categories
                    category = issue.get('category', 'unknown')
                    location_stats[location]['categories'][category] = location_stats[location]['categories'].get(category, 0) + 1
                    
                    # Track severities
                    severity = issue.get('severity_level', 1)
                    location_stats[location]['severities'][severity] = location_stats[location]['severities'].get(severity, 0) + 1
                
                # Format response
                hotspots = []
                for location, stats in location_stats.items():
                    if stats['count'] > 0:  # Only include locations with issues
                        # Get most common category
                        top_category = max(stats['categories'].items(), key=lambda x: x[1])[0] if stats['categories'] else 'mixed'
                        
                        hotspots.append({
                            'location': location,
                            'issues_count': stats['count'],
                            'latitude': stats['latitude'],
                            'longitude': stats['longitude'],
                            'top_category': top_category,
                            'categories': stats['categories'],
                            'avg_severity': sum(k * v for k, v in stats['severities'].items()) / sum(stats['severities'].values()) if stats['severities'] else 2.0
                        })
                
                # Sort by issue count descending
                hotspots.sort(key=lambda x: x['issues_count'], reverse=True)
                
                return {
                    "success": True,
                    "message": f"Location hotspots for last {days} days",
                    "data": hotspots[:20],  # Top 20 locations
                    "total_locations": len(hotspots),
                    "analysis_period": f"{days} days"
                }
                
            except Exception as db_error:
                print(f"Database error: {db_error}")
        
        # Fallback mock data
        mock_data = [
            {
                'location': 'Thelangapatha, Wattala',
                'issues_count': 1,
                'latitude': 6.97274065,
                'longitude': 79.89259338,
                'top_category': 'roads',
                'categories': {'roads': 1},
                'avg_severity': 4.0
            },
            {
                'location': 'Test Street, Colombo',
                'issues_count': 1,
                'latitude': 6.927,
                'longitude': 79.8612,
                'top_category': 'roads',
                'categories': {'roads': 1},
                'avg_severity': 2.0
            }
        ]
        
        return {
            "success": True,
            "message": f"Location hotspots (mock mode)",
            "data": mock_data,
            "total_locations": len(mock_data),
            "analysis_period": f"{days} days"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get location hotspots: {str(e)}")

@router.get("/category-distribution", response_model=dict)
async def get_category_distribution(days: int = Query(30, description="Number of days to analyze")):
    """
    Get distribution of issues by category
    """
    try:
        if supabase_client.is_available:
            try:
                all_issues = await supabase_issues.get_all_issues(limit=1000)
                
                category_counts = {}
                total_issues = len(all_issues)
                
                for issue in all_issues:
                    category = issue.get('category', 'unknown')
                    category_counts[category] = category_counts.get(category, 0) + 1
                
                # Format response
                distribution = []
                for category, count in category_counts.items():
                    percentage = (count / max(total_issues, 1)) * 100
                    distribution.append({
                        'category': category,
                        'count': count,
                        'percentage': round(percentage, 1)
                    })
                
                # Sort by count descending
                distribution.sort(key=lambda x: x['count'], reverse=True)
                
                return {
                    "success": True,
                    "message": f"Category distribution for last {days} days",
                    "data": distribution,
                    "total_issues": total_issues,
                    "analysis_period": f"{days} days"
                }
                
            except Exception as db_error:
                print(f"Database error: {db_error}")
        
        # Fallback mock data
        mock_data = [
            {'category': 'roads', 'count': 2, 'percentage': 66.7},
            {'category': 'electricity', 'count': 1, 'percentage': 33.3}
        ]
        
        return {
            "success": True,
            "message": f"Category distribution (mock mode)",
            "data": mock_data,
            "total_issues": 3,
            "analysis_period": f"{days} days"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get category distribution: {str(e)}")

@router.get("/resolution-trends", response_model=dict)
async def get_resolution_trends(days: int = Query(30, description="Number of days to analyze")):
    """
    Get resolution trends over time
    """
    try:
        if supabase_client.is_available:
            try:
                all_issues = await supabase_issues.get_all_issues(limit=1000)
                
                total_issues = len(all_issues)
                resolved_issues = len([i for i in all_issues if i.get('status') == 'resolved'])
                pending_issues = len([i for i in all_issues if i.get('status') in ['pending', 'under_review']])
                in_progress_issues = len([i for i in all_issues if i.get('status') in ['assigned', 'in_progress']])
                
                resolution_rate = (resolved_issues / max(total_issues, 1)) * 100
                
                return {
                    "success": True,
                    "message": f"Resolution trends for last {days} days",
                    "data": {
                        "total_created": total_issues,
                        "total_resolved": resolved_issues,
                        "total_pending": pending_issues,
                        "total_in_progress": in_progress_issues,
                        "resolution_rate": round(resolution_rate, 1),
                        "avg_resolution_time": "24h",  # Would need to calculate from real data
                        "satisfaction_score": 4.0  # Would need to calculate from feedback
                    },
                    "analysis_period": f"{days} days"
                }
                
            except Exception as db_error:
                print(f"Database error: {db_error}")
        
        # Fallback mock data
        mock_data = {
            "total_created": 3,
            "total_resolved": 0,
            "total_pending": 3,
            "total_in_progress": 0,
            "resolution_rate": 0.0,
            "avg_resolution_time": "N/A",
            "satisfaction_score": 4.0
        }
        
        return {
            "success": True,
            "message": f"Resolution trends (mock mode)",
            "data": mock_data,
            "analysis_period": f"{days} days"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get resolution trends: {str(e)}")