'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useUserAppointments } from '@/hooks/useAppointments'
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react'
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage your government services and appointments in one place
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/book"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-government-dark-blue hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-dark-blue"
            >
              <Plus className="mr-2 h-5 w-5" />
              Book Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/book"
          className="group bg-white border border-gray-200 rounded-xl p-8 hover:border-government-dark-blue hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors mb-6">
            <Plus className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-government-dark-blue transition-colors">
            Book New Appointment
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Schedule appointments for various government services including passport, license, and certificate applications.
          </p>
        </Link>

        <Link
          href="/dashboard/appointments"
          className="group bg-white border border-gray-200 rounded-xl p-8 hover:border-government-dark-blue hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors mb-6">
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-government-dark-blue transition-colors">
            My Appointments
          </h3>
          <p className="text-gray-600 leading-relaxed">
            View and manage all your scheduled appointments. Track status, reschedule, or cancel existing bookings.
          </p>
        </Link>

        <Link
          href="/dashboard/documents"
          className="group bg-white border border-gray-200 rounded-xl p-8 hover:border-government-dark-blue hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors mb-6">
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-government-dark-blue transition-colors">
            Document Wallet
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Securely store and manage your documents. Upload required files for faster appointment processing.
          </p>
        </Link>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Appointments</h2>
              <p className="text-gray-600 mt-1">Your next scheduled government services</p>
            </div>
            <Link
              href="/dashboard/appointments"
              className="inline-flex items-center text-government-dark-blue hover:text-blue-800 font-medium"
            >
              View all appointments
              <AlertCircle className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your appointments...</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming appointments</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You don't have any scheduled appointments. Book your first appointment to get started with government services.
              </p>
              <Link
                href="/dashboard/book"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-government-dark-blue hover:bg-blue-800 transition-colors"
              >
                <Plus className="mr-2 h-5 w-5" />
                Book Your First Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:border-government-dark-blue hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center space-x-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {appointment.service?.name}
                      </h4>
                      <p className="text-gray-600 mt-1">
                        {appointment.time_slot && 
                          format(new Date(appointment.time_slot.start_time), 'EEEE, MMMM d, yyyy at h:mm a')
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Reference: {appointment.booking_reference}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    <Link
                      href={`/dashboard/appointments`}
                      className="text-government-dark-blue hover:text-blue-800 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
              
              {upcomingAppointments.length > 0 && (
                <div className="pt-6 text-center border-t border-gray-200">
                  <Link
                    href="/dashboard/appointments"
                    className="inline-flex items-center text-government-dark-blue hover:text-blue-800 font-medium"
                  >
                    View all {appointments.length} appointments
                    <AlertCircle className="ml-2 h-4 w-4" />
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

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}