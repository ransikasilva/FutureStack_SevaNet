'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { Upload, AlertTriangle, MapPin, Camera, Send, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface IssueCategory {
  name: string
  description: string
  icon: string
}

const ISSUE_CATEGORIES: IssueCategory[] = [
  { name: 'roads', description: 'Road damages, potholes, traffic issues', icon: '🛣️' },
  { name: 'electricity', description: 'Power outages, electrical faults', icon: '⚡' },
  { name: 'water', description: 'Water supply issues, leaks', icon: '💧' },
  { name: 'waste', description: 'Garbage collection, waste management', icon: '🗑️' },
  { name: 'safety', description: 'Security, crime, emergency issues', icon: '🛡️' },
  { name: 'health', description: 'Public health concerns', icon: '🏥' },
  { name: 'environment', description: 'Environmental issues, pollution', icon: '🌱' },
  { name: 'infrastructure', description: 'Public buildings, facilities', icon: '🏢' }
]

const SEVERITY_LEVELS = [
  { value: 1, label: 'Low', description: 'Minor inconvenience', color: 'bg-green-100 text-green-800' },
  { value: 2, label: 'Medium', description: 'Affects daily life', color: 'bg-yellow-100 text-yellow-800' },
  { value: 3, label: 'High', description: 'Significant impact', color: 'bg-orange-100 text-orange-800' },
  { value: 4, label: 'Critical', description: 'Safety risk or emergency', color: 'bg-red-100 text-red-800' }
]

export function ReportIssueForm() {
  const { user } = useAuthContext()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    severityLevel: 1
  })
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [issueReference, setIssueReference] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }))
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }))
        return
      }
      
      setSelectedImage(file)
      setErrors(prev => ({ ...prev, image: '' }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.category) newErrors.category = 'Please select a category'
    if (!formData.description.trim()) newErrors.description = 'Please describe the issue'
    if (!formData.location.trim()) newErrors.location = 'Please specify the location'
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters'
    if (formData.location.length < 5) newErrors.location = 'Please provide a more specific location'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('category', formData.category)
      submitData.append('title', formData.title || `${ISSUE_CATEGORIES.find(c => c.name === formData.category)?.description || 'Issue'}`)
      submitData.append('description', formData.description)
      submitData.append('location', formData.location)
      submitData.append('user_id', user?.profile?.id || '')
      submitData.append('severity_level', formData.severityLevel.toString())
      
      if (selectedImage) {
        submitData.append('image', selectedImage)
      }

      // Call backend API
      const response = await fetch('http://localhost:8000/api/v1/issues/report', {
        method: 'POST',
        body: submitData
      })
      
      if (!response.ok) {
        throw new Error('Failed to report issue')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess(true)
        setIssueReference(result.issue.booking_reference)
        
        // Redirect to success page after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/my-reports')
        }, 3000)
      } else {
        throw new Error(result.message || 'Failed to report issue')
      }
      
    } catch (error) {
      console.error('Error reporting issue:', error)
      setErrors({ submit: 'Failed to report issue. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Issue Reported Successfully!
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Your issue has been submitted with reference: <strong>{issueReference}</strong>
        </p>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• A government officer will review your submission within 24 hours</p>
          <p>• You will receive notifications about status updates</p>
          <p>• Track your issue progress in "My Reports"</p>
        </div>
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/my-reports')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            View My Reports
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Issue Category *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ISSUE_CATEGORIES.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: category.name }))}
              className={`p-3 text-left border-2 rounded-lg transition-colors ${
                formData.category === category.name
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {category.name}
              </div>
              <div className="text-xs text-gray-500">
                {category.description}
              </div>
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      {/* Title (Optional) */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Issue Title (Optional)
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Brief title for your issue"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Please describe the issue in detail..."
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/500 characters
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location *
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., Main Street, Colombo 03"
            className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500"
          />
        </div>
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location}</p>
        )}
      </div>

      {/* Severity Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity Level
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SEVERITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, severityLevel: level.value }))}
              className={`p-3 text-center border-2 rounded-lg transition-colors ${
                formData.severityLevel === level.value
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${level.color}`}>
                {level.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {level.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo Evidence (Optional)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mx-auto h-32 w-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                  >
                    <span>Upload a photo</span>
                    <input
                      id="image-upload"
                      name="image"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </>
            )}
          </div>
        </div>
        {errors.image && (
          <p className="mt-1 text-sm text-red-600">{errors.image}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Reporting Issue...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Report Issue
            </>
          )}
        </button>
      </div>
    </form>
  )
}