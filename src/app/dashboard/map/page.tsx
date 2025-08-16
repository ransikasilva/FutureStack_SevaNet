'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DynamicIssuesMap } from '@/components/maps/DynamicIssuesMap'
import { useNearbyIssues, Issue } from '@/hooks/useIssues'
import { 
  MapPin, 
  Navigation, 
  Settings, 
  AlertTriangle,
  Calendar,
  Clock,
  XCircle,
  Eye,
  Filter,
  Layers
} from 'lucide-react'
import { format } from 'date-fns'

interface MapFilters {
  categories: string[]
  statuses: string[]
  severityLevels: number[]
  radiusKm: number
}

function MapContent() {
  const { user } = useAuthContext()
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([6.9271, 79.8612]) // Colombo default
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<MapFilters>({
    categories: [],
    statuses: [],
    severityLevels: [],
    radiusKm: 10
  })

  const { issues, loading, error, refetch } = useNearbyIssues(
    mapCenter[0],
    mapCenter[1],
    filters.radiusKm,
    100
  )

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          setUserLocation(location)
          setMapCenter(location)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  // Filter issues based on selected filters
  const filteredIssues = issues.filter(issue => {
    const categoryMatch = filters.categories.length === 0 || filters.categories.includes(issue.category)
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(issue.status)
    const severityMatch = filters.severityLevels.length === 0 || filters.severityLevels.includes(issue.severity_level)
    
    return categoryMatch && statusMatch && severityMatch
  })

  const categories = [
    { value: 'roads', label: 'Roads & Transportation', icon: '🛣️' },
    { value: 'electricity', label: 'Electricity & Power', icon: '⚡' },
    { value: 'water', label: 'Water Supply', icon: '💧' },
    { value: 'waste', label: 'Waste Management', icon: '🗑️' },
    { value: 'safety', label: 'Public Safety', icon: '🚨' },
    { value: 'health', label: 'Health Services', icon: '🏥' },
    { value: 'environment', label: 'Environment', icon: '🌿' },
    { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' }
  ]

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'under_review', label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
    { value: 'assigned', label: 'Assigned', color: 'bg-purple-100 text-purple-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' }
  ]

  const severityLevels = [
    { value: 1, label: 'Low', color: 'text-green-600' },
    { value: 2, label: 'Medium', color: 'text-yellow-600' },
    { value: 3, label: 'High', color: 'text-orange-600' },
    { value: 4, label: 'Critical', color: 'text-red-600' }
  ]

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption?.color || 'bg-gray-100 text-gray-800'
  }

  const getSeverityColor = (level: number) => {
    const severity = severityLevels.find(s => s.value === level)
    return severity?.color || 'text-gray-600'
  }

  const handleFilterChange = (type: keyof MapFilters, value: any, checked: boolean) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      if (type === 'radiusKm') {
        newFilters[type] = value
      } else {
        const currentArray = newFilters[type] as any[]
        if (checked) {
          newFilters[type] = [...currentArray, value] as any
        } else {
          newFilters[type] = currentArray.filter(item => item !== value) as any
        }
      }
      
      return newFilters
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative">
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-2 rounded-xl mr-3">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Interactive Map</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Issues Map
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
            Explore civic issues in your area and help improve your community
          </p>
        </div>
      </div>

      {/* Map Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
              showFilters 
                ? 'bg-government-dark-blue text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium disabled:opacity-50"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
            <span className="font-medium">{filteredIssues.length}</span> issues shown
          </div>
          {userLocation && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-blue-500" />
              <span>Location enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.value)}
                      onChange={(e) => handleFilterChange('categories', category.value, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-government-dark-blue focus:ring-government-dark-blue"
                    />
                    <span className="text-sm">{category.icon} {category.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Status</h3>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status.value)}
                      onChange={(e) => handleFilterChange('statuses', status.value, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-government-dark-blue focus:ring-government-dark-blue"
                    />
                    <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Severity</h3>
              <div className="space-y-2">
                {severityLevels.map((severity) => (
                  <label key={severity.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.severityLevels.includes(severity.value)}
                      onChange={(e) => handleFilterChange('severityLevels', severity.value, e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-government-dark-blue focus:ring-government-dark-blue"
                    />
                    <span className={`text-sm font-medium ${severity.color}`}>
                      {severity.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Radius Filter */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Search Radius</h3>
              <div className="space-y-3">
                <div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={filters.radiusKm}
                    onChange={(e) => handleFilterChange('radiusKm', parseInt(e.target.value), true)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1km</span>
                    <span className="font-medium">{filters.radiusKm}km</span>
                    <span>50km</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setFilters({
                    categories: [],
                    statuses: [],
                    severityLevels: [],
                    radiusKm: 10
                  })}
                  className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
        {error ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Map</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-6 py-3 bg-government-dark-blue text-white font-bold rounded-xl hover:bg-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : (
          <DynamicIssuesMap
            center={mapCenter}
            zoom={13}
            issues={filteredIssues}
            onIssueClick={setSelectedIssue}
            height="600px"
            showControls={true}
            radiusKm={filters.radiusKm}
          />
        )}
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-government-dark-blue bg-opacity-60 transition-opacity" onClick={() => setSelectedIssue(null)} />

            <div className="relative inline-block align-bottom bg-white/95 backdrop-blur-xl rounded-3xl px-8 pt-8 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 rounded-3xl"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-gray-900">
                    Issue Details
                  </h3>
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <h4 className="text-xl font-bold text-gray-900">
                        {selectedIssue.title || `${selectedIssue.category} Issue`}
                      </h4>
                      <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(selectedIssue.status)}`}>
                        {selectedIssue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2 font-medium capitalize">{selectedIssue.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Severity:</span>
                        <span className={`ml-2 font-bold ${getSeverityColor(selectedIssue.severity_level)}`}>
                          {severityLevels.find(s => s.value === selectedIssue.severity_level)?.label || 'Unknown'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Location:</span>
                        <span className="ml-2">{selectedIssue.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Reported:</span>
                        <span className="ml-2">{format(new Date(selectedIssue.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      {selectedIssue.distance_km && (
                        <div>
                          <span className="text-gray-500">Distance:</span>
                          <span className="ml-2 font-medium text-blue-600">{selectedIssue.distance_km} km away</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedIssue.description && (
                    <div>
                      <h5 className="font-bold text-gray-900 mb-2">Description</h5>
                      <p className="text-gray-700 leading-relaxed">{selectedIssue.description}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelectedIssue(null)}
                      className="px-6 py-3 bg-government-dark-blue text-white font-bold rounded-xl hover:bg-blue-800 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <MapContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}