'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
// Note: CSS import moved to client-side component to avoid SSR issues
import { 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Navigation,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'

// Fix Leaflet default markers in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface Issue {
  id: string
  title?: string
  category: string
  status: string
  severity_level: number
  latitude: number
  longitude: number
  location: string
  created_at: string
  distance_km?: number
  description?: string
}

interface IssuesMapProps {
  center?: [number, number]
  zoom?: number
  issues?: Issue[]
  onIssueClick?: (issue: Issue) => void
  height?: string
  showControls?: boolean
  radiusKm?: number
}

// Custom marker icons based on severity and status
const createCustomIcon = (severity: number, status: string) => {
  let color = '#6b7280' // default gray
  
  // Color by severity
  switch (severity) {
    case 1: color = '#10b981'; break // green - low
    case 2: color = '#f59e0b'; break // yellow - medium  
    case 3: color = '#f97316'; break // orange - high
    case 4: color = '#ef4444'; break // red - critical
  }
  
  // Adjust opacity based on status
  const opacity = status === 'resolved' ? 0.6 : 1.0
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        opacity: ${opacity};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background-color: white;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-100'
    case 'under_review': return 'text-blue-600 bg-blue-100'
    case 'assigned': return 'text-purple-600 bg-purple-100'
    case 'in_progress': return 'text-orange-600 bg-orange-100'
    case 'resolved': return 'text-green-600 bg-green-100'
    case 'closed': return 'text-gray-600 bg-gray-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

const getSeverityLabel = (level: number) => {
  switch (level) {
    case 1: return 'Low'
    case 2: return 'Medium'
    case 3: return 'High'
    case 4: return 'Critical'
    default: return 'Unknown'
  }
}

const getSeverityColor = (level: number) => {
  switch (level) {
    case 1: return 'text-green-600'
    case 2: return 'text-yellow-600'
    case 3: return 'text-orange-600'
    case 4: return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// Component to handle map location updates
function LocationUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    if (map && center) {
      map.setView(center, map.getZoom())
    }
  }, [center, map])
  
  return null
}

function IssuesMapComponent({
  center = [6.9271, 79.8612], // Colombo, Sri Lanka
  zoom = 13,
  issues = [],
  onIssueClick,
  height = '500px',
  showControls = true
}: IssuesMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          setMapCenter(newCenter)
          setUserLocation(newCenter)
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  // Filter issues that have valid coordinates
  const validIssues = useMemo(() => 
    issues.filter(issue => 
      issue.latitude && 
      issue.longitude && 
      !isNaN(issue.latitude) && 
      !isNaN(issue.longitude)
    ), [issues]
  )

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationUpdater center={mapCenter} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={L.divIcon({
              className: 'user-location-icon',
              html: `
                <div style="
                  background-color: #3b82f6;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-blue-600">Your Location</h3>
                <p className="text-sm text-gray-600">Current position</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Issue markers */}
        {validIssues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={createCustomIcon(issue.severity_level, issue.status)}
          >
            <Popup>
              <div className="p-2 min-w-[280px]">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {issue.title || `${issue.category} Issue`}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(issue.status)}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{issue.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(issue.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className={`font-bold ${getSeverityColor(issue.severity_level)}`}>
                      {getSeverityLabel(issue.severity_level)}
                    </div>
                  </div>
                  
                  {issue.description && (
                    <p className="text-gray-700 text-xs leading-relaxed mt-2">
                      {issue.description.length > 100 ? 
                        `${issue.description.substring(0, 100)}...` : 
                        issue.description
                      }
                    </p>
                  )}
                  
                  {issue.distance_km && (
                    <div className="flex items-center text-blue-600 text-xs font-medium">
                      <Navigation className="h-3 w-3 mr-1" />
                      {issue.distance_km} km away
                    </div>
                  )}
                </div>
                
                {onIssueClick && (
                  <button
                    onClick={() => onIssueClick(issue)}
                    className="w-full mt-3 inline-flex items-center justify-center px-3 py-2 bg-government-dark-blue text-white text-xs font-medium rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 z-[1000]">
        <h4 className="font-bold text-gray-900 text-sm mb-3">Issue Severity</h4>
        <div className="space-y-2">
          {[
            { level: 1, label: 'Low', color: '#10b981' },
            { level: 2, label: 'Medium', color: '#f59e0b' },
            { level: 3, label: 'High', color: '#f97316' },
            { level: 4, label: 'Critical', color: '#ef4444' }
          ].map(({ level, label, color }) => (
            <div key={level} className="flex items-center text-xs">
              <div 
                className="w-4 h-4 rounded-full mr-2 border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-4 h-4 rounded-full mr-2 bg-blue-500 border-2 border-white shadow-sm"></div>
            <span>Your Location</span>
          </div>
        </div>
      </div>
      
      {/* Issues Count */}
      {validIssues.length > 0 && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20 z-[1000]">
          <div className="flex items-center text-sm">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
            <span className="font-bold text-gray-900">{validIssues.length}</span>
            <span className="text-gray-600 ml-1">issues in area</span>
          </div>
        </div>
      )}

      {/* Locate Me Button */}
      {showControls && (
        <button
          onClick={handleLocateMe}
          className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20 z-[1000] hover:bg-white transition-colors"
          title="Find my location"
        >
          <Navigation className="h-5 w-5 text-government-dark-blue" />
        </button>
      )}
    </div>
  )
}

// Export the main component
export const IssuesMap = IssuesMapComponent

// Note: For SSR-safe usage, use DynamicIssuesMap from './DynamicIssuesMap' instead