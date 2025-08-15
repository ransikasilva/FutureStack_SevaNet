'use client'

import { useState, useEffect } from 'react'
import { Calendar, FileText, CheckCircle, XCircle, Eye, Users, Play, UserX } from 'lucide-react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'

interface OfficerAppointment {
  id: string
  booking_reference: string
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'no_show'
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
  console.log('🚀 OfficerAppointmentsPage component is loading!')
  
  const { user } = useAuthContext()
  const { sendAppointmentCancellation, sendDocumentStatusUpdate } = useNotifications()
  const [appointments, setAppointments] = useState<OfficerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed' | 'ongoing' | 'no_show'>('today')
  const [selectedAppointment, setSelectedAppointment] = useState<OfficerAppointment | null>(null)
  const [showDocuments, setShowDocuments] = useState(false)

  useEffect(() => {
    console.log('Appointments page useEffect triggered', { 
      userRole: user?.profile?.role, 
      departmentId: user?.profile?.department_id,
      filter 
    })
    
    if (user?.profile?.role !== 'officer' || !user.profile.department_id) {
      console.log('Appointments page: Not officer or missing department ID')
      return
    }

    console.log('Appointments page: Starting fetchAppointments')
    fetchAppointments()
  }, [user, filter])

  const checkAndUpdateOverdueAppointments = async () => {
    try {
      const now = new Date().toISOString()
      
      // Find confirmed appointments that are past their end time
      const { data: overdueAppointments, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          time_slots!inner(end_time)
        `)
        .eq('status', 'confirmed')
        .lt('time_slots.end_time', now)
      
      if (fetchError) {
        console.error('Error fetching overdue appointments:', fetchError)
        return
      }
      
      if (overdueAppointments && overdueAppointments.length > 0) {
        // Update overdue appointments to no_show
        const appointmentIds = overdueAppointments.map(apt => apt.id)
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ 
            status: 'no_show',
            updated_at: now
          })
          .in('id', appointmentIds)
        
        if (updateError) {
          console.error('Error updating overdue appointments:', updateError)
        } else {
          console.log(`Updated ${appointmentIds.length} overdue appointments to no_show`)
        }
      }
    } catch (error) {
      console.error('Error in checkAndUpdateOverdueAppointments:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)

      // First check and update overdue appointments
      await checkAndUpdateOverdueAppointments()

      // Use a single optimized query with all joins
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services!inner(
            id, name, duration_minutes, required_documents, department_id
          ),
          profiles!citizen_id(
            id, full_name, phone, nic
          ),
          time_slots(
            start_time, end_time
          )
        `)

      // Filter by department using the joined table
      if (user?.profile?.department_id) {
        query = query.eq('services.department_id', user.profile.department_id)
      }

      console.log('Fetching appointments for department:', user?.profile?.department_id)

      // Apply status filters only
      switch (filter) {
        case 'pending':
          query = query.eq('status', 'pending')
          break
        case 'confirmed':
          query = query.eq('status', 'confirmed')
          break
        case 'ongoing':
          query = query.eq('status', 'ongoing')
          break
        case 'no_show':
          query = query.eq('status', 'no_show')
          break
        case 'today':
          // Show all appointments
          break
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50) // Limit to prevent timeout

      console.log('Appointments query result:', { data, error, count: data?.length })

      if (error) {
        console.error('Query error details:', error)
        throw error
      }

      // Fetch documents for each appointment
      const appointmentIds = (data || []).map(apt => apt.id)
      
      let documentsData = []
      if (appointmentIds.length > 0) {
        const { data: docs, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .in('appointment_id', appointmentIds)
        
        if (docsError) {
          console.error('Failed to fetch documents:', docsError)
        } else {
          documentsData = docs || []
        }
      }

      // Map the data - all data is already joined, and include documents
      const mappedAppointments = (data || []).map((appointment) => {
        return {
          ...appointment,
          service: appointment.services, // Use the joined services data
          citizen: appointment.profiles || { 
            id: appointment.citizen_id || 'temp',
            full_name: 'Unknown Citizen', 
            phone: 'N/A',
            nic: 'N/A'
          },
          time_slot: appointment.time_slots || { 
            start_time: 'TBD', // To Be Determined if no time slot
            end_time: 'TBD'
          },
          documents: documentsData.filter(doc => doc.appointment_id === appointment.id)
        }
      })

      console.log('Mapped appointments:', mappedAppointments)
      console.log('Setting appointments state with count:', mappedAppointments.length)

      setAppointments(mappedAppointments)
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
      case 'ongoing': return 'text-purple-600 bg-purple-100'
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
    <div className="space-y-10">
      {/* Professional Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Officer Dashboard</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Appointment Management
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Review, approve, and manage citizen appointment requests efficiently
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <div className="flex flex-wrap gap-3">
              {['all', 'today', 'pending', 'confirmed', 'ongoing', 'no_show'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300 backdrop-blur-sm ${
                    filter === filterOption
                      ? 'bg-white text-government-dark-blue shadow-xl'
                      : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                  }`}
                >
                  {filterOption === 'no_show' ? 'No Show' : filterOption}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 rounded-3xl"></div>
          <div className="relative">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-government-dark-blue border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Appointments</h3>
            <p className="text-gray-600">Fetching your appointment data...</p>
          </div>
        </div>
      ) : (console.log('Rendering appointments check - length:', appointments.length), appointments.length === 0) ? (
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 rounded-3xl"></div>
          <div className="relative">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                <Calendar className="h-16 w-16 text-blue-400" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">No Appointments Found</h3>
            <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
              No appointments match your current filter criteria. Try adjusting your filters or check back later.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Users className="h-5 w-5 text-government-dark-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {appointment.citizen.full_name}
                      </h3>
                      <p className="text-base text-gray-600 font-medium">{appointment.service.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    {/* Status-specific action buttons */}
                    <div className="flex flex-col space-y-2 w-32">
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for cancellation:')
                              if (reason) {
                                updateAppointmentStatus(appointment.id, 'cancelled', reason)
                              }
                            }}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      )}

                      {appointment.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'ongoing')}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'no_show')}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            No Show
                          </button>
                        </>
                      )}

                      {appointment.status === 'ongoing' && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-white bg-government-dark-blue rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'no_show')}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            No Show
                          </button>
                        </>
                      )}

                      {/* For final statuses (completed, cancelled), show descriptive text */}
                      {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500 font-medium">
                            {appointment.status === 'completed' && 'Appointment completed'}
                            {appointment.status === 'cancelled' && 'Appointment cancelled'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Status badge, Review Docs button, and descriptive text on the right */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-2 rounded-xl text-sm font-bold ${getStatusColor(appointment.status)} border`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                        
                        {/* Always show review documents button at same level as status */}
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowDocuments(true)
                          }}
                          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Docs
                        </button>
                      </div>
                      
                      {/* Show descriptive text under status badge and button for no_show */}
                      {appointment.status === 'no_show' && (
                        <div className="text-center">
                          <span className="text-xs text-gray-500 font-medium">
                            Citizen did not show up
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Date:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {appointment.time_slot.start_time !== 'TBD' 
                          ? formatDate(appointment.time_slot.start_time) 
                          : 'Not scheduled'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Time:</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {appointment.time_slot.start_time !== 'TBD' 
                          ? `${formatTime(appointment.time_slot.start_time)} - ${formatTime(appointment.time_slot.end_time)}`
                          : 'Not scheduled'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Reference:</span>
                      <span className="text-sm text-gray-900 font-mono font-medium">{appointment.booking_reference}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <span className="text-sm text-gray-900 font-medium">{appointment.citizen.phone}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Documents:</span>
                      <span className="text-sm text-gray-900 font-medium">{appointment.documents.length} uploaded</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Booked:</span>
                      <span className="text-sm text-gray-900 font-medium">{formatDate(appointment.created_at)}</span>
                    </div>
                  </div>
                </div>

                    {appointment.notes && (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <h4 className="font-medium text-gray-900 mb-2">Citizen Notes:</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{appointment.notes}</p>
                      </div>
                    )}

                    {appointment.officer_notes && (
                      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="font-medium text-blue-900 mb-2">Officer Notes:</h4>
                        <p className="text-blue-800 text-sm leading-relaxed">{appointment.officer_notes}</p>
                      </div>
                    )}
                  </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Document Review Modal */}
      {showDocuments && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-government-dark-blue bg-opacity-60 transition-opacity" onClick={() => setShowDocuments(false)} />

            <div className="relative inline-block align-bottom bg-white/95 backdrop-blur-xl rounded-3xl px-10 pt-10 pb-10 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 rounded-3xl"></div>
              
              <div className="relative">
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mr-6">
                        <FileText className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-4xl font-black text-gray-900 mb-2">
                          Document Review
                        </h3>
                        <p className="text-gray-600 text-xl font-medium">{selectedAppointment.citizen.full_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {selectedAppointment.documents.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="relative w-32 h-32 mx-auto mb-8">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                          <FileText className="h-16 w-16 text-blue-400" />
                        </div>
                      </div>
                      <h4 className="text-3xl font-black text-gray-900 mb-4">No Documents Uploaded</h4>
                      <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">This appointment doesn't have any documents uploaded yet.</p>
                    </div>
                  ) : (
                    selectedAppointment.documents.map((doc) => (
                      <div key={doc.id} className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-3xl"></div>
                        
                        <div className="relative flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-6">
                              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mr-6 group-hover:scale-110 transition-transform duration-300">
                                <FileText className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <h4 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{doc.file_name}</h4>
                                <p className="text-gray-600 capitalize font-medium text-lg">{doc.document_category}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-6 py-3 rounded-2xl text-lg font-black ${getStatusColor(doc.status)} border shadow-lg`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </div>

                          {doc.status === 'pending' && (
                            <div className="flex space-x-4 ml-8">
                              <button
                                onClick={() => updateDocumentStatus(doc.id, 'approved')}
                                className="group/btn inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                              >
                                <CheckCircle className="h-6 w-6 mr-3 group-hover/btn:animate-pulse" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const comments = prompt('Rejection reason:')
                                  if (comments) {
                                    updateDocumentStatus(doc.id, 'rejected', comments)
                                  }
                                }}
                                className="group/btn inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                              >
                                <XCircle className="h-6 w-6 mr-3 group-hover/btn:animate-pulse" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>

                        {doc.officer_comments && (
                          <div className="relative mt-8 p-6 bg-white/60 backdrop-blur-sm border border-blue-200 rounded-2xl">
                            <h5 className="text-lg font-black text-gray-900 mb-3">Officer Comments:</h5>
                            <p className="text-gray-700 leading-relaxed text-lg">{doc.officer_comments}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={() => setShowDocuments(false)}
                    className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-gray-50 to-blue-50 text-government-dark-blue hover:from-blue-50 hover:to-indigo-50 font-bold rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 text-xl shadow-lg"
                  >
                    Close Review
                    <XCircle className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
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