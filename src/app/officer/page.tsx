'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
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
  const officerId = user?.profile?.id || ''

  const { appointments, loading: appointmentsLoading } = useOfficerAppointments(departmentId)
  const { stats, loading: statsLoading } = useDepartmentStats(departmentId)
  const { schedule, loading: scheduleLoading } = useTodaysSchedule(officerId)

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm">
        <div className="px-6 py-8 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome, Officer {user?.profile?.full_name || 'User'}!
          </h1>
          <p className="text-blue-100">
            Manage appointments and review documents for your department
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {scheduleLoading ? '...' : todaysAppointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Reviews
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {appointmentsLoading ? '...' : pendingReviews}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Confirmed Today
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsLoading ? '...' : stats.confirmed_appointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total This Month
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsLoading ? '...' : stats.total_appointments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/officer/appointments"
              className="relative group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 text-center">
                Manage Appointments
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Review and update appointment status
              </p>
            </Link>

            <Link
              href="/officer/documents"
              className="relative group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 text-center">
                Review Documents
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Approve or reject submitted documents
              </p>
            </Link>

            <Link
              href="/officer/schedule"
              className="relative group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 text-center">
                View Schedule
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Check your daily appointment schedule
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Next Appointment</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {nextAppointment.citizen?.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {nextAppointment.service?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {nextAppointment.time_slot && 
                      format(new Date(nextAppointment.time_slot.start_time), 'h:mm a')
                    } • Ref: {nextAppointment.booking_reference}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(nextAppointment.status)}`}>
                  {nextAppointment.status}
                </span>
                <Link
                  href={`/officer/appointments/${nextAppointment.id}`}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Today's Schedule</h2>
          <Link
            href="/officer/schedule"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View full schedule
          </Link>
        </div>
        <div className="p-6">
          {scheduleLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading schedule...</p>
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.time_slot && 
                        format(new Date(appointment.time_slot.start_time), 'HH:mm')
                      }
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.citizen?.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {appointment.service?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.documents?.some(doc => doc.status === 'pending') && (
                      <AlertCircle className="h-4 w-4 text-yellow-500" title="Documents pending review" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">
            Activity feed coming soon...
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OfficerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['officer']}>
      <DashboardLayout>
        <OfficerDashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}