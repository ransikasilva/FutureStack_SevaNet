'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUserAppointments } from '@/hooks/useAppointments'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentList } from '@/components/documents/DocumentList'
import { DocumentWallet } from '@/components/documents/DocumentWallet'
import { 
  FileText, 
  Upload, 
  Calendar, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Info,
  Wallet
} from 'lucide-react'

function DocumentsContent() {
  const { user } = useAuthContext()
  const searchParams = useSearchParams()
  const { appointments, loading: appointmentsLoading } = useUserAppointments(user?.profile?.id || '')
  const [activeTab, setActiveTab] = useState<'appointments' | 'wallet'>('appointments')
  const [selectedAppointment, setSelectedAppointment] = useState<string>('')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Handle tab switching from URL params
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab === 'wallet') {
      setActiveTab('wallet')
    }
  }, [searchParams])

  // Get appointments that can have documents
  const eligibleAppointments = appointments.filter(
    apt => apt.status === 'pending' || apt.status === 'confirmed'
  )

  const selectedAppointmentData = appointments.find(apt => apt.id === selectedAppointment)

  const handleUploadSuccess = () => {
    setUploadSuccess('Documents uploaded successfully!')
    setShowUpload(false)
    setSelectedCategory('')
    setTimeout(() => setUploadSuccess(null), 5000)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setTimeout(() => setUploadError(null), 5000)
  }

  const documentCategories = [
    'National ID Copy',
    'Birth Certificate',
    'Medical Certificate',
    'Vision Test Report',
    'Passport Photo',
    'Vehicle Invoice',
    'Insurance Certificate',
    'Import Permit',
    'Police Report',
    'Affidavit',
    'Application Form',
    'Bank Statement',
    'Employment Letter',
    'Salary Slips',
    'Other'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Document Management
        </h1>
        <p className="text-gray-600">
          Upload and manage documents for your appointments
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appointments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-5 w-5 mr-2 inline" />
            Appointment Documents
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wallet'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Wallet className="h-5 w-5 mr-2 inline" />
            Document Wallet
          </button>
        </nav>
      </div>

      {/* Success/Error Messages */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {uploadSuccess}
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {uploadError}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'wallet' ? (
        <DocumentWallet />
      ) : (
        <div className="space-y-6">

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              📋 Document Upload Guidelines
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Upload documents before your appointment to speed up the process</p>
              <p>• Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB each)</p>
              <p>• Ensure documents are clear and readable</p>
              <p>• You can upload multiple files for each category</p>
              <p>• Documents will be reviewed by officers before your appointment</p>
            </div>
          </div>
        </div>
      </div>

      {appointmentsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading appointments...</p>
        </div>
      ) : eligibleAppointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Appointments
          </h3>
          <p className="text-gray-500 mb-6">
            You need to have pending or confirmed appointments to upload documents.
          </p>
          <a
            href="/dashboard/book"
            className="btn-primary"
          >
            Book New Appointment
          </a>
        </div>
      ) : (
        <>
          {/* Appointment Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Appointment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibleAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAppointment === appointment.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedAppointment(appointment.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {appointment.service?.name}
                    </h3>
                    <div className="flex items-center">
                      {appointment.status === 'confirmed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {appointment.service?.department?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ref: {appointment.booking_reference}
                  </p>
                  {appointment.time_slot && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(appointment.time_slot.start_time).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Section */}
          {selectedAppointment && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Documents
                </h2>
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="btn-primary"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  {showUpload ? 'Cancel Upload' : 'Upload Documents'}
                </button>
              </div>

              {selectedAppointmentData?.service?.required_documents && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Required Documents for {selectedAppointmentData.service.name}:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedAppointmentData.service.required_documents.map((doc: string, index: number) => (
                      <div key={index} className="flex items-center text-sm text-yellow-800">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></div>
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showUpload && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Category *
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Select document category</option>
                      {documentCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && (
                    <DocumentUpload
                      appointmentId={selectedAppointment}
                      citizenId={user?.profile?.id || ''}
                      category={selectedCategory}
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Documents List */}
          {selectedAppointment && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Documents
              </h2>
              <DocumentList
                appointmentId={selectedAppointment}
                showActions={true}
              />
            </div>
          )}

          {/* All Documents */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              All My Documents
            </h2>
            <DocumentList
              citizenId={user?.profile?.id || ''}
              showActions={true}
            />
          </div>
        </>
      )}
        </div>
      )}
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <DocumentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}