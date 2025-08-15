'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'
import { 
  FileText, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react'

interface Document {
  id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  document_category: string
  status: 'pending' | 'approved' | 'rejected'
  officer_comments: string
  uploaded_at: string
  appointment: {
    id: string
    booking_reference: string
    status: string
    citizen: {
      full_name: string
      phone: string
    }
    service: {
      name: string
      department: {
        name: string
      }
    }
    time_slot: {
      start_time: string
    }
  }
}

interface DocumentReviewProps {
  departmentId?: string
  officerId?: string
}

export function DocumentReviewInterface({ departmentId, officerId }: DocumentReviewProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewComments, setReviewComments] = useState('')
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [processing, setProcessing] = useState(false)

  const { sendDocumentStatusUpdate } = useNotifications()

  useEffect(() => {
    fetchDocuments()
  }, [filter, departmentId])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          appointment:appointments (
            id,
            booking_reference,
            status,
            citizen:profiles!citizen_id (
              full_name,
              phone
            ),
            service:services (
              name,
              department:departments (
                name
              )
            ),
            time_slot:time_slots (
              start_time
            )
          )
        `)

      // Filter by department if provided
      if (departmentId) {
        query = query.eq('appointment.service.department_id', departmentId)
      }

      // Filter by status
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      setDocuments(data || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!selectedDocument) return

    setProcessing(true)
    try {
      const status = reviewAction === 'approve' ? 'approved' : 'rejected'
      
      const { error } = await supabase
        .from('documents')
        .update({
          status,
          officer_comments: reviewComments
        })
        .eq('id', selectedDocument.id)

      if (error) throw error

      // Send notification to citizen
      await sendDocumentStatusUpdate(
        selectedDocument.appointment.id,
        selectedDocument.appointment.citizen.id,
        selectedDocument.file_name,
        status,
        reviewComments
      )

      setReviewModal(false)
      setSelectedDocument(null)
      setReviewComments('')
      fetchDocuments()

    } catch (error) {
      console.error('Failed to update document status:', error)
      alert('Failed to update document status')
    } finally {
      setProcessing(false)
    }
  }

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = document.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download document:', error)
      alert('Failed to download document')
    }
  }

  const previewDocument = (document: Document) => {
    // For images, show in modal. For PDFs, open in new tab
    if (document.file_type.startsWith('image/')) {
      setSelectedDocument(document)
    } else {
      // For PDFs and other files, get public URL and open
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(document.file_path)
      
      window.open(data.publicUrl, '_blank')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`
  }

  const filteredDocuments = documents.filter(doc =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.appointment.citizen.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.appointment.booking_reference.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-10">
      {/* Professional Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative">
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-2 rounded-xl mr-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Officer Dashboard</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Document Review
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
            Review and manage citizen-uploaded documents efficiently and securely
          </p>
        </div>
      </div>

      {/* Professional Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Search & Filter Documents</h2>
          <p className="text-gray-600 mt-1">Find and manage uploaded documents</p>
        </div>
        <div className="p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Search className="h-5 w-5 text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="Search documents, citizens, or booking references..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
              />
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Filter className="h-5 w-5 text-gray-600" />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors min-w-[160px]"
              >
                <option value="all">All Documents</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="text-sm font-medium text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
              {filteredDocuments.length} documents found
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600">No documents match your current filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-8">
                    <div className="flex items-start space-x-6 mb-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900 truncate">
                            {document.file_name}
                          </h3>
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(document.status)} border`}>
                            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Citizen:</span>
                              <span className="text-sm text-gray-900">{document.appointment.citizen.full_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Reference:</span>
                              <span className="text-sm text-gray-900 font-mono">{document.appointment.booking_reference}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Category:</span>
                              <span className="text-sm text-gray-900">{document.document_category}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Uploaded:</span>
                              <span className="text-sm text-gray-900">{new Date(document.uploaded_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">File Size:</span>
                              <span className="text-sm text-gray-900">{formatFileSize(document.file_size)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Service:</span>
                              <span className="text-sm text-gray-900">{document.appointment.service.name}</span>
                            </div>
                          </div>
                        </div>

                        {document.officer_comments && (
                          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                            <h4 className="font-bold text-blue-900 mb-2">Officer Comments:</h4>
                            <p className="text-blue-800 leading-relaxed">{document.officer_comments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3 w-40 flex-shrink-0">
                    <button
                      onClick={() => previewDocument(document)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </button>

                    <button
                      onClick={() => downloadDocument(document)}
                      className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>

                    {document.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedDocument(document)
                          setReviewModal(true)
                          setReviewComments('')
                          setReviewAction('approve')
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-white bg-government-dark-blue rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setReviewModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Review Document: {selectedDocument.file_name}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Decision
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="approve"
                          checked={reviewAction === 'approve'}
                          onChange={(e) => setReviewAction(e.target.value as 'approve')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          Approve
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="reject"
                          checked={reviewAction === 'reject'}
                          onChange={(e) => setReviewAction(e.target.value as 'reject')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          Reject
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={
                        reviewAction === 'approve' 
                          ? "Optional comments for approval..."
                          : "Please explain why this document is being rejected..."
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setReviewModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReview}
                    disabled={processing || (reviewAction === 'reject' && !reviewComments.trim())}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : `${reviewAction === 'approve' ? 'Approve' : 'Reject'} Document`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}