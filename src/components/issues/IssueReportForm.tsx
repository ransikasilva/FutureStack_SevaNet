'use client'

import { useState, useRef } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { reportIssue, analyzeImageWithAI, useIssueCategories, AIAnalysisResult } from '@/hooks/useIssues'
import { Camera, Upload, MapPin, Zap, AlertTriangle, CheckCircle, Loader2, X, Sparkles } from 'lucide-react'

interface IssueReportFormProps {
  onSuccess?: (issue: any) => void
  onClose?: () => void
}

export function IssueReportForm({ onSuccess, onClose }: IssueReportFormProps) {
  const { user } = useAuthContext()
  const { categories } = useIssueCategories()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    severity_level: 2,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  })
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processSelectedFile(file)
    }
  }

  const processSelectedFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    setSelectedImage(file)
    setError(null)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processSelectedFile(files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setAIAnalysis(null)
    setError(null)
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return

    try {
      setAnalyzingImage(true)
      setError(null)
      
      const result = await analyzeImageWithAI(
        selectedImage,
        formData.location || undefined,
        formData.latitude,
        formData.longitude
      )

      if (result.success && result.analysis) {
        setAIAnalysis(result.analysis)
        
        // Auto-fill form with AI suggestions
        setFormData(prev => ({
          ...prev,
          category: result.analysis!.category,
          title: result.analysis!.detected_issue,
          description: result.analysis!.description,
          severity_level: result.analysis!.severity_level
        }))
      } else {
        setError(result.message || 'Failed to analyze image')
      }
    } catch (err) {
      setError('Failed to analyze image')
    } finally {
      setAnalyzingImage(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          try {
            // Try to get address from coordinates using reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
            const data = await response.json()
            
            setFormData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              location: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            }))
          } catch (err) {
            // Fallback to coordinates if reverse geocoding fails
            setFormData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            }))
          }
          setLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Failed to get current location')
          setLoading(false)
        }
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setError('Please log in to report an issue')
      return
    }

    if (!formData.category || !formData.description || !formData.location) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const submitFormData = new FormData()
      submitFormData.append('user_id', user.id)
      submitFormData.append('category', formData.category)
      submitFormData.append('title', formData.title || `${formData.category} Issue`)
      submitFormData.append('description', formData.description)
      submitFormData.append('location', formData.location)
      submitFormData.append('severity_level', formData.severity_level.toString())
      
      if (formData.latitude) submitFormData.append('latitude', formData.latitude.toString())
      if (formData.longitude) submitFormData.append('longitude', formData.longitude.toString())
      if (selectedImage) submitFormData.append('image', selectedImage)
      if (aiAnalysis) submitFormData.append('ai_analysis', JSON.stringify(aiAnalysis))

      const result = await reportIssue(submitFormData)

      if (result.success) {
        onSuccess?.(result.issue)
        
        // Reset form
        setFormData({
          category: '',
          title: '',
          description: '',
          location: '',
          severity_level: 2,
          latitude: undefined,
          longitude: undefined
        })
        setSelectedImage(null)
        setImagePreview(null)
        setAIAnalysis(null)
      } else {
        setError(result.message || 'Failed to report issue')
      }
    } catch (err) {
      setError('Failed to report issue')
    } finally {
      setSubmitting(false)
    }
  }

  const severityLevels = [
    { value: 1, label: 'Low', color: 'text-green-600 bg-green-100', description: 'Minor issue, non-urgent' },
    { value: 2, label: 'Medium', color: 'text-yellow-600 bg-yellow-100', description: 'Moderate issue, needs attention' },
    { value: 3, label: 'High', color: 'text-orange-600 bg-orange-100', description: 'Serious issue, urgent action needed' },
    { value: 4, label: 'Critical', color: 'text-red-600 bg-red-100', description: 'Emergency, immediate action required' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Civic Issue Reporting</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-4 leading-tight">
              Report a Civic Issue
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Help improve your community by reporting infrastructure issues. Our AI will analyze your photo and route it to the appropriate government department.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Image Upload Section */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Camera className="h-5 w-5 mr-2 text-government-dark-blue" />
            Upload Issue Photo
          </h3>
          
                     <div className="space-y-4">
             <div 
               className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
                 dragOver 
                   ? 'border-government-dark-blue bg-blue-50 border-solid' 
                   : imagePreview 
                     ? 'border-green-300 bg-green-50/30' 
                     : 'border-gray-300 hover:border-government-dark-blue hover:bg-blue-50/30'
               }`}
               onDragOver={handleDragOver}
               onDragLeave={handleDragLeave}
               onDrop={handleDrop}
               onClick={!imagePreview ? openFileDialog : undefined}
             >
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleImageSelect}
                 className="hidden"
               />
               
               {imagePreview ? (
                 <div className="space-y-4">
                   <img
                     src={imagePreview}
                     alt="Selected issue"
                     className="max-h-64 mx-auto rounded-lg shadow-md"
                   />
                   <div className="flex justify-center space-x-4">
                     <button
                       type="button"
                       onClick={clearImage}
                       className="px-4 py-2 text-government-dark-blue bg-blue-50 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                     >
                       Change Photo
                     </button>
                     {selectedImage && !analyzingImage && (
                       <button
                         type="button"
                         onClick={handleAnalyzeImage}
                         className="inline-flex items-center px-4 py-2 bg-government-dark-blue text-white rounded-lg hover:bg-blue-800 font-medium transition-colors"
                       >
                         <Sparkles className="h-4 w-4 mr-2" />
                         Analyze with AI
                       </button>
                     )}
                   </div>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {dragOver ? (
                     <div className="space-y-3">
                       <Upload className="h-16 w-16 text-government-dark-blue mx-auto animate-bounce" />
                       <div>
                         <p className="text-government-dark-blue font-bold text-lg">Drop your image here</p>
                         <p className="text-blue-600 text-sm">Release to upload</p>
                       </div>
                     </div>
                   ) : (
                     <>
                       <Upload className="h-12 w-12 text-gray-400 mx-auto transition-colors group-hover:text-government-dark-blue" />
                       <div>
                         <p className="text-government-dark-blue font-medium hover:text-blue-800 transition-colors">
                           Click to upload an image
                         </p>
                         <p className="text-gray-500 text-sm">or drag and drop</p>
                       </div>
                       <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP up to 10MB</p>
                     </>
                   )}
                 </div>
               )}
             </div>

            {analyzingImage && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-3" />
                  <span className="text-blue-700 font-medium">AI is analyzing your image...</span>
                </div>
              </div>
            )}

            {aiAnalysis && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800 mb-2">AI Analysis Complete</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Detected:</strong> {aiAnalysis.detected_issue}</p>
                      <p><strong>Category:</strong> {aiAnalysis.category}</p>
                      <p><strong>Confidence:</strong> {Math.round(aiAnalysis.confidence_score * 100)}%</p>
                      {aiAnalysis.recommended_authority && (
                        <p><strong>Will be sent to:</strong> {aiAnalysis.recommended_authority.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Issue Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                required
              >
                <option value="">Select category...</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name.charAt(0).toUpperCase() + category.name.slice(1)} - {category.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Issue Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Severity Level *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {severityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity_level: level.value })}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      formData.severity_level === level.value
                        ? 'border-government-dark-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold mb-2 ${level.color}`}>
                      {level.label}
                    </div>
                    <p className="text-xs text-gray-600">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Location *
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                  placeholder="e.g., Main Street, Colombo 03"
                  required
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 text-government-dark-blue bg-blue-50 rounded-lg hover:bg-blue-100 font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Use Current Location
                </button>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                placeholder="Provide detailed description of the issue, its impact, and any safety concerns..."
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !formData.category || !formData.description || !formData.location}
            className="inline-flex items-center px-8 py-3 bg-government-dark-blue text-white font-bold rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Reporting Issue...
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 mr-2" />
                Report Issue
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}