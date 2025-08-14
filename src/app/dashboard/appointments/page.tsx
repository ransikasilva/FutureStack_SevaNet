'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUserAppointments, cancelAppointment } from '@/hooks/useAppointments'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  QrCode,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { QRCodeDisplay, QRCodeThumbnail } from '@/components/appointments/QRCodeDisplay'

function AppointmentsContent() {
  const { user } = useAuthContext()
  const { appointments, loading, refetch } = useUserAppointments(user?.profile?.id || '')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showQRModal, setShowQRModal] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'no_show':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-800 bg-green-100 border-green-200'
      case 'pending':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200'
      case 'completed':
        return 'text-blue-800 bg-blue-100 border-blue-200'
      case 'cancelled':
        return 'text-red-800 bg-red-100 border-red-200'
      case 'no_show':
        return 'text-red-800 bg-red-100 border-red-200'
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200'
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    setCancellingId(appointmentId)
    try {
      await cancelAppointment(appointmentId)
      refetch()
    } catch (error) {
      console.error('Failed to cancel appointment:', error)
      alert('Failed to cancel appointment. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus === 'all') return true
    return appointment.status === filterStatus
  })

  const canCancelAppointment = (appointment: any) => {
    return appointment.status === 'pending' || appointment.status === 'confirmed'
  }

  const openQRModal = (appointment: any) => {
    setSelectedAppointment(appointment)
    setShowQRModal(true)
  }

  const closeQRModal = () => {
    setSelectedAppointment(null)
    setShowQRModal(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading appointments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage and track your government service appointments
            </p>
          </div>
          <div className="mt-6 sm:mt-0">
            <Link
              href="/dashboard/book"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-government-dark-blue hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-dark-blue"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book New Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Filter by Status
              </label>
              <select
                className="w-48 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Appointments</option>
                <option value="pending">Pending Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">
                Showing {filteredAppointments.length} of {appointments.length} appointments
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {appointments.filter(a => a.status === 'confirmed').length} confirmed • {appointments.filter(a => a.status === 'pending').length} pending
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
            <div className="text-sm font-medium text-gray-600">Total Appointments</div>
            <div className="text-xs text-gray-500 mt-1">All time</div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="text-center py-16 px-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filterStatus === 'all' ? 'No appointments yet' : `No ${filterStatus} appointments`}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {filterStatus === 'all' 
                ? "You haven't booked any appointments yet. Get started by scheduling your first government service appointment."
                : `You don't have any ${filterStatus} appointments at the moment.`
              }
            </p>
            <Link
              href="/dashboard/book"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-government-dark-blue hover:bg-blue-800 transition-colors"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Your First Appointment
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-government-dark-blue transition-all duration-300"
            >
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          {getStatusIcon(appointment.status)}
                          <span className={`ml-3 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                            {appointment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {appointment.service?.name}
                        </h3>
                        <p className="text-base text-gray-600 font-medium">
                          {appointment.service?.department?.name}
                        </p>
                      </div>
                      
                      <div className="text-right ml-6">
                        <div className="text-base font-bold text-gray-900 mb-1">
                          {appointment.booking_reference}
                        </div>
                        <div className="text-sm text-gray-500">
                          Booked {format(new Date(appointment.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="font-medium">
                            {appointment.time_slot && 
                              format(new Date(appointment.time_slot.start_time), 'EEEE, MMMM d, yyyy')
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="font-medium">
                            {appointment.time_slot && 
                              `${format(new Date(appointment.time_slot.start_time), 'h:mm a')} - ${format(new Date(appointment.time_slot.end_time), 'h:mm a')}`
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-700">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <span className="font-medium">
                            {appointment.service?.department?.address || 'Address not available'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-700">
                          <Phone className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="font-medium">
                            {appointment.service?.department?.contact_phone || 'Contact not available'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Your Notes:</h4>
                        <p className="text-blue-800">{appointment.notes}</p>
                      </div>
                    )}

                    {appointment.officer_notes && (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">Officer Notes:</h4>
                        <p className="text-yellow-800">{appointment.officer_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 lg:mt-0 lg:ml-8 flex flex-col items-center gap-4">
                    {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                      <QRCodeThumbnail 
                        appointmentId={appointment.id}
                        bookingReference={appointment.booking_reference}
                        className="cursor-pointer"
                      />
                    )}
                    
                    <div className="flex flex-col gap-3 w-full min-w-[140px]">
                      <button
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        onClick={() => openQRModal(appointment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      
                      {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                        <button
                          className="inline-flex items-center justify-center px-4 py-2 border border-government-dark-blue text-government-dark-blue bg-white rounded-lg hover:bg-blue-50 transition-colors font-medium"
                          onClick={() => openQRModal(appointment)}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </button>
                      )}
                      
                      {canCancelAppointment(appointment) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={cancellingId === appointment.id}
                          className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helpful Information */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Appointment Guidelines
          </h3>
          <p className="text-gray-600 mt-1">Important information for your government service appointments</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">Before Your Appointment</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Arrive 15 minutes early for check-in procedures</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Bring all required original documents and photocopies</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Keep your booking reference number accessible</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Check for updates via SMS or email notifications</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">Need Assistance?</h4>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <span>support@sevanet.lk</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span>1919 (Toll-free hotline)</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <span>Mon-Fri: 8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <span>Emergency services available 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeQRModal} />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={closeQRModal}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Appointment Details & QR Code
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointment Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Appointment Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service:</span>
                            <span className="font-medium">{selectedAppointment.service?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Department:</span>
                            <span className="font-medium">{selectedAppointment.service?.department?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Reference:</span>
                            <span className="font-mono font-bold">{selectedAppointment.booking_reference}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                              {selectedAppointment.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">
                              {selectedAppointment.time_slot && 
                                format(new Date(selectedAppointment.time_slot.start_time), 'MMM d, yyyy')
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">
                              {selectedAppointment.time_slot && 
                                `${format(new Date(selectedAppointment.time_slot.start_time), 'HH:mm')} - ${format(new Date(selectedAppointment.time_slot.end_time), 'HH:mm')}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedAppointment.notes && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Your Notes</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {selectedAppointment.notes}
                          </p>
                        </div>
                      )}

                      {selectedAppointment.officer_notes && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Officer Notes</h4>
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                            {selectedAppointment.officer_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center lg:justify-end">
                      {(selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'pending') ? (
                        <QRCodeDisplay 
                          appointmentId={selectedAppointment.id}
                          size="lg"
                          showActions={true}
                        />
                      ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            QR code is only available for confirmed and pending appointments
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={closeQRModal}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <AppointmentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}