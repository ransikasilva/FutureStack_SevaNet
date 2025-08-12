'use client'

import { useState } from 'react'
import { DOCUMENT_CATEGORIES, getCategoryLabel } from '@/hooks/useDocumentWallet'
import { Upload, Calendar } from 'lucide-react'

interface DocumentUploadFormProps {
  onUpload: (data: {
    file: File
    category: string
    expiryDate?: string
  }) => Promise<void>
  loading?: boolean
  availableCategories?: [string, string][]
  showCategorySelector?: boolean
  showExpiryDate?: boolean
}

export function DocumentUploadForm({
  onUpload,
  loading = false,
  availableCategories,
  showCategorySelector = true,
  showExpiryDate = false
}: DocumentUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const categories = availableCategories || Object.entries(DOCUMENT_CATEGORIES)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Please upload files smaller than 5MB.')
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    if (showCategorySelector && !selectedCategory) {
      setError('Please select a document category')
      return
    }

    try {
      await onUpload({
        file: selectedFile,
        category: selectedCategory,
        expiryDate: expiryDate || undefined
      })
      
      // Reset form
      setSelectedFile(null)
      setSelectedCategory('')
      setExpiryDate('')
      setError(null)
    } catch (error) {
      setError('Upload failed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Category Selection */}
      {showCategorySelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Type *
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Select document type</option>
            {categories.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document File *
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                <span>Upload a file</span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              PDF, DOC, DOCX, PNG, JPG up to 5MB
            </p>
          </div>
        </div>
        
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
          </div>
        )}
      </div>

      {/* Expiry Date */}
      {showExpiryDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date (Optional)
          </label>
          <div className="relative">
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min={new Date().toISOString().split('T')[0]}
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Leave blank if document doesn&apos;t expire
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Documents will be reviewed by officers before approval</p>
        <p>• Ensure documents are clear and readable</p>
        <p>• You can upload multiple documents of the same type</p>
      </div>
    </form>
  )
}