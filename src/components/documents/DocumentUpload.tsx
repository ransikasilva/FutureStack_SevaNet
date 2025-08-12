'use client'

import { useState, useRef } from 'react'
import { uploadDocument, getFileIcon, formatFileSize } from '@/hooks/useDocuments'
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react'

interface DocumentUploadProps {
  appointmentId: string
  citizenId: string
  category: string
  onUploadSuccess?: (document: any) => void
  onUploadError?: (error: string) => void
  className?: string
}

export function DocumentUpload({
  appointmentId,
  citizenId,
  category,
  onUploadSuccess,
  onUploadError,
  className = ''
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    setSelectedFiles(prev => [...prev, ...fileArray])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = selectedFiles.map(file => 
        uploadDocument(file, appointmentId, citizenId, category)
      )

      const uploadedDocuments = await Promise.all(uploadPromises)
      
      setSelectedFiles([])
      onUploadSuccess?.(uploadedDocuments)
    } catch (error: any) {
      onUploadError?.(error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Documents for {category}
        </h3>
        
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        
        <button
          onClick={openFileDialog}
          className="btn-primary"
          disabled={uploading}
        >
          Choose Files
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB each)
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Selected Files ({selectedFiles.length})
          </h4>
          
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
            
            <button
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}