'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentRequirement, getCategoryLabel } from '@/hooks/useDocumentWallet'
import { InlineDocumentUpload } from './InlineDocumentUpload'
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Wallet, Upload, Plus } from 'lucide-react'

interface DocumentCheckStepProps {
  requirements: DocumentRequirement[]
  loading?: boolean
  citizenId: string
  onRefresh?: () => void
}

export function DocumentCheckStep({ requirements, loading, citizenId, onRefresh }: DocumentCheckStepProps) {
  const router = useRouter()
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null)
  
  const availableCount = requirements.filter(req => req.available).length
  const missingCount = requirements.length - availableCount
  const allAvailable = missingCount === 0

  const handleGoToWallet = () => {
    router.push('/dashboard/documents?tab=wallet')
  }

  const handleUploadDocument = (documentType: string) => {
    setUploadingDocument(documentType)
  }

  const handleUploadSuccess = (documentId: string) => {
    setUploadingDocument(null)
    onRefresh?.()
  }

  const handleUploadCancel = () => {
    setUploadingDocument(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 bg-gray-50 rounded-xl border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue"></div>
        <span className="ml-4 text-lg font-medium text-gray-700">Checking your document wallet...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          allAvailable ? 'bg-green-100 shadow-lg' : 'bg-yellow-100 shadow-lg'
        }`}>
          {allAvailable ? (
            <CheckCircle className="h-12 w-12 text-green-600" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-yellow-600" />
          )}
        </div>
        
        <h3 className="text-3xl font-black text-gray-900 mb-4">
          Document Requirements Check
        </h3>
        
        <p className="text-lg text-gray-600 leading-relaxed">
          {allAvailable ? (
            "Great! All required documents are available in your wallet."
          ) : (
            `${missingCount} document${missingCount > 1 ? 's' : ''} missing from your wallet.`
          )}
        </p>
      </div>

      {/* Professional Status Summary */}
      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
        <h4 className="text-xl font-bold text-gray-900 mb-6 text-center">Document Status</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center bg-green-50 rounded-xl p-6 border border-green-200">
            <div className="text-4xl font-black text-green-600 mb-2">{availableCount}</div>
            <div className="text-base font-bold text-green-700">Available</div>
          </div>
          <div className="text-center bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <div className="text-4xl font-black text-yellow-600 mb-2">{missingCount}</div>
            <div className="text-base font-bold text-yellow-700">Missing</div>
          </div>
        </div>
      </div>

      {/* Document Upload Interface */}
      {uploadingDocument ? (
        <InlineDocumentUpload
          citizenId={citizenId}
          documentType={uploadingDocument}
          onUploadSuccess={handleUploadSuccess}
          onCancel={handleUploadCancel}
        />
      ) : (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <h4 className="text-xl font-bold text-gray-900 mb-6">Document Checklist</h4>
          <div className="space-y-4">
            {requirements.map((req, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-300 ${
                  req.available 
                    ? 'bg-green-50 border-green-300 shadow-sm' 
                    : 'bg-red-50 border-red-300 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg bg-white`}>
                    {req.available ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {getCategoryLabel(req.document_type)}
                    </p>
                    <p className={`text-base font-medium ${
                      req.available ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {req.available ? 'Available in wallet' : 'Not found in wallet'}
                    </p>
                  </div>
                </div>
                
                {!req.available && (
                  <button
                    onClick={() => handleUploadDocument(req.document_type)}
                    className="inline-flex items-center px-4 py-2 bg-government-dark-blue text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Action Cards */}
      {!uploadingDocument && (
        <div className="space-y-6">
          {!allAvailable && (
            <div className="bg-gradient-to-r from-blue-50 to-government-dark-blue/10 border border-blue-300 rounded-xl p-8 shadow-sm">
              <div className="flex items-start">
                <div className="p-3 bg-white rounded-xl mr-6 shadow-sm">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-blue-900 mb-3">Upload Missing Documents</h4>
                  <p className="text-base text-blue-800 mb-6 leading-relaxed">
                    Upload missing documents directly during booking. They'll be saved to your wallet and attached to this appointment automatically.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {requirements.filter(req => !req.available).map((req, index) => (
                      <button
                        key={index}
                        onClick={() => handleUploadDocument(req.document_type)}
                        className="inline-flex items-center px-6 py-3 bg-government-dark-blue text-white text-sm font-bold rounded-lg hover:bg-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {getCategoryLabel(req.document_type)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!allAvailable && (
            <div className="bg-gradient-to-r from-yellow-50 to-government-gold/10 border border-yellow-300 rounded-xl p-8 shadow-sm">
              <div className="flex items-start">
                <div className="p-3 bg-white rounded-xl mr-6 shadow-sm">
                  <Wallet className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-yellow-900 mb-3">Alternative: Use Document Wallet</h4>
                  <p className="text-base text-yellow-800 mb-6 leading-relaxed">
                    Prefer to manage documents separately? Upload them to your wallet and return to continue booking.
                  </p>
                  <button
                    onClick={handleGoToWallet}
                    className="inline-flex items-center px-8 py-4 bg-yellow-600 text-white text-base font-bold rounded-xl hover:bg-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Wallet className="h-5 w-5 mr-3" />
                    Go to Document Wallet
                    <ExternalLink className="h-5 w-5 ml-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {allAvailable && (
        <div className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-300 rounded-xl p-8 shadow-sm">
          <div className="flex items-start">
            <div className="p-3 bg-white rounded-xl mr-6 shadow-sm">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-green-900 mb-3">Ready to Book!</h4>
              <p className="text-base text-green-800 leading-relaxed">
                All required documents are available. These will be automatically attached to your appointment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Professional Refresh Button */}
      <div className="text-center bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-6 py-3 text-government-dark-blue hover:text-blue-800 text-base font-bold hover:bg-blue-50 rounded-lg transition-all duration-300"
        >
          <AlertTriangle className="h-5 w-5 mr-2" />
          Refresh Document Status
        </button>
      </div>
    </div>
  )
}