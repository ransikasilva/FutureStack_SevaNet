'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, FileText, Phone, Mail, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'

interface OfficerAppointment {
  id: string
  booking_reference: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes: string
  officer_notes: string
  created_at: string
  updated_at: string
  citizen: {
    id: string
    full_name: string
    phone: string
    nic: string
  }
  service: {
    id: string
    name: string
    duration_minutes: number
    required_documents: string[]
  }
  time_slot: {
    start_time: string
    end_time: string
  }
  documents: Array<{
    id: string
    file_name: string
    document_category: string
    status: 'pending' | 'approved' | 'rejected'
    officer_comments: string
  }>
}

export default function OfficerAppointmentsPage() {
  const { user } = useAuthContext()
  const { sendAppointmentCancellation, sendDocumentStatusUpdate } = useNotifications()
  const [appointments, setAppointments] = useState<OfficerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed'>('today')
  const [selectedAppointment, setSelectedAppointment] = useState<OfficerAppointment | null>(null)
  const [showDocuments, setShowDocuments] = useState(false)

  useEffect(() => {
    if (user?.profile?.role !== 'officer' || !user.profile.department_id) {
      return
    }

    fetchAppointments()
  }, [user, filter])

  const fetchAppointments = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('appointments')
        .select(`
          *,
          citizen:profiles!citizen_id (
            id,
            full_name,
            phone,
            nic
          ),
          service:services (
            id,
            name,
            duration_minutes,
            required_documents
          ),
          time_slot:time_slots (
            start_time,
            end_time
          ),
          documents (
            id,
            file_name,
            document_category,
            status,
            officer_comments
          )
        `)

      // Filter by department
      if (user?.profile?.department_id) {
        query = query.eq('service.department_id', user.profile.department_id)
      }

      // Apply date/status filters
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

      switch (filter) {
        case 'today':
          query = query
            .gte('time_slot.start_time', startOfDay.toISOString())
            .lt('time_slot.start_time', endOfDay.toISOString())
          break
        case 'pending':
          query = query.eq('status', 'pending')
          break
        case 'confirmed':
          query = query.eq('status', 'confirmed')
          break
      }

      const { data, error } = await query
        .order('time_slot.start_time', { ascending: true })

      if (error) throw error

      setAppointments(data || [])
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status,
          officer_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error

      // Send notification if cancelled
      if (status === 'cancelled') {
        const appointment = appointments.find(a => a.id === appointmentId)
        if (appointment) {
          await sendAppointmentCancellation(
            appointmentId,
            appointment.citizen.id,
            notes
          )
        }
      }

      fetchAppointments()
    } catch (error) {
      console.error('Failed to update appointment:', error)
    }
  }

  const updateDocumentStatus = async (
    documentId: string, 
    status: 'approved' | 'rejected', 
    comments?: string
  ) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status,
          officer_comments: comments || ''
        })
        .eq('id', documentId)

      if (error) throw error

      // Send notification
      const doc = selectedAppointment?.documents.find(d => d.id === documentId)
      if (doc && selectedAppointment) {
        await sendDocumentStatusUpdate(
          selectedAppointment.id,
          selectedAppointment.citizen.id,
          doc.file_name,
          status,
          comments
        )
      }

      fetchAppointments()
    } catch (error) {
      console.error('Failed to update document:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'confirmed': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'no_show': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  if (user?.profile?.role !== 'officer') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">This page is only accessible to government officers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600">Review and manage citizen appointments</p>
        </div>

        <div className="flex space-x-2">
          {['all', 'today', 'pending', 'confirmed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${
                filter === filterOption
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
          <p className="text-gray-600">No appointments match your current filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.citizen.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">{appointment.service.name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(appointment.time_slot.start_time)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(appointment.time_slot.start_time)} - {formatTime(appointment.time_slot.end_time)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {appointment.booking_reference}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {appointment.citizen.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        {appointment.documents.length} documents uploaded
                      </div>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <strong>Citizen Notes:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}

                  {appointment.officer_notes && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <strong>Officer Notes:</strong> {appointment.officer_notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setSelectedAppointment(appointment)
                      setShowDocuments(true)
                    }}
                    className="btn-secondary text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </button>

                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                        className="btn-primary text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for cancellation:')
                          if (reason) {
                            updateAppointmentStatus(appointment.id, 'cancelled', reason)
                          }
                        }}
                        className="btn-danger text-sm"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </>
                  )}

                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                      className="btn-primary text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Review Modal */}
      {showDocuments && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDocuments(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Document Review - {selectedAppointment.citizen.full_name}
                </h3>

                <div className="space-y-4">
                  {selectedAppointment.documents.length === 0 ? (
                    <p className="text-gray-600">No documents uploaded yet.</p>
                  ) : (
                    selectedAppointment.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.file_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{doc.document_category}</p>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                          </div>

                          {doc.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateDocumentStatus(doc.id, 'approved')}
                                className="btn-primary text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const comments = prompt('Rejection reason:')
                                  if (comments) {
                                    updateDocumentStatus(doc.id, 'rejected', comments)
                                  }
                                }}
                                className="btn-danger text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>

                        {doc.officer_comments && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">
                              <strong>Comments:</strong> {doc.officer_comments}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDocuments(false)}
                    className="btn-secondary"
                  >
                    Close
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