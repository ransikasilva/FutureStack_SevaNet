'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, MapPin, Zap, Clock, AlertTriangle, CheckCircle, SkipForward, Loader } from 'lucide-react'
import { LocationMap } from '../map/LocationMap'
import { getApiUrl } from '../../lib/api'

interface AIAnalysis {
  detected_issue: string
  category: string
  description: string
  severity_level: number
  recommended_authority: {
    name: string
    contact_phone: string
    contact_email: string
    emergency_contact: string
  }
  confidence_score: number
  suggested_location?: string
}

interface AIAnalysisStepProps {
  onAnalysisComplete: (analysis: AIAnalysis, image?: File) => void
  onSkip: () => void
}

export function AIAnalysisStep({ onAnalysisComplete, onSkip }: AIAnalysisStepProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualLocation, setShowManualLocation] = useState(false)
  const [manualLocation, setManualLocation] = useState('')
  const [isMobile] = useState(() => 
    typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image must be less than 10MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      setSelectedImage(file)
      setError(null)
      setAnalysis(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const getCurrentLocation = () => {
    setLoadingLocation(true)
    setError(null)

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Please enter your location manually.')
      setLoadingLocation(false)
      return
    }

    // Check if we're on HTTPS or localhost (required for mobile geolocation)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    if (!isSecure && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setError('Location access requires HTTPS on mobile. Use "Enter manually" below.')
      setShowManualLocation(true) // Automatically show manual input
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding to get human-readable address
          const formData = new FormData()
          formData.append('latitude', latitude.toString())
          formData.append('longitude', longitude.toString())
          
          const geocodeResponse = await fetch(getApiUrl('issues/location/reverse-geocode'), {
            method: 'POST',
            body: formData
          })
          
          if (geocodeResponse.ok) {
            const geocodeResult = await geocodeResponse.json()
            if (geocodeResult.success && geocodeResult.address) {
              // Extract a clean, readable address
              const addressComponents = geocodeResult.address.address_components
              const road = addressComponents.road || ''
              const suburb = addressComponents.suburb || ''
              const city = addressComponents.city || ''
              const district = addressComponents.district || ''
              
              // Create a clean address string
              const addressParts = [road, suburb, city, district].filter(part => part.trim() !== '')
              const cleanAddress = addressParts.join(', ')
              
              setLocation({
                latitude,
                longitude,
                address: cleanAddress || geocodeResult.address.formatted_address
              })
            } else {
              // Fallback to coordinates if reverse geocoding fails
              setLocation({
                latitude,
                longitude,
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              })
            }
          } else {
            // Fallback to coordinates
            setLocation({
              latitude,
              longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            })
          }
        } catch (err) {
          console.error('Geocoding error:', err)
          setLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          })
        }
        
        setLoadingLocation(false)
      },
      (error) => {
        console.error('Location error:', error)
        let errorMessage = 'Unable to get your location. '
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please check your GPS or network connection.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or enter location manually.'
            break
          default:
            errorMessage += 'Please enable location services or enter your location manually.'
            break
        }
        
        setError(errorMessage)
        setLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 300000
      }
    )
  }

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) {
      setError('Please enter a location')
      return
    }

    setLoadingLocation(true)
    setError(null)

    try {
      // Use geocoding to convert address to coordinates
      const formData = new FormData()
      formData.append('address', manualLocation.trim())
      
      const geocodeResponse = await fetch(getApiUrl('issues/location/geocode'), {
        method: 'POST',
        body: formData
      })
      
      if (geocodeResponse.ok) {
        const geocodeResult = await geocodeResponse.json()
        if (geocodeResult.success && geocodeResult.coordinates) {
          setLocation({
            latitude: geocodeResult.coordinates.latitude,
            longitude: geocodeResult.coordinates.longitude,
            address: manualLocation.trim()
          })
          setShowManualLocation(false)
          setManualLocation('')
        } else {
          setError('Location not found. Please try a different address.')
        }
      } else {
        setError('Failed to find location. Please try again.')
      }
    } catch (err) {
      console.error('Manual location error:', err)
      setError('Failed to process location. Please try again.')
    } finally {
      setLoadingLocation(false)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setAnalyzing(true)
    setError(null)

    try {
      // Create FormData for image upload
      const formData = new FormData()
      formData.append('image', selectedImage)
      
      if (location) {
        // Send the address for better location processing
        if (location.address && !location.address.includes('Latitude:')) {
          formData.append('location_address', location.address)
        } else {
          // Fallback to coordinates if no readable address
          formData.append('latitude', location.latitude.toString())
          formData.append('longitude', location.longitude.toString())
        }
      }

      // Call enhanced AI analysis endpoint with location processing
      const response = await fetch(getApiUrl('issues/analyze-image-with-location'), {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze image')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.analysis)
      } else {
        throw new Error(result.message || 'Analysis failed')
      }
      
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to analyze image. Please try again or skip this step.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleProceedWithAnalysis = () => {
    if (analysis) {
      onAnalysisComplete(analysis, selectedImage)
    }
  }

  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-700 bg-green-100'
      case 2: return 'text-yellow-700 bg-yellow-100'
      case 3: return 'text-orange-700 bg-orange-100'
      case 4: return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getSeverityLabel = (level: number) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' }
    return labels[level as keyof typeof labels] || 'Unknown'
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 px-1 sm:px-0">
      {/* Header */}
      <div className="text-center px-2">
        <div className="mx-auto flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 mb-3 sm:mb-4">
          <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        </div>
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight px-1">
          AI Analysis
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 px-2 leading-relaxed max-w-md mx-auto">
          Upload photo for AI detection
        </p>
      </div>

      {/* Location Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">
              {location ? 'Location detected' : 'Set your location'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowManualLocation(!showManualLocation)}
              className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-600 text-white hover:bg-blue-700"
            >
              📍 Enter Location
            </button>
            <button
              onClick={getCurrentLocation}
              disabled={loadingLocation}
              className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
            >
              {loadingLocation ? (
                <>
                  <Loader className="h-3 w-3 mr-1 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="h-3 w-3 mr-1" />
                  Auto-detect
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile guidance */}
        {isMobile && !location && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <MapPin className="h-4 w-4 text-yellow-600 mt-0.5" />
              </div>
              <div className="ml-2">
                <p className="text-sm text-yellow-800">
                  <strong>Mobile tip:</strong> Use "Enter Location" button above for easy location input.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Location Input */}
        {showManualLocation && (
          <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your location in Sri Lanka
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Examples: "Colombo Fort", "Kandy Central", "Galle Road", "Negombo Beach"
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="Enter address or landmark..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleManualLocation()}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleManualLocation}
                  disabled={loadingLocation || !manualLocation.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingLocation ? 'Searching...' : 'Find'}
                </button>
                <button
                  onClick={() => {
                    setShowManualLocation(false)
                    setManualLocation('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {location && (
          <div className="space-y-3">
            {/* Address display */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{location.address}</p>
                  <p className="text-xs text-gray-500">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Map display */}
            <LocationMap
              latitude={location.latitude}
              longitude={location.longitude}
              address={location.address}
              className="h-40"
              zoom={18} // High zoom for street-level detail
            />
          </div>
        )}
      </div>

      {/* Image Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8">
        {imagePreview ? (
          <div className="text-center">
            <img
              src={imagePreview}
              alt="Issue preview"
              className="mx-auto h-32 sm:h-48 w-auto object-contain rounded-lg shadow-md mb-4"
            />
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </button>
              <button
                onClick={analyzeImage}
                disabled={analyzing}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Camera className="mx-auto h-8 sm:h-12 w-8 sm:w-12 text-gray-400 mb-4" />
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2">
              Take or Upload Photo
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-4 px-2 leading-relaxed max-w-sm mx-auto">
              AI will identify the issue and suggest authorities
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Photo
              </button>
              <button
                onClick={onSkip}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip AI Analysis
              </button>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {analysis && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-2 sm:ml-3 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-green-800 mb-3 sm:mb-4">
                AI Analysis Complete
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-green-700">Detected Issue:</label>
                  <p className="text-sm sm:text-base text-green-800 font-semibold break-words">{analysis.detected_issue}</p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-green-700">Category:</label>
                  <p className="text-sm sm:text-base text-green-800 capitalize">{analysis.category}</p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-green-700">Description:</label>
                  <p className="text-sm sm:text-base text-green-800 break-words">{analysis.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center">
                    <label className="text-xs sm:text-sm font-medium text-green-700">Severity:</label>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(analysis.severity_level)}`}>
                      {getSeverityLabel(analysis.severity_level)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <label className="text-xs sm:text-sm font-medium text-green-700">Confidence:</label>
                    <span className="ml-2 text-sm sm:text-base text-green-800 font-medium">
                      {Math.round(analysis.confidence_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-green-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Recommended Authority:</h4>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{analysis.recommended_authority.name}</p>
                    <div className="flex flex-col space-y-1 text-xs sm:text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500 min-w-[70px]">Phone:</span>
                        <span className="ml-1 text-gray-900 font-medium">{analysis.recommended_authority.contact_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 min-w-[70px]">Emergency:</span>
                        <span className="ml-1 text-red-600 font-medium">{analysis.recommended_authority.emergency_contact}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-gray-500 min-w-[70px]">Email:</span>
                        <span className="ml-1 text-gray-600 break-all">{analysis.recommended_authority.contact_email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {analysis.suggested_location && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-green-700">Suggested Location:</label>
                    <p className="text-sm sm:text-base text-green-800 break-words">{analysis.suggested_location}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleProceedWithAnalysis}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Proceed with Analysis
                </button>
                <button
                  onClick={onSkip}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Manual Entry Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center px-2">
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          💡 Take a clear photo for best results
        </p>
      </div>
    </div>
  )
}