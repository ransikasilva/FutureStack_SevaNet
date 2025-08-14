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
  Wallet,
  Shield,
  Lock
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
            <p className="text-lg text-gray-600 mt-2">
              Securely upload and manage your documents for government services
            </p>
          </div>
          <div className="mt-6 sm:mt-0 flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <Shield className="h-4 w-4 mr-1" />
              <span>256-bit encrypted</span>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-government-dark-blue hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-dark-blue"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Documents
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-3 px-4 border-b-2 font-semibold text-base transition-colors ${
                activeTab === 'appointments'
                  ? 'border-government-dark-blue text-government-dark-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-5 w-5 mr-2 inline" />
              Appointment Documents
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`py-3 px-4 border-b-2 font-semibold text-base transition-colors ${
                activeTab === 'wallet'
                  ? 'border-government-dark-blue text-government-dark-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wallet className="h-5 w-5 mr-2 inline" />
              Document Wallet
            </button>
          </nav>
        </div>
        
        <div className="p-8">
          {/* Success/Error Messages */}
          {uploadSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl flex items-center">
              <CheckCircle className="h-5 w-5 mr-3" />
              <span className="font-medium">{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center">
              <AlertTriangle className="h-5 w-5 mr-3" />
              <span className="font-medium">{uploadError}</span>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'wallet' ? (
            <DocumentWallet />
          ) : (
            <div className="space-y-8">
              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start">
                  <Lock className="h-6 w-6 text-blue-600 mt-0.5 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      Secure Document Upload
                    </h3>
                    <div className="text-blue-800 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Upload Guidelines:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• Upload documents before your appointment for faster processing</li>
                            <li>• Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB each)</li>
                            <li>• Ensure documents are clear and readable</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Security Features:</h4>
                          <ul className="space-y-1 text-sm">
                            <li>• End-to-end encryption for all uploads</li>
                            <li>• Officers review documents before appointments</li>
                            <li>• Automatic virus scanning on all files</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {appointmentsLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your appointments...</p>
                </div>
              ) : eligibleAppointments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Active Appointments
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    You need to have pending or confirmed appointments to upload documents. Book an appointment to get started.
                  </p>
                  <a
                    href="/dashboard/book"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-government-dark-blue hover:bg-blue-800 transition-colors"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Book New Appointment
                  </a>
                </div>
              ) : (
                <>
                  {/* Appointment Selection */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Select Appointment for Document Upload
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {eligibleAppointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className={`border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedAppointment === appointment.id
                                ? 'border-government-dark-blue bg-blue-50 shadow-md'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onClick={() => setSelectedAppointment(appointment.id)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {appointment.service?.name}
                                </h3>
                                <p className="text-gray-600 mt-1">
                                  {appointment.service?.department?.name}
                                </p>
                              </div>
                              <div className="flex items-center">
                                {appointment.status === 'confirmed' ? (
                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                ) : (
                                  <Clock className="h-6 w-6 text-yellow-500" />
                                )}
                              </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>Reference:</span>
                                <span className="font-medium">{appointment.booking_reference}</span>
                              </div>
                              {appointment.time_slot && (
                                <div className="flex justify-between">
                                  <span>Date:</span>
                                  <span className="font-medium">
                                    {new Date(appointment.time_slot.start_time).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upload Section */}
                    {selectedAppointment && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-xl font-bold text-gray-900">
                            Upload Documents
                          </h2>
                          <button
                            onClick={() => setShowUpload(!showUpload)}
                            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              showUpload
                                ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
                                : 'text-white bg-government-dark-blue hover:bg-blue-800 focus:ring-government-dark-blue'
                            }`}
                          >
                            <Upload className="h-5 w-5 mr-2" />
                            {showUpload ? 'Cancel Upload' : 'Upload Documents'}
                          </button>
                        </div>

                        {selectedAppointmentData?.service?.required_documents && (
                          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <h4 className="font-semibold text-yellow-900 mb-3">
                              Required Documents for {selectedAppointmentData.service.name}:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedAppointmentData.service.required_documents.map((doc: string, index: number) => (
                                <div key={index} className="flex items-center text-yellow-800">
                                  <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                                  <span className="font-medium">{doc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {showUpload && (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-900 mb-3">
                                Document Category *
                              </label>
                              <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
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
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-200">
                          <h2 className="text-xl font-bold text-gray-900">
                            Uploaded Documents for This Appointment
                          </h2>
                          <p className="text-gray-600 mt-1">View and manage documents for this specific appointment</p>
                        </div>
                        <div className="p-8">
                          <DocumentList
                            appointmentId={selectedAppointment}
                            showActions={true}
                          />
                        </div>
                      </div>
                    )}

                    {/* All Documents */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                      <div className="px-8 py-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">
                          All My Documents
                        </h2>
                        <p className="text-gray-600 mt-1">Complete overview of all your uploaded documents</p>
                      </div>
                      <div className="p-8">
                        <DocumentList
                          citizenId={user?.profile?.id || ''}
                          showActions={true}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
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