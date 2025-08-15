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
    <div className="space-y-10">
      {/* Professional Header Section */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Government Services Portal</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Welcome back,
              <br />
              <span className="text-government-gold">{user?.profile?.full_name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Manage your government services and appointments through our secure, citizen-first digital platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/dashboard/book"
              className="group inline-flex items-center justify-center px-8 py-4 bg-white text-government-dark-blue font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-3 h-6 w-6 group-hover:animate-pulse" />
              Book Appointment
            </Link>
            <Link
              href="/dashboard/appointments"
              className="group inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-bold text-lg rounded-2xl hover:bg-white hover:text-government-dark-blue transition-all duration-300"
            >
              <Calendar className="mr-3 h-6 w-6" />
              My Appointments
            </Link>
          </div>
        </div>
      </div>

      {/* Professional Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{stats.total}</div>
                <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Total</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Total Appointments</h3>
            <p className="text-sm text-gray-600 mt-1">All your scheduled services</p>
          </div>
        </div>

        <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{stats.pending}</div>
                <div className="text-xs text-amber-600 font-bold uppercase tracking-wide">Pending</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">Pending Review</h3>
            <p className="text-sm text-gray-600 mt-1">Awaiting confirmation</p>
          </div>
        </div>

        <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/30 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl shadow-lg">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{stats.confirmed}</div>
                <div className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Confirmed</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Confirmed</h3>
            <p className="text-sm text-gray-600 mt-1">Ready for your visit</p>
          </div>
        </div>

        <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{stats.completed}</div>
                <div className="text-xs text-purple-600 font-bold uppercase tracking-wide">Complete</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Completed</h3>
            <p className="text-sm text-gray-600 mt-1">Successfully processed</p>
          </div>
        </div>
      </div>

      {/* Premium Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Link
          href="/dashboard/book"
          className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-blue-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
              <Plus className="h-10 w-10 text-white group-hover:animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
              Book New Appointment
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              Schedule appointments for various government services including passport, license, and certificate applications through our streamlined booking system.
            </p>
            <div className="mt-6 flex items-center text-blue-600 font-bold group-hover:text-blue-800 transition-colors">
              <span>Get Started</span>
              <AlertCircle className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/appointments"
          className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-emerald-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
              <Calendar className="h-10 w-10 text-white group-hover:animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
              My Appointments
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              View and manage all your scheduled appointments. Track status, reschedule, or cancel existing bookings with real-time updates.
            </p>
            <div className="mt-6 flex items-center text-emerald-600 font-bold group-hover:text-emerald-800 transition-colors">
              <span>View All</span>
              <AlertCircle className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/documents"
          className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-purple-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
              <FileText className="h-10 w-10 text-white group-hover:animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-purple-700 transition-colors">
              Document Wallet
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              Securely store and manage your documents. Upload required files for faster appointment processing with encrypted storage.
            </p>
            <div className="mt-6 flex items-center text-purple-600 font-bold group-hover:text-purple-800 transition-colors">
              <span>Manage Files</span>
              <AlertCircle className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Professional Upcoming Appointments Section */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20"></div>
        
        <div className="relative px-10 py-8 border-b border-blue-100/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-2 rounded-xl mr-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-blue-600 text-sm font-bold uppercase tracking-wide">Scheduled Services</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Upcoming Appointments</h2>
              <p className="text-lg text-gray-600">Your next scheduled government services and meetings</p>
            </div>
            <Link
              href="/dashboard/appointments"
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-government-dark-blue hover:from-blue-100 hover:to-indigo-100 font-bold rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105"
            >
              View All Appointments
              <AlertCircle className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="relative p-10">
          {loading ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-government-dark-blue border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Your Schedule</h3>
              <p className="text-gray-600">Fetching your upcoming appointments...</p>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-16 w-16 text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-government-gold to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Ready to Get Started?</h3>
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                You don't have any scheduled appointments yet. Book your first government service appointment to experience our streamlined process.
              </p>
              <Link
                href="/dashboard/book"
                className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-government-dark-blue to-blue-700 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Plus className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                Book Your First Appointment
                <AlertCircle className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingAppointments.map((appointment, index) => (
                <div
                  key={appointment.id}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-blue-100 hover:border-blue-300 hover:shadow-xl hover:scale-102 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-3xl"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-government-gold to-yellow-500 rounded-full flex items-center justify-center text-xs font-black text-white">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                          {appointment.service?.name}
                        </h4>
                        <p className="text-lg text-gray-600 mb-1 font-medium">
                          {appointment.time_slot && 
                            format(new Date(appointment.time_slot.start_time), 'EEEE, MMMM d, yyyy at h:mm a')
                          }
                        </p>
                        <p className="text-sm text-blue-600 font-bold">
                          Reference: {appointment.booking_reference}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(appointment.status)} shadow-md`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      <Link
                        href={`/dashboard/appointments`}
                        className="group/link inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-government-dark-blue hover:from-blue-100 hover:to-indigo-100 font-bold rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                      >
                        View Details
                        <AlertCircle className="ml-2 h-5 w-5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {upcomingAppointments.length > 0 && (
                <div className="pt-8 text-center border-t border-blue-100">
                  <Link
                    href="/dashboard/appointments"
                    className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-50 to-blue-50 text-government-dark-blue hover:from-blue-50 hover:to-indigo-50 font-bold rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                  >
                    View All {appointments.length} Appointments
                    <AlertCircle className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
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