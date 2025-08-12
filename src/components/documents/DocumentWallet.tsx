'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { useDocumentWallet, uploadToWallet, removeFromWallet, DOCUMENT_CATEGORIES, getCategoryLabel } from '@/hooks/useDocumentWallet'
import { DocumentUploadForm } from './DocumentUploadForm'
import { FileText, Upload, Trash2, CheckCircle, AlertCircle, Clock, Plus, Wallet } from 'lucide-react'
import { format } from 'date-fns'

export function DocumentWallet() {
  const { user } = useAuthContext()
  const { walletDocuments, loading, error, refetch } = useDocumentWallet(user?.profile?.id)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (uploadData: {
    file: File
    category: string
    expiryDate?: string
  }) => {
    if (!user?.profile?.id) return

    setUploading(true)
    try {
      await uploadToWallet({
        citizenId: user.profile.id,
        file: uploadData.file,
        documentCategory: uploadData.category,
        expiryDate: uploadData.expiryDate
      })
      
      refetch()
      setShowUploadForm(false)
      setSelectedCategory('')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload document to wallet')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (documentId: string) => {
    if (!confirm('Are you sure you want to remove this document from your wallet?')) {
      return
    }

    try {
      await removeFromWallet(documentId)
      refetch()
    } catch (error) {
      console.error('Remove failed:', error)
      alert('Failed to remove document')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
  }

  const categoriesInWallet = new Set(walletDocuments.map(doc => doc.document_category))
  const availableCategories = Object.entries(DOCUMENT_CATEGORIES).filter(
    ([key]) => !categoriesInWallet.has(key)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error loading document wallet: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Wallet className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Wallet</h2>
            <p className="text-gray-600">Store your frequently used documents for quick booking</p>
          </div>
        </div>

        {availableCategories.length > 0 && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Document
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-xl font-semibold text-gray-900">{walletDocuments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-xl font-semibold text-gray-900">
                {walletDocuments.filter(d => d.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-xl font-semibold text-gray-900">
                {walletDocuments.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add to Wallet</h3>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <DocumentUploadForm
              onUpload={handleUpload}
              loading={uploading}
              availableCategories={availableCategories}
              showCategorySelector={true}
              showExpiryDate={true}
            />
          </div>
        </div>
      )}

      {/* Documents List */}
      {walletDocuments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents in wallet</h3>
          <p className="text-gray-600 mb-4">
            Add your frequently used documents for faster appointment booking
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add First Document
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {walletDocuments.map((document) => (
            <div key={document.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getCategoryLabel(document.document_category)}
                    </h4>
                    <p className="text-sm text-gray-600">{document.file_name}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(document.status)}`}>
                    {getStatusIcon(document.status)}
                    <span className="capitalize">{document.status}</span>
                  </div>

                  <button
                    onClick={() => handleRemove(document.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove from wallet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {document.officer_comments && (
                <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                  <p className="text-sm text-gray-700">
                    <strong>Officer Comments:</strong> {document.officer_comments}
                  </p>
                </div>
              )}

              {document.expiry_date && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Expires: {format(new Date(document.expiry_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 How Document Wallet Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload documents once to your wallet</li>
          <li>• Documents are reviewed and approved by officers</li>
          <li>• During booking, approved documents are automatically attached</li>
          <li>• Save time - no need to upload the same documents repeatedly</li>
        </ul>
      </div>
    </div>
  )
}