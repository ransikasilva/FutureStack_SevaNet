'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useOfficerAppointments, useDepartmentStats, useTodaysSchedule } from '@/hooks/useOfficerData'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  FileText, 
  Users, 
  AlertCircle,
  TrendingUp,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

function OfficerDashboardContent() {
  const { user } = useAuthContext()
  const departmentId = user?.profile?.department_id || ''

  console.log('Officer Dashboard - User:', user)
  console.log('Officer Dashboard - User Role:', user?.profile?.role)
  console.log('Officer Dashboard - Department ID:', departmentId)

  const { appointments, loading: appointmentsLoading } = useOfficerAppointments(departmentId)
  const { stats, loading: statsLoading } = useDepartmentStats(departmentId)
  const { schedule, loading: scheduleLoading } = useTodaysSchedule(departmentId)

  const todaysAppointments = schedule.length
  const pendingReviews = appointments.filter(apt => 
    apt.documents?.some(doc => doc.status === 'pending')
  ).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-800 bg-green-100'
      case 'pending':
        return 'text-yellow-800 bg-yellow-100'
      case 'completed':
        return 'text-blue-800 bg-blue-100'
      case 'cancelled':
        return 'text-red-800 bg-red-100'
      default:
        return 'text-gray-800 bg-gray-100'
    }
  }

  const nextAppointment = schedule.find(apt => 
    new Date(apt.time_slot?.start_time || '') > new Date()
  )

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-government-gold/20 via-transparent to-primary-500/30 rounded-3xl"></div>
        <div className="relative px-8 py-10 text-white rounded-3xl shadow-premium border border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                Welcome back, Officer {user?.profile?.full_name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-primary-100 text-lg font-medium">
                Managing Immigration & Emigration Department • {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <div className="text-4xl">🏛️</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-elevated group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">
                Today's Appointments
              </p>
              <p className="text-3xl font-bold text-secondary-900 mt-2">
                {scheduleLoading ? (
                  <div className="skeleton h-8 w-16"></div>
                ) : (
                  <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                    {todaysAppointments}
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl group-hover:from-primary-200 group-hover:to-primary-300 transition-colors">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card-elevated group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">
                Pending Reviews
              </p>
              <p className="text-3xl font-bold text-secondary-900 mt-2">
                {appointmentsLoading ? (
                  <div className="skeleton h-8 w-16"></div>
                ) : (
                  <span className="bg-gradient-to-r from-warning-600 to-warning-700 bg-clip-text text-transparent">
                    {pendingReviews}
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-warning-100 to-warning-200 rounded-xl group-hover:from-warning-200 group-hover:to-warning-300 transition-colors">
              <FileText className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card-elevated group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">
                Confirmed Today
              </p>
              <p className="text-3xl font-bold text-secondary-900 mt-2">
                {statsLoading ? (
                  <div className="skeleton h-8 w-16"></div>
                ) : (
                  <span className="bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent">
                    {stats.confirmed_appointments}
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-success-100 to-success-200 rounded-xl group-hover:from-success-200 group-hover:to-success-300 transition-colors">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card-elevated group hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">
                Total This Month
              </p>
              <p className="text-3xl font-bold text-secondary-900 mt-2">
                {statsLoading ? (
                  <div className="skeleton h-8 w-16"></div>
                ) : (
                  <span className="bg-gradient-to-r from-government-gold to-yellow-600 bg-clip-text text-transparent">
                    {stats.total_appointments}
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl group-hover:from-yellow-200 group-hover:to-yellow-300 transition-colors">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-elevated">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600 mt-1">Access frequently used functions</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/officer/appointments"
              className="group relative bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-primary-50 rounded-xl group-hover:bg-primary-100 transition-colors">
                <Calendar className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center">
                Appointments
              </h3>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Review and manage scheduled appointments
              </p>
              <div className="mt-4 flex justify-center">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                  {appointmentsLoading ? '...' : appointments.length} pending
                </span>
              </div>
            </Link>

            <Link
              href="/officer/documents"
              className="group relative bg-white p-6 rounded-xl border border-gray-200 hover:border-warning-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-warning-50 rounded-xl group-hover:bg-warning-100 transition-colors">
                <FileText className="h-7 w-7 text-warning-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center">
                Documents
              </h3>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Review and approve submitted documents
              </p>
              <div className="mt-4 flex justify-center">
                <span className="text-xs font-medium text-warning-600 bg-warning-50 px-2 py-1 rounded-full">
                  {pendingReviews} reviews needed
                </span>
              </div>
            </Link>

            <Link
              href="/officer/schedule"
              className="group relative bg-white p-6 rounded-xl border border-gray-200 hover:border-success-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-center w-14 h-14 mx-auto bg-success-50 rounded-xl group-hover:bg-success-100 transition-colors">
                <Clock className="h-7 w-7 text-success-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center">
                Schedule
              </h3>
              <p className="mt-2 text-sm text-gray-600 text-center">
                View your daily appointment calendar
              </p>
              <div className="mt-4 flex justify-center">
                <span className="text-xs font-medium text-success-600 bg-success-50 px-2 py-1 rounded-full">
                  {todaysAppointments} today
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <div className="card-elevated">
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Next Appointment</h2>
            <p className="text-sm text-gray-600 mt-1">Your upcoming appointment</p>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between p-6 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {nextAppointment.citizen?.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {nextAppointment.service?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {nextAppointment.time_slot && 
                      format(new Date(nextAppointment.time_slot.start_time), 'h:mm a')
                    } • Ref: {nextAppointment.booking_reference}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(nextAppointment.status)}`}>
                  {nextAppointment.status}
                </span>
                <Link
                  href={`/officer/appointments/${nextAppointment.id}`}
                  className="p-2 text-primary-600 hover:text-primary-800 bg-white rounded-lg shadow-sm border"
                >
                  <Eye className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule Overview */}
      <div className="card-elevated">
        <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">Your appointments for today</p>
          </div>
          <Link
            href="/officer/schedule"
            className="btn-secondary text-sm"
          >
            View Calendar
          </Link>
        </div>
        <div className="p-8">
          {scheduleLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading schedule...</p>
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
              <p className="text-gray-500">You have a clear schedule for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg min-w-[60px] text-center">
                      {appointment.time_slot && 
                        format(new Date(appointment.time_slot.start_time), 'HH:mm')
                      }
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">
                        {appointment.citizen?.full_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {appointment.service?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.documents?.some(doc => doc.status === 'pending') && (
                      <div className="flex items-center space-x-1 text-warning-600 bg-warning-50 px-2 py-1 rounded-full">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-xs font-medium">Docs</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {schedule.length > 5 && (
                <div className="text-center pt-4">
                  <Link
                    href="/officer/schedule"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View {schedule.length - 5} more appointments →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OfficerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['officer']}>
      <OfficerDashboardContent />
    </ProtectedRoute>
  )
}