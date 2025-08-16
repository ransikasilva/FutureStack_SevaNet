'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, AlertTriangle, Activity } from 'lucide-react'

// Define type for analytics location data
interface LocationHotspot {
  location: string
  issues_count: number
  latitude: number
  longitude: number
  top_category: string
  categories: { [key: string]: number }
  avg_severity: number
}

interface AnalyticsMapClientProps {
  hotspots: LocationHotspot[]
  height?: string
  showControls?: boolean
  onLocationClick?: (hotspot: LocationHotspot) => void
}

export function AnalyticsMapClient({ 
  hotspots, 
  height = "400px", 
  showControls = true,
  onLocationClick 
}: AnalyticsMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [L, setL] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const markersRef = useRef<any[]>([])

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        setIsLoading(true)
        
        // Load Leaflet CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        // Load Leaflet JS
        const leaflet = await import('leaflet')
        
        // Fix default marker icons
        delete (leaflet.Icon.Default.prototype as any)._getIconUrl
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })
        
        setL(leaflet)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
        setError('Failed to load map library')
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!L || !mapRef.current || map) return

    try {
      // Create map centered on Sri Lanka
      const mapInstance = L.map(mapRef.current).setView([7.8731, 80.7718], 8)

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance)

      setMap(mapInstance)
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setError('Failed to initialize map')
    }
  }, [L])

  // Get color based on issue count and severity
  const getMarkerColor = (issueCount: number, avgSeverity: number) => {
    if (avgSeverity >= 3.5) return '#dc2626' // High severity - red
    if (avgSeverity >= 2.5) return '#ea580c' // Medium severity - orange
    if (issueCount >= 3) return '#ca8a04' // Multiple issues - yellow
    return '#16a34a' // Low severity/few issues - green
  }

  // Get marker size based on issue count
  const getMarkerSize = (issueCount: number) => {
    if (issueCount >= 5) return 40
    if (issueCount >= 3) return 32
    if (issueCount >= 2) return 28
    return 24
  }

  // Add markers for hotspots
  useEffect(() => {
    if (!map || !L || !hotspots) return

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []

    // Add new markers
    hotspots.forEach((hotspot) => {
      if (hotspot.latitude && hotspot.longitude) {
        const color = getMarkerColor(hotspot.issues_count, hotspot.avg_severity)
        const size = getMarkerSize(hotspot.issues_count)
        
        // Create custom colored marker
        const customIcon = L.divIcon({
          className: 'custom-analytics-marker',
          html: `
            <div style="
              background-color: ${color}; 
              width: ${size}px; 
              height: ${size}px; 
              border-radius: 50%; 
              border: 4px solid white; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size > 30 ? '14px' : '12px'};
            ">${hotspot.issues_count}</div>
          `,
          iconSize: [size + 8, size + 8],
          iconAnchor: [(size + 8) / 2, (size + 8) / 2]
        })

        const marker = L.marker([hotspot.latitude, hotspot.longitude], { 
          icon: customIcon 
        }).addTo(map)

        // Create popup content
        const categoryList = Object.entries(hotspot.categories)
          .map(([cat, count]) => `${cat}: ${count}`)
          .join('<br/>')

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
              📍 ${hotspot.location}
            </h3>
            <div style="margin-bottom: 8px;">
              <strong>Total Issues:</strong> ${hotspot.issues_count}<br/>
              <strong>Average Severity:</strong> ${hotspot.avg_severity.toFixed(1)}/5<br/>
              <strong>Primary Category:</strong> ${hotspot.top_category}
            </div>
            <div style="background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 12px;">
              <strong>Categories:</strong><br/>
              ${categoryList}
            </div>
          </div>
        `

        marker.bindPopup(popupContent)

        // Add click handler
        if (onLocationClick) {
          marker.on('click', () => onLocationClick(hotspot))
        }

        markersRef.current.push(marker)
      }
    })

    // Fit map bounds to show all markers
    if (hotspots.length > 0) {
      const validHotspots = hotspots.filter(h => h.latitude && h.longitude)
      if (validHotspots.length > 0) {
        const group = new L.featureGroup(markersRef.current)
        map.fitBounds(group.getBounds().pad(0.1))
      }
    }

  }, [map, L, hotspots, onLocationClick])

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <Activity className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading analytics map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-red-50 rounded-lg border-2 border-dashed border-red-300"
        style={{ height }}
      >
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="rounded-lg border border-gray-200 shadow-sm"
        style={{ height, width: '100%' }}
      />
      
      {showControls && (
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm font-medium text-gray-900 mb-2">Legend</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>
              <span>High Severity (3.5+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-600 rounded-full border-2 border-white"></div>
              <span>Medium Severity (2.5+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-600 rounded-full border-2 border-white"></div>
              <span>Multiple Issues (3+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white"></div>
              <span>Low Impact</span>
            </div>
          </div>
        </div>
      )}

      {hotspots.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No location data available</p>
          </div>
        </div>
      )}
    </div>
  )
}