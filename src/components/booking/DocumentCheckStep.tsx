'use client'

import { useRouter } from 'next/navigation'
import { DocumentRequirement, getCategoryLabel } from '@/hooks/useDocumentWallet'
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Wallet } from 'lucide-react'

interface DocumentCheckStepProps {
  requirements: DocumentRequirement[]
  loading?: boolean
  onRefresh?: () => void
}

export function DocumentCheckStep({ requirements, loading, onRefresh }: DocumentCheckStepProps) {
  const router = useRouter()
  
  const availableCount = requirements.filter(req => req.available).length
  const missingCount = requirements.length - availableCount
  const allAvailable = missingCount === 0

  const handleGoToWallet = () => {
    router.push('/dashboard/documents?tab=wallet')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Checking your document wallet...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          allAvailable ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {allAvailable ? (
            <CheckCircle className="h-10 w-10 text-green-600" />
          ) : (
            <AlertTriangle className="h-10 w-10 text-yellow-600" />
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Document Requirements Check
        </h3>
        
        <p className="text-gray-600">
          {allAvailable ? (
            "Great! All required documents are available in your wallet."
          ) : (
            `${missingCount} document${missingCount > 1 ? 's' : ''} missing from your wallet.`
          )}
        </p>
      </div>

      {/* Status Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{missingCount}</div>
            <div className="text-sm text-gray-600">Missing</div>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              req.available 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {req.available ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {getCategoryLabel(req.document_type)}
                </p>
                <p className={`text-sm ${
                  req.available ? 'text-green-700' : 'text-red-700'
                }`}>
                  {req.available ? 'Available in wallet' : 'Not found in wallet'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {!allAvailable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">Action Required</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  You need to upload the missing documents to your wallet before you can proceed with booking.
                </p>
                <button
                  onClick={handleGoToWallet}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Go to Document Wallet
                  <ExternalLink className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {allAvailable && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
              <div>
                <h4 className="font-medium text-green-900">Ready to Book!</h4>
                <p className="text-sm text-green-800 mt-1">
                  All required documents are available. These will be automatically attached to your appointment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={onRefresh}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Refresh Document Status
          </button>
        </div>
      </div>
    </div>
  )
}