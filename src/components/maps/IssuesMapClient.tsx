'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
  AlertTriangle, 
  Navigation
} from 'lucide-react'
import { format } from 'date-fns'

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

function IssuesMapClient({
  center = [6.9271, 79.8612], // Colombo, Sri Lanka
  zoom = 13,
  issues = [],
  onIssueClick,
  height = '500px',
  showControls = true
}: IssuesMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Leaflet directly in useEffect
  useEffect(() => {
    let mounted = true

    async function initializeMap() {
      try {
        // Import Leaflet CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        if (!document.querySelector(`link[href="${link.href}"]`)) {
          document.head.appendChild(link)
        }

        // Wait for CSS to load
        await new Promise(resolve => setTimeout(resolve, 100))

        // Import Leaflet
        const L = (await import('leaflet')).default

        // Fix default markers
        try {
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          })
        } catch (e) {
          console.log('Icon fix not needed')
        }

        if (mounted) {
          setMapLoaded(true)
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
        if (mounted) {
          setError('Failed to load map')
          setMapLoaded(true)
        }
      }
    }

    initializeMap()

    return () => {
      mounted = false
    }
  }, [])

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

  // Create map with raw Leaflet when React-Leaflet isn't working
  useEffect(() => {
    if (!mapLoaded || error) return

    let map: any = null

    async function createMap() {
      try {
        const L = (await import('leaflet')).default
        
        // Create map container
        const mapContainer = document.getElementById('leaflet-map-container')
        if (!mapContainer) return

        // Clear any existing map
        mapContainer.innerHTML = ''

        // Create map
        map = L.map(mapContainer).setView(userLocation || mapCenter, zoom)

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        // Add user location marker
        if (userLocation) {
          L.marker(userLocation)
            .addTo(map)
            .bindPopup('<b>Your Location</b>')
        }

        // Add issue markers with custom colors
        validIssues.forEach((issue) => {
          const severityColors = {
            1: '#10b981', // green
            2: '#f59e0b', // yellow/amber  
            3: '#f97316', // orange
            4: '#ef4444'  // red
          }
          
          const color = severityColors[issue.severity_level as keyof typeof severityColors] || '#6b7280'
          
          // Create custom colored marker using divIcon (bigger size)
          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="
                background-color: ${color};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  background-color: white;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                "></div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
          })

          const marker = L.marker([issue.latitude, issue.longitude], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; font-weight: bold;">
                  ${issue.title || `${issue.category.charAt(0).toUpperCase() + issue.category.slice(1)} Issue`}
                </h4>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                  📍 ${issue.location}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                  📅 ${format(new Date(issue.created_at), 'MMM d, yyyy')}
                </p>
                <p style="margin: 0 0 8px 0; font-size: 12px;">
                  <span style="background: ${issue.severity_level === 1 ? '#dcfce7' : issue.severity_level === 2 ? '#fef3c7' : issue.severity_level === 3 ? '#fed7aa' : '#fecaca'}; color: ${issue.severity_level === 1 ? '#065f46' : issue.severity_level === 2 ? '#92400e' : issue.severity_level === 3 ? '#9a3412' : '#991b1b'}; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                    ${getSeverityLabel(issue.severity_level)}
                  </span>
                </p>
                ${issue.description ? `<p style="margin: 0 0 8px 0; font-size: 12px;">${issue.description}</p>` : ''}
                ${issue.distance_km ? `<p style="margin: 0; font-size: 12px; color: #2563eb; font-weight: bold;">${issue.distance_km} km away</p>` : ''}
              </div>
            `)

          marker.on('click', () => {
            onIssueClick?.(issue)
          })
        })

      } catch (error) {
        console.error('Failed to create map:', error)
      }
    }

    createMap()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [mapLoaded, userLocation, validIssues, mapCenter, zoom, error])

  // If map is not loaded yet, show loading state
  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center rounded-2xl overflow-hidden border border-gray-200 shadow-lg" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-government-dark-blue mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading interactive map...</p>
        </div>
      </div>
    )
  }

  // Render the native Leaflet map
  return (
    <div className="relative">
      {/* Native Leaflet Map Container */}
      <div 
        id="leaflet-map-container"
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg"
        style={{ height }}
      ></div>
      
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

export default IssuesMapClient