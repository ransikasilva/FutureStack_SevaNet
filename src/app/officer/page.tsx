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
  Eye,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

function OfficerDashboardContent() {
  const { user } = useAuthContext()
  const departmentId = user?.profile?.department_id || ''

  console.log('Officer Dashboard - User:', user)
  console.log('Officer Dashboard - User Role:', user?.profile?.role)
  console.log('Officer Dashboard - Department ID:', departmentId)

  // Only fetch data if user exists and has valid department
  const { appointments, loading: appointmentsLoading } = useOfficerAppointments(
    departmentId && user ? departmentId : ''
  )
  const { stats, loading: statsLoading } = useDepartmentStats(
    departmentId && user ? departmentId : ''
  )
  const { schedule, loading: scheduleLoading } = useTodaysSchedule(
    departmentId && user ? departmentId : ''
  )

  const todaysAppointments = schedule.length
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending').length
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
    <div className="space-y-10">
      {/* Professional Officer Welcome Section */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Officer Dashboard</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Welcome back, 
              <br />
              <span className="text-government-gold">Officer {user?.profile?.full_name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              {departmentId ? 'Managing Government Services Department' : 'No Department Assigned'} • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-xl">
              <div className="text-4xl">🏛️</div>
            </div>
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
                <div className="text-3xl font-black text-gray-900">
                  {scheduleLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    todaysAppointments
                  )}
                </div>
                <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Today</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Today's Appointments</h3>
            <p className="text-sm text-gray-600 mt-1">Scheduled for today</p>
          </div>
        </div>

        <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">
                  {appointmentsLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    pendingReviews
                  )}
                </div>
                <div className="text-xs text-amber-600 font-bold uppercase tracking-wide">Pending</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">Pending Reviews</h3>
            <p className="text-sm text-gray-600 mt-1">Documents to review</p>
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
                <div className="text-3xl font-black text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    stats.confirmed_appointments
                  )}
                </div>
                <div className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Confirmed</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Confirmed Today</h3>
            <p className="text-sm text-gray-600 mt-1">Ready for service</p>
          </div>
        </div>

        <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">
                  {statsLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    stats.total_appointments
                  )}
                </div>
                <div className="text-xs text-purple-600 font-bold uppercase tracking-wide">Total</div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Total Appointments</h3>
            <p className="text-sm text-gray-600 mt-1">All time department total</p>
          </div>
        </div>
      </div>

      {/* Premium Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
        <Link
          href="/officer/appointments"
          className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-blue-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
              <Calendar className="h-10 w-10 text-white group-hover:animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
              Manage Appointments
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              Review and manage citizen appointment requests. Approve bookings, update statuses, and communicate with applicants through our integrated system.
            </p>
            <div className="mt-6 flex items-center text-blue-600 font-bold group-hover:text-blue-800 transition-colors">
              <span>{appointmentsLoading ? 'Loading...' : `${pendingAppointments} Pending`}</span>
              <AlertCircle className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <Link
          href="/officer/documents"
          className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-amber-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
              <FileText className="h-10 w-10 text-white group-hover:animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-amber-700 transition-colors">
              Document Review
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              Review and approve citizen-submitted documents. Verify authenticity, check completeness, and provide feedback for faster processing.
            </p>
            <div className="mt-6 flex items-center text-amber-600 font-bold group-hover:text-amber-800 transition-colors">
              <span>{pendingReviews} Reviews Needed</span>
              <AlertCircle className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <Link
          href="/officer/schedule"
          className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-emerald-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
              <Clock className="h-10 w-10 text-white group-hover:animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
              Daily Schedule
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              View your daily appointment calendar, manage time slots, and track your departmental workload with real-time updates.
            </p>
            <div className="mt-6 flex items-center text-emerald-600 font-bold group-hover:text-emerald-800 transition-colors">
              <span>{todaysAppointments} Today</span>
              <AlertCircle className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <Link
          href="/officer/issues"
          className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-orange-50/30 to-red-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
              <AlertTriangle className="h-10 w-10 text-white group-hover:animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-red-700 transition-colors">
              Civic Issues
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              Review and manage reported civic issues from citizens. Update statuses, assign resources, and coordinate with relevant authorities.
            </p>
            <div className="mt-6 flex items-center text-red-600 font-bold group-hover:text-red-800 transition-colors">
              <span>New Issue Reports</span>
              <AlertCircle className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </Link>

        <div className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 border border-white/20 overflow-hidden opacity-75">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-slate-50/30 to-gray-50/50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl mb-8 shadow-xl">
              <TrendingUp className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-600 mb-4">
              Analytics Dashboard
            </h3>
            <p className="text-gray-500 leading-relaxed text-lg">
              View department performance metrics, citizen satisfaction scores, and operational insights.
            </p>
            <div className="mt-6 flex items-center text-gray-500 font-bold">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20"></div>
          
          <div className="relative px-10 py-8 border-b border-blue-100/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-xl mr-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-blue-600 text-sm font-bold uppercase tracking-wide">Next Service</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Upcoming Appointment</h2>
                <p className="text-lg text-gray-600">Your next scheduled citizen service</p>
              </div>
            </div>
          </div>
          
          <div className="relative p-10">
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-blue-100 hover:border-blue-300 hover:shadow-xl hover:scale-102 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-3xl"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                      {nextAppointment.citizen?.full_name}
                    </h4>
                    <p className="text-lg text-gray-600 mb-1 font-medium">
                      {nextAppointment.service?.name}
                    </p>
                    <p className="text-lg text-gray-600 mb-1 font-medium">
                      {nextAppointment.time_slot && 
                        format(new Date(nextAppointment.time_slot.start_time), 'EEEE, MMMM d, yyyy at h:mm a')
                      }
                    </p>
                    <p className="text-sm text-blue-600 font-bold">
                      Reference: {nextAppointment.booking_reference}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold ${getStatusColor(nextAppointment.status)} shadow-md`}>
                    {nextAppointment.status.charAt(0).toUpperCase() + nextAppointment.status.slice(1)}
                  </span>
                  <Link
                    href={`/officer/appointments`}
                    className="group/link inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-government-dark-blue hover:from-blue-100 hover:to-indigo-100 font-bold rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                  >
                    View Details
                    <Eye className="ml-2 h-5 w-5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Today's Schedule Section */}
      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20"></div>
        
        <div className="relative px-10 py-8 border-b border-blue-100/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-2 rounded-xl mr-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-blue-600 text-sm font-bold uppercase tracking-wide">Daily Schedule</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Today's Appointments</h2>
              <p className="text-lg text-gray-600">Your scheduled citizen services for today</p>
            </div>
            <Link
              href="/officer/schedule"
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-government-dark-blue hover:from-blue-100 hover:to-indigo-100 font-bold rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105"
            >
              View Full Calendar
              <AlertCircle className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="relative p-10">
          {scheduleLoading ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-government-dark-blue border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Your Schedule</h3>
              <p className="text-gray-600">Fetching today's appointments...</p>
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-16 w-16 text-blue-400" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Clear Schedule Today</h3>
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                You don't have any appointments scheduled for today. Enjoy your light workload!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.slice(0, 5).map((appointment, index) => (
                <div
                  key={appointment.id}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-2xl"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-government-gold to-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-1 inline-block">
                          {appointment.time_slot && 
                            format(new Date(appointment.time_slot.start_time), 'h:mm a')
                          }
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                          {appointment.citizen?.full_name}
                        </h4>
                        <p className="text-sm text-gray-600 font-medium">
                          {appointment.service?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      {appointment.documents?.some(doc => doc.status === 'pending') && (
                        <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs font-bold">Docs</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {schedule.length > 5 && (
                <div className="pt-8 text-center border-t border-blue-100">
                  <Link
                    href="/officer/schedule"
                    className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-50 to-blue-50 text-government-dark-blue hover:from-blue-50 hover:to-indigo-50 font-bold rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                  >
                    View All {schedule.length} Appointments
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

export default function OfficerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['officer']}>
      <OfficerDashboardContent />
    </ProtectedRoute>
  )
}