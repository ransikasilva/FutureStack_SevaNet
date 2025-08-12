'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUserAppointments } from '@/hooks/useAppointments'
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Plus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

function DashboardContent() {
  const { user } = useAuthContext()
  const { appointments, loading } = useUserAppointments(user?.profile?.id || '')

  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'confirmed' || apt.status === 'pending'
  ).slice(0, 3)

  const recentAppointments = appointments.slice(0, 5)

  const stats = {
    total: appointments.length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
  }

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm">
        <div className="px-6 py-8 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.profile?.full_name || 'User'}!
          </h1>
          <p className="text-primary-100">
            Manage your government service appointments efficiently
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Appointments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total}
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
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.pending}
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
                    Confirmed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.confirmed}
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
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completed}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/book"
              className="relative group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                <Plus className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 text-center">
                Book New Appointment
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Schedule your next government service
              </p>
            </Link>

            <Link
              href="/dashboard/appointments"
              className="relative group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 text-center">
                View All Appointments
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Manage your scheduled appointments
              </p>
            </Link>

            <Link
              href="/dashboard/documents"
              className="relative group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 text-center">
                Manage Documents
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Upload and organize documents
              </p>
            </Link>

            <Link
              href="/dashboard/report-issue"
              className="relative group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-red-400 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 text-center">
                Report Issue
              </h3>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Report civic issues to authorities
              </p>
            </Link>
          </div>

          {/* Issue Reports Section */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/my-reports"
              className="relative group bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-red-400 transition-colors"
            >
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <FileText className="h-4 w-4 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">My Reports</h3>
                  <p className="text-xs text-gray-500">Track your reported issues</p>
                </div>
              </div>
            </Link>

            <div className="relative bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-500">AI Analysis</h3>
                  <p className="text-xs text-gray-400">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
          <Link
            href="/dashboard/appointments"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            View all
          </Link>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading appointments...</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming appointments</p>
              <Link
                href="/dashboard/book"
                className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
              >
                Book your first appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {appointment.service?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {appointment.time_slot && 
                          format(new Date(appointment.time_slot.start_time), 'MMM d, yyyy at h:mm a')
                        }
                      </p>
                      <p className="text-xs text-gray-400">
                        Ref: {appointment.booking_reference}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}