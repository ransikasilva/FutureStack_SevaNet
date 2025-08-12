'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, MapPin, Zap, Clock, AlertTriangle, CheckCircle, SkipForward, Loader } from 'lucide-react'

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

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding to get address (using a mock service for demo)
          const address = `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`
          
          setLocation({
            latitude,
            longitude,
            address
          })
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
        setError('Unable to get your location. Please enable location services.')
        setLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
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
        formData.append('latitude', location.latitude.toString())
        formData.append('longitude', location.longitude.toString())
        formData.append('address', location.address || '')
      }

      // Call AI analysis endpoint
      const response = await fetch('http://localhost:8000/api/v1/issues/analyze-image', {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
          <Zap className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Issue Detection</h2>
        <p className="text-gray-600">
          Upload a photo and let our AI identify the issue and suggest the right authority to contact
        </p>
      </div>

      {/* Location Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">
              {location ? 'Location detected' : 'Get current location'}
            </span>
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={loadingLocation}
            className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
          >
            {loadingLocation ? (
              <>
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 mr-1" />
                {location ? 'Update location' : 'Get location'}
              </>
            )}
          </button>
        </div>
        {location && (
          <p className="text-xs text-blue-600 mt-2">{location.address}</p>
        )}
      </div>

      {/* Image Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        {imagePreview ? (
          <div className="text-center">
            <img
              src={imagePreview}
              alt="Issue preview"
              className="mx-auto h-48 w-auto object-contain rounded-lg shadow-md mb-4"
            />
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </button>
              <button
                onClick={analyzeImage}
                disabled={analyzing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload a photo of the issue
            </h3>
            <p className="text-gray-500 mb-4">
              Our AI will analyze the image to identify the problem and suggest the right authority
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Photo
              </button>
              <button
                onClick={onSkip}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-green-800 mb-4">
                AI Analysis Complete
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-green-700">Detected Issue:</label>
                  <p className="text-green-800 font-semibold">{analysis.detected_issue}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-green-700">Category:</label>
                  <p className="text-green-800 capitalize">{analysis.category}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-green-700">Description:</label>
                  <p className="text-green-800">{analysis.description}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-sm font-medium text-green-700">Severity:</label>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(analysis.severity_level)}`}>
                      {getSeverityLabel(analysis.severity_level)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-700">Confidence:</label>
                    <span className="ml-2 text-green-800 font-medium">
                      {Math.round(analysis.confidence_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Recommended Authority:</h4>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{analysis.recommended_authority.name}</p>
                    <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-1 sm:space-y-0 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-1 text-gray-900 font-medium">{analysis.recommended_authority.contact_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500">Emergency:</span>
                        <span className="ml-1 text-red-600 font-medium">{analysis.recommended_authority.emergency_contact}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{analysis.recommended_authority.contact_email}</p>
                  </div>
                </div>

                {analysis.suggested_location && (
                  <div>
                    <label className="text-sm font-medium text-green-700">Suggested Location:</label>
                    <p className="text-green-800">{analysis.suggested_location}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleProceedWithAnalysis}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Proceed with Analysis
                </button>
                <button
                  onClick={onSkip}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
      <div className="text-center">
        <p className="text-xs text-gray-500">
          💡 Tip: Take a clear photo showing the issue for best AI analysis results
        </p>
      </div>
    </div>
  )
}