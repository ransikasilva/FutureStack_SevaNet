'use client'

import { useState } from 'react'
import { useDocuments, deleteDocument, getDocumentUrl, getFileIcon, formatFileSize } from '@/hooks/useDocuments'
import { 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'

interface DocumentListProps {
  appointmentId?: string
  citizenId?: string
  showActions?: boolean
  className?: string
}

export function DocumentList({ 
  appointmentId, 
  citizenId, 
  showActions = true,
  className = '' 
}: DocumentListProps) {
  const { documents, loading, error, refetch } = useDocuments(appointmentId, citizenId)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-800 bg-green-100 border-green-200'
      case 'pending':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200'
      case 'rejected':
        return 'text-red-800 bg-red-100 border-red-200'
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200'
    }
  }

  const handleDownload = async (document: any) => {
    setDownloadingId(document.id)
    try {
      const url = await getDocumentUrl(document.file_path)
      
      // Create a temporary link to download the file
      const link = document.createElement('a')
      link.href = url
      link.download = document.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      alert(`Failed to download document: ${error.message}`)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    setDeletingId(documentId)
    try {
      await deleteDocument(documentId)
      refetch()
    } catch (error: any) {
      alert(`Failed to delete document: ${error.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading documents...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`}>
        Error loading documents: {error}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No documents uploaded
        </h3>
        <p className="text-gray-500">
          {appointmentId 
            ? 'No documents have been uploaded for this appointment yet.'
            : 'You haven\'t uploaded any documents yet.'
          }
        </p>
      </div>
    )
  }

  // Group documents by category
  const groupedDocuments = documents.reduce((acc, doc) => {
    const category = doc.document_category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(doc)
    return acc
  }, {} as Record<string, typeof documents>)

  return (
    <div className={`space-y-6 ${className}`}>
      {Object.entries(groupedDocuments).map(([category, categoryDocs]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-500" />
              {category}
              <span className="ml-2 text-sm text-gray-500">
                ({categoryDocs.length} file{categoryDocs.length !== 1 ? 's' : ''})
              </span>
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {categoryDocs.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-2xl">
                      {getFileIcon(document.file_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.file_name}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(document.uploaded_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(document.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
                        {document.status}
                      </span>
                    </div>
                  </div>

                  {showActions && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleDownload(document)}
                        disabled={downloadingId === document.id}
                        className="p-2 text-gray-400 hover:text-blue-500 disabled:opacity-50"
                        title="Download"
                      >
                        {downloadingId === document.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                      
                      {document.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(document.id)}
                          disabled={deletingId === document.id}
                          className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === document.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Officer Comments */}
          {categoryDocs.some(doc => doc.officer_comments) && (
            <div className="px-6 pb-4">
              {categoryDocs
                .filter(doc => doc.officer_comments)
                .map(doc => (
                  <div key={doc.id} className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <div className="font-medium text-blue-900 mb-1">
                      Officer feedback for {doc.file_name}:
                    </div>
                    <div className="text-blue-800">
                      {doc.officer_comments}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}