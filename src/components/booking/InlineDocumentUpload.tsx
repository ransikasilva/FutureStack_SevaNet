'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadToWallet, getCategoryLabel, getCategoryKey, DOCUMENT_CATEGORIES } from '@/hooks/useDocumentWallet'
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface InlineDocumentUploadProps {
  citizenId: string
  documentType: string
  onUploadSuccess: (documentId: string) => void
  onCancel: () => void
}

export function InlineDocumentUpload({ 
  citizenId, 
  documentType, 
  onUploadSuccess, 
  onCancel 
}: InlineDocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    getCategoryKey(documentType) // This will be used for the enum dropdown
  )
  const [expiryDate, setExpiryDate] = useState<string>('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and PDF files are allowed')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const mappedDocumentType = getCategoryKey(documentType)
      console.log('Document type mapping:', { original: documentType, mapped: mappedDocumentType })
      
      const uploadedDoc = await uploadToWallet({
        citizenId,
        file,
        documentCategory: documentType, // Use original document type name for category matching
        documentType: mappedDocumentType, // Use mapped key for enum
        expiryDate: expiryDate || undefined
      })

      setSuccess(true)
      setTimeout(() => {
        onUploadSuccess(uploadedDoc.id)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }, [citizenId, selectedCategory, documentType, expiryDate, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: uploading || success
  })

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h4 className="text-xl font-bold text-green-900 mb-2">Upload Successful!</h4>
          <p className="text-green-700">
            {getCategoryLabel(documentType)} has been added to your wallet and will be attached to this appointment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <div className="mb-6">
        <h4 className="text-xl font-bold text-gray-900 mb-2">
          Upload {getCategoryLabel(documentType)}
        </h4>
        <p className="text-gray-600">
          Upload this document now to continue with your booking. It will be saved to your wallet for future use.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Document Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={uploading}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue disabled:bg-gray-100"
          >
            {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Expiry Date (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={uploading}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue disabled:bg-gray-100"
          />
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? 'border-government-dark-blue bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            {uploading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-government-dark-blue animate-spin" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-6 w-6 text-gray-600" />
              </div>
            )}
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {uploading ? 'Uploading...' : (
                  isDragActive ? 'Drop your file here' : 'Click to upload or drag and drop'
                )}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports JPG, PNG, PDF files up to 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tips for better document processing:</p>
            <ul className="space-y-1 text-sm">
              <li>• Ensure document is clearly visible and well-lit</li>
              <li>• All text should be readable</li>
              <li>• Document should not be cut off at edges</li>
              <li>• For photos, use a plain background</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}