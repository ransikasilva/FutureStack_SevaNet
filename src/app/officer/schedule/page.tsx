'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { useTodaysSchedule } from '@/hooks/useOfficerData'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface CalendarDay {
  date: Date
  appointments: any[]
  isCurrentMonth: boolean
  isToday: boolean
}

export default function OfficerSchedulePage() {
  const { user } = useAuthContext()
  const departmentId = user?.profile?.department_id || ''
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)

  const { schedule, loading, error } = useTodaysSchedule(departmentId)

  // Calendar generation functions
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const lastDateOfMonth = lastDayOfMonth.getDate()
    
    const days: CalendarDay[] = []
    
    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({
        date,
        appointments: getAppointmentsForDate(date),
        isCurrentMonth: false,
        isToday: isToday(date)
      })
    }
    
    // Current month days
    for (let date = 1; date <= lastDateOfMonth; date++) {
      const currentDay = new Date(year, month, date)
      days.push({
        date: currentDay,
        appointments: getAppointmentsForDate(currentDay),
        isCurrentMonth: true,
        isToday: isToday(currentDay)
      })
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length
    for (let date = 1; date <= remainingDays; date++) {
      const nextMonthDay = new Date(year, month + 1, date)
      days.push({
        date: nextMonthDay,
        appointments: getAppointmentsForDate(nextMonthDay),
        isCurrentMonth: false,
        isToday: isToday(nextMonthDay)
      })
    }
    
    return days
  }

  const getAppointmentsForDate = (date: Date): any[] => {
    // Get date in local timezone to avoid timezone issues
    const targetYear = date.getFullYear()
    const targetMonth = date.getMonth()
    const targetDay = date.getDate()
    
    return schedule.filter(appointment => {
      // Use time_slot.start_time if available, otherwise fall back to created_at
      const appointmentTime = appointment.time_slot?.start_time || appointment.created_at
      const appointmentDate = new Date(appointmentTime)
      
      // Compare using local date components to avoid timezone shifts
      return (
        appointmentDate.getFullYear() === targetYear &&
        appointmentDate.getMonth() === targetMonth &&
        appointmentDate.getDate() === targetDay
      )
    })
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Error Loading Schedule</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Calendar</h1>
          <p className="text-gray-600">Department appointment calendar</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['month', 'week', 'day'] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  view === viewType
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {schedule.length} total appointments
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading calendar...</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {generateCalendarDays().map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[120px] bg-white p-2 ${
                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${day.isToday ? 'bg-blue-50 border-2 border-blue-200' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    !day.isCurrentMonth ? 'text-gray-400' : 
                    day.isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day.date.getDate()}
                  </div>

                  {/* Appointments for this day */}
                  <div className="space-y-1">
                    {day.appointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={() => setSelectedAppointment(appointment)}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                          getStatusColor(appointment.status)
                        }`}
                      >
                        <div className="font-medium truncate">
                          {appointment.citizen?.full_name || 'Unknown'}
                        </div>
                        <div className="truncate opacity-75">
                          {appointment.service?.name || 'Service'}
                        </div>
                      </div>
                    ))}
                    
                    {day.appointments.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{day.appointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/officer/appointments"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
            >
              <div className="text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Manage All Appointments</span>
              </div>
            </Link>

            <Link
              href="/officer/documents"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
            >
              <div className="text-center">
                <FileText className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-900">Review Documents</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedAppointment(null)} />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Appointment Details
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Citizen</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedAppointment.citizen?.full_name || 'Unknown Citizen'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Service</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedAppointment.service?.name || 'Unknown Service'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedAppointment.citizen?.phone || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reference</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">
                          {selectedAppointment.booking_reference}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Appointment Date & Time</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedAppointment.time_slot?.start_time ? (
                          <>
                            {formatDate(selectedAppointment.time_slot.start_time)} at {formatTime(selectedAppointment.time_slot.start_time)}
                            {selectedAppointment.time_slot.end_time && (
                              <> - {formatTime(selectedAppointment.time_slot.end_time)}</>
                            )}
                          </>
                        ) : (
                          <>
                            {formatDate(selectedAppointment.created_at)} at {formatTime(selectedAppointment.created_at)}
                            <span className="text-gray-500 text-xs ml-2">(Created time - no slot assigned)</span>
                          </>
                        )}
                      </p>
                    </div>

                    {selectedAppointment.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Citizen Notes</label>
                        <p className="mt-1 text-sm text-gray-900 p-3 bg-gray-50 rounded border">
                          {selectedAppointment.notes}
                        </p>
                      </div>
                    )}

                    {selectedAppointment.officer_notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Officer Notes</label>
                        <p className="mt-1 text-sm text-gray-900 p-3 bg-blue-50 rounded border border-blue-200">
                          {selectedAppointment.officer_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Link
                    href="/officer/appointments"
                    className="btn-primary"
                    onClick={() => setSelectedAppointment(null)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Manage Appointment
                  </Link>
                  
                  <button
                    onClick={() => setSelectedAppointment(null)}
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