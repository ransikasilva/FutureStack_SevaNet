'use client'

import { useEffect, useRef, useState } from 'react'

interface LocationMapProps {
  latitude: number
  longitude: number
  address?: string
  className?: string
  zoom?: number // Zoom level (default 18 for street level)
}

export function LocationMap({ latitude, longitude, address, className, zoom = 18 }: LocationMapProps) {
  const mapRef = useRef<HTMLIFrameElement>(null)
  const [mapError, setMapError] = useState(false)

  // Create a highly zoomed OpenStreetMap URL with proper bounding box
  const zoomOffset = 0.001 // Small offset for street-level zoom (about 100m radius)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-zoomOffset},${latitude-zoomOffset},${longitude+zoomOffset},${latitude+zoomOffset}&layer=mapnik&marker=${latitude}%2C${longitude}`

  const handleMapError = () => {
    setMapError(true)
  }

  if (mapError) {
    // Fallback to static map representation
    return (
      <div className={`relative rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-br from-green-100 to-blue-100 ${className || 'h-48'}`}>
        {/* Grid background to simulate map */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>
        
        {/* Location pin */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <div className="w-1 h-6 bg-red-500 -mt-1"></div>
          </div>
        </div>
        
        {/* Address overlay */}
        {address && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="truncate">{address}</span>
            </div>
          </div>
        )}
        
        {/* Coordinates info */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600 shadow-sm">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
        
        {/* Map error notice */}
        <div className="absolute top-2 left-2 bg-yellow-100 border border-yellow-300 rounded px-2 py-1 text-xs text-yellow-800">
          📍 Location Preview
        </div>
      </div>
    )
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className || 'h-48'}`}>
      {/* Use reliable OpenStreetMap embed */}
      <iframe
        ref={mapRef}
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        title={`Interactive map showing ${address || `${latitude}, ${longitude}`}`}
        loading="lazy"
        allowFullScreen
        onError={handleMapError}
        onLoad={(e) => {
          // Check if iframe loaded successfully
          const iframe = e.target as HTMLIFrameElement
          try {
            // If we can't access the iframe content, it might have failed to load
            setTimeout(() => {
              if (!iframe.contentDocument && !iframe.contentWindow) {
                handleMapError()
              }
            }, 3000)
          } catch (error) {
            // Cross-origin issues are expected, this is normal
          }
        }}
      />
      
      {/* Address overlay */}
      {address && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="truncate">{address}</span>
          </div>
        </div>
      )}
      
      {/* Coordinates info */}
      <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600 shadow-sm">
        {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </div>
    </div>
  )
}

// Alternative Google Maps component (requires API key)
interface GoogleMapProps {
  latitude: number
  longitude: number
  address?: string
  className?: string
  zoom?: number
}

export function GoogleMap({ latitude, longitude, address, className, zoom = 18 }: GoogleMapProps) {
  // Google Maps embed URL (no API key required for basic embed)
  const googleMapUrl = `https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${latitude},${longitude}&zoom=${zoom}&maptype=roadmap`
  
  // For demo without API key, use search URL with higher zoom level
  const searchMapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d991.9!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwNDknMzAuMiJOIDc5wbA1OSczOS4wIkU!5e0!3m2!1sen!2slk!4v1234567890!5m2!1sen!2slk`

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className || 'h-48'}`}>
      <iframe
        src={searchMapUrl}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Google Map showing ${address || `${latitude}, ${longitude}`}`}
      />
      
      {address && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="truncate">{address}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple static map component using map tiles
interface StaticMapProps {
  latitude: number
  longitude: number
  address?: string
  className?: string
  zoom?: number
}

export function StaticMap({ latitude, longitude, address, className, zoom = 15 }: StaticMapProps) {
  // Using a simple static map service
  const mapImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${longitude},${latitude})/${longitude},${latitude},${zoom},0/400x300?access_token=YOUR_MAPBOX_TOKEN`
  
  // Fallback to OpenStreetMap static image
  const osmStaticUrl = `https://www.mapquestapi.com/staticmap/v5/map?locations=${latitude},${longitude}&size=400,300&zoom=${zoom}&key=YOUR_KEY`
  
  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 ${className || 'h-48'}`}>
      {/* Fallback: Simple coordinate display with styling to look like a map */}
      <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center relative">
        {/* Grid background to simulate map */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>
        
        {/* Location pin */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <div className="w-1 h-4 bg-red-500 -mt-1"></div>
        </div>
        
        {/* Coordinates display */}
        <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded p-2 text-center text-sm">
          <div className="font-medium text-gray-800">📍 Location Detected</div>
          <div className="text-gray-600 text-xs">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
          {address && (
            <div className="text-gray-800 text-sm mt-1 truncate">{address}</div>
          )}
        </div>
      </div>
    </div>
  )
}