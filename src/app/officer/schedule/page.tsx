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
              Schedule Calendar
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              View and manage your department appointment calendar
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            {/* View Toggle */}
            <div className="flex rounded-xl overflow-hidden backdrop-blur-sm border border-white/30">
              {(['month', 'week', 'day'] as const).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-6 py-3 text-sm font-bold capitalize transition-all duration-300 ${
                    view === viewType
                      ? 'bg-white text-government-dark-blue shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="bg-gray-50 px-4 py-3 rounded-xl">
              <span className="text-sm font-medium text-gray-600">Total Appointments: </span>
              <span className="text-sm font-bold text-gray-900">{schedule.length}</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="p-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
            <p className="text-gray-600 mt-4 font-medium">Loading calendar...</p>
          </div>
        ) : (
          <div className="p-8">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 bg-gray-100 p-2 rounded-xl">
              {generateCalendarDays().map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[120px] bg-white p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    !day.isCurrentMonth ? 'bg-gray-50 opacity-60' : ''
                  } ${day.isToday ? 'bg-blue-50 border-blue-300 border-2' : 'border-gray-200'}`}
                >
                  <div className={`text-sm font-bold mb-2 ${
                    !day.isCurrentMonth ? 'text-gray-400' : 
                    day.isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day.date.getDate()}
                  </div>

                  {/* Appointments for this day */}
                  <div className="space-y-1">
                    {day.appointments.slice(0, 2).map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={() => setSelectedAppointment(appointment)}
                        className={`text-xs p-2 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200 ${
                          getStatusColor(appointment.status)
                        } border`}
                      >
                        <div className="font-bold truncate">
                          {appointment.citizen?.full_name || 'Unknown'}
                        </div>
                        <div className="truncate opacity-80">
                          {appointment.service?.name || 'Service'}
                        </div>
                      </div>
                    ))}
                    
                    {day.appointments.length > 2 && (
                      <div className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded-lg font-medium">
                        +{day.appointments.length - 2} more
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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <p className="text-gray-600 mt-1">Navigate to other officer functions</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link
              href="/officer/appointments"
              className="group flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-government-dark-blue hover:bg-blue-50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <span className="text-base font-bold text-gray-900 group-hover:text-government-dark-blue transition-colors">Manage All Appointments</span>
                <p className="text-sm text-gray-600 mt-2">View and manage appointment requests</p>
              </div>
            </Link>

            <Link
              href="/officer/documents"
              className="group flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-government-dark-blue hover:bg-blue-50 transition-all duration-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                  <FileText className="h-8 w-8 text-yellow-600" />
                </div>
                <span className="text-base font-bold text-gray-900 group-hover:text-government-dark-blue transition-colors">Review Documents</span>
                <p className="text-sm text-gray-600 mt-2">Review uploaded citizen documents</p>
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