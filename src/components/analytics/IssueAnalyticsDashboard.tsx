'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  MapPin, 
  Star, 
  AlertTriangle,
  Calendar,
  Users,
  Target,
  Activity,
  BarChart3
} from 'lucide-react'
import { AnalyticsMapClient } from '@/components/maps/AnalyticsMapClient'

interface AnalyticsData {
  departmentPerformance: any[]
  peakHours: any[]
  locationHotspots: any[]
  categoryTrends: any[]
  resolutionTrends: any[]
  satisfactionTrends: any[]
}

interface IssueAnalyticsDashboardProps {
  timeRange?: number // days
  onRefresh?: () => void
}

export function IssueAnalyticsDashboard({ timeRange = 30, onRefresh }: IssueAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    departmentPerformance: [],
    peakHours: [],
    locationHotspots: [],
    categoryTrends: [],
    resolutionTrends: [],
    satisfactionTrends: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      // Fetch analytics data from backend
      const [deptResponse, peakResponse, hotspotsResponse, categoryResponse, resolutionResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v1/analytics/department-performance?days=${timeRange}`),
        fetch(`${BACKEND_URL}/api/v1/analytics/peak-hours?days=${timeRange}`),
        fetch(`${BACKEND_URL}/api/v1/analytics/location-hotspots?days=${timeRange}`),
        fetch(`${BACKEND_URL}/api/v1/analytics/category-distribution?days=${timeRange}`),
        fetch(`${BACKEND_URL}/api/v1/analytics/resolution-trends?days=${timeRange}`)
      ])

      const [deptData, peakData, hotspotsData, categoryData, resolutionData] = await Promise.all([
        deptResponse.json(),
        peakResponse.json(),
        hotspotsResponse.json(),
        categoryResponse.json(),
        resolutionResponse.json()
      ])

      setAnalytics({
        departmentPerformance: deptData.success ? deptData.data : [],
        peakHours: peakData.success ? peakData.data : [],
        locationHotspots: hotspotsData.success ? hotspotsData.data : [],
        categoryTrends: categoryData.success ? categoryData.data : [],
        resolutionTrends: resolutionData.success ? [resolutionData.data] : [],
        satisfactionTrends: generateMockSatisfactionTrends() // Keep this as mock for now
      })

    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Failed to load analytics data')
      
      // Fallback to mock data for demo
      setAnalytics({
        departmentPerformance: generateMockDepartmentData(),
        peakHours: generateMockPeakHours(),
        locationHotspots: generateMockHotspots(),
        categoryTrends: generateMockCategoryTrends(),
        resolutionTrends: generateMockResolutionTrends(),
        satisfactionTrends: generateMockSatisfactionTrends()
      })
    } finally {
      setLoading(false)
    }
  }

  // Mock data generators for demo purposes
  const generateMockDepartmentData = () => [
    { name: 'Road Development', total: 45, resolved: 38, resolution_rate: 84.4, avg_satisfaction: 4.2 },
    { name: 'Water Supply', total: 32, resolved: 28, resolution_rate: 87.5, avg_satisfaction: 4.0 },
    { name: 'Electricity Board', total: 28, resolved: 22, resolution_rate: 78.6, avg_satisfaction: 3.8 },
    { name: 'Waste Management', total: 23, resolved: 20, resolution_rate: 87.0, avg_satisfaction: 4.1 },
    { name: 'Public Safety', total: 15, resolved: 12, resolution_rate: 80.0, avg_satisfaction: 3.9 }
  ]

  const generateMockPeakHours = () => 
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      issues: Math.floor(Math.random() * 20) + (i >= 8 && i <= 18 ? 10 : 2)
    }))

  const generateMockHotspots = () => [
    { location: 'Galle Road, Colombo', issues: 12, lat: 6.8842, lng: 79.8570 },
    { location: 'Kandy Road, Colombo', issues: 8, lat: 6.9218, lng: 79.8604 },
    { location: 'High Level Road', issues: 6, lat: 6.8673, lng: 79.8776 }
  ]

  const generateMockCategoryTrends = () => 
    ['roads', 'electricity', 'water', 'waste', 'safety'].map(cat => ({
      category: cat,
      thisMonth: Math.floor(Math.random() * 50) + 10,
      lastMonth: Math.floor(Math.random() * 50) + 10,
      change: Math.floor(Math.random() * 40) - 20
    }))

  const generateMockResolutionTrends = () =>
    Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      resolved: Math.floor(Math.random() * 15) + 5,
      created: Math.floor(Math.random() * 20) + 8
    }))

  const generateMockSatisfactionTrends = () =>
    Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      satisfaction: 3.5 + Math.random() * 1.0
    }))


  if (loading) {
    return (
      <div className="space-y-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.departmentPerformance.reduce((sum, dept) => sum + dept.total, 0)}
              </p>
              <p className="text-sm text-green-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% from last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-2xl">
              <AlertTriangle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.departmentPerformance.length > 0 
                  ? Math.round(analytics.departmentPerformance.reduce((sum, dept) => sum + dept.resolution_rate, 0) / analytics.departmentPerformance.length)
                  : 0}%
              </p>
              <p className="text-sm text-green-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5% from last month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-2xl">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-gray-900">24h</p>
              <p className="text-sm text-red-600 flex items-center">
                <TrendingDown className="h-4 w-4 mr-1" />
                -8% from last month
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-2xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.departmentPerformance.length > 0 
                  ? (analytics.departmentPerformance.reduce((sum, dept) => sum + (dept.avg_satisfaction || 0), 0) / analytics.departmentPerformance.length).toFixed(1)
                  : '0.0'}
              </p>
              <p className="text-sm text-green-600 flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Excellent rating
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-2xl">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid - Simple Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Performance */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Department Performance
          </h3>
          <div className="space-y-4">
            {analytics.departmentPerformance.slice(0, 5).map((dept, index) => (
              <div key={dept.name || index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{dept.name || 'Unknown'}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {dept.resolved}/{dept.total} ({Math.round((dept.resolved/dept.total)*100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((dept.resolved/dept.total)*100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours Analysis */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-purple-600" />
            Peak Hours Analysis
          </h3>
          <div className="grid grid-cols-8 gap-2">
            {analytics.peakHours.slice(8, 20).map((hour) => (
              <div key={hour.hour} className="text-center">
                <div className="relative">
                  <div 
                    className="bg-gradient-to-t from-purple-500 to-purple-300 rounded-t mx-auto transition-all duration-300 hover:scale-105"
                    style={{ 
                      width: '24px',
                      height: `${Math.max((hour.issues / Math.max(...analytics.peakHours.map(h => h.issues))) * 60, 8)}px`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{hour.hour}:00</div>
                <div className="text-xs font-bold text-purple-600">{hour.issues}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Busiest hours: 9AM - 5PM work period</p>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-600" />
            Category Distribution
          </h3>
          <div className="space-y-3">
            {analytics.categoryTrends.slice(0, 6).map((category, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-indigo-500']
              const total = analytics.categoryTrends.reduce((sum, cat) => sum + cat.thisMonth, 0)
              const percentage = total > 0 ? Math.round((category.thisMonth / total) * 100) : 0
              
              return (
                <div key={category.category} className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {category.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{category.thisMonth}</span>
                      <span className="text-xs font-bold text-blue-600">({percentage}%)</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resolution Trends */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Resolution Trends (30 Days)
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-green-800">Total Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.resolutionTrends.reduce((sum, day) => sum + day.resolved, 0)}
                </p>
              </div>
              <div className="text-green-500">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Created</p>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.resolutionTrends.reduce((sum, day) => sum + day.created, 0)}
                </p>
              </div>
              <div className="text-blue-500">
                <Activity className="h-8 w-8" />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Resolution Rate</span>
                <span className="text-lg font-bold text-gray-900">
                  {analytics.resolutionTrends.length > 0 ? 
                    Math.round((analytics.resolutionTrends.reduce((sum, day) => sum + day.resolved, 0) / 
                    analytics.resolutionTrends.reduce((sum, day) => sum + day.created, 0)) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Hotspots Map and Data */}
      <div className="space-y-6">
        {/* Interactive Map */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-red-600" />
            Issues Location Map
          </h3>
          <div className="rounded-lg overflow-hidden">
            <AnalyticsMapClient 
              hotspots={analytics.locationHotspots}
              height="500px"
              showControls={true}
              onLocationClick={(hotspot) => {
                console.log('Location clicked:', hotspot)
                // Could add modal or detail view here
              }}
            />
          </div>
        </div>

        {/* Location Hotspots Table */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Location Hotspots</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coordinates
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.locationHotspots.map((hotspot, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {hotspot.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {hotspot.issues_count} issues
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {hotspot.top_category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        hotspot.avg_severity >= 3.5 ? 'text-red-600' :
                        hotspot.avg_severity >= 2.5 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {hotspot.avg_severity?.toFixed(1)}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {hotspot.latitude?.toFixed(4)}, {hotspot.longitude?.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}