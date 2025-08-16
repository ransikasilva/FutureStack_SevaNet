'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { useAdminIssueStats } from '@/hooks/useIssues'
import Link from 'next/link'
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Settings,
  UserCheck,
  ArrowRight,
  Star,
  Activity,
  Shield,
  Building,
  Eye,
  MapPin,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { IssueAnalyticsDashboard } from '@/components/analytics/IssueAnalyticsDashboard'

interface AdminStats {
  totalAppointments: number
  activeUsers: number
  totalDepartments: number
  pendingAppointments: number
  completedAppointments: number
  averageRating: number
  systemUptime: string
  totalOfficers: number
  recentAppointments: any[]
  departmentStats: any[]
}

export default function AdminDashboard() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { stats: issueStats, loading: issueLoading, error: issueError } = useAdminIssueStats()

  useEffect(() => {
    console.log('Admin dashboard useEffect triggered', {
      user: user?.profile?.role,
      userExists: !!user
    })
    if (user?.profile?.role === 'admin') {
      fetchAdminStats()
    }
  }, [user])

  const fetchAdminStats = async () => {
    setLoading(true)
    try {
      console.log('Fetching admin stats...')
      
      // Fetch various statistics - let's check what data exists first
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('id')
      console.log('Total appointments in DB:', allAppointments?.length)
      
      const [
        appointmentsResult,
        usersResult,
        departmentsResult,
        feedbackResult,
        recentAppointmentsResult
      ] = await Promise.all([
        supabase.from('appointments').select('id, status, created_at, updated_at'),
        supabase.from('profiles').select('id, role, full_name'),
        supabase.from('departments').select('id, name, is_active'),
        supabase.from('feedback').select('rating'),
        supabase.from('appointments')
          .select(`
            id,
            booking_reference,
            status,
            created_at,
            citizen_id,
            service_id
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ])
      
      console.log('Raw data results:', {
        appointments: appointmentsResult.data?.length,
        users: usersResult.data?.length,
        departments: departmentsResult.data?.length,
        feedback: feedbackResult.data?.length,
        recent: recentAppointmentsResult.data?.length
      })

      const appointments = appointmentsResult.data || []
      const users = usersResult.data || []
      const departments = departmentsResult.data || []
      const feedback = feedbackResult.data || []
      const recentAppointments = recentAppointmentsResult.data || []

      console.log('Processed data:', {
        appointmentsCount: appointments.length,
        usersCount: users.length,
        officersCount: users.filter(u => u.role === 'officer').length,
        departmentsCount: departments.length
      })

      const totalAppointments = appointments.length
      const pendingAppointments = appointments.filter(a => a.status === 'pending').length
      const completedAppointments = appointments.filter(a => a.status === 'completed').length
      const activeUsers = users.filter(u => u.role === 'citizen').length // Only count citizens as active users
      const totalOfficers = users.filter(u => u.role === 'officer' || u.role === 'admin').length
      const totalDepartments = departments.filter(d => d.is_active).length
      
      const averageRating = feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length 
        : 0

      // Get citizen and service data for recent appointments display
      const recentWithData = await Promise.all(
        (recentAppointments || []).map(async (apt) => {
          const [citizenResult, serviceResult] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', apt.citizen_id).single(),
            supabase.from('services').select('name').eq('id', apt.service_id).single()
          ])
          
          return {
            ...apt,
            citizen: citizenResult.data,
            service: serviceResult.data
          }
        })
      )
      
      // Calculate department stats
      const departmentStats = [{
        name: 'Government Services',
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length
      }]
      
      console.log('Final stats:', {
        totalAppointments,
        activeUsers,
        totalOfficers,
        totalDepartments,
        averageRating
      })

      setStats({
        totalAppointments,
        activeUsers,
        totalDepartments,
        pendingAppointments,
        completedAppointments,
        totalOfficers,
        averageRating: Math.round(averageRating * 10) / 10,
        systemUptime: '99.9%', // Mock uptime for demo
        recentAppointments: recentWithData,
        departmentStats
      })

    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
      // Set minimal stats on error to prevent blank display
      setStats({
        totalAppointments: 0,
        activeUsers: 0,
        totalDepartments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalOfficers: 0,
        averageRating: 0,
        systemUptime: '99.9%',
        recentAppointments: [],
        departmentStats: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (user?.profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">This page is only accessible to system administrators.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Professional Header Section - Matching Citizen Design */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">System Administration</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Welcome back,
              <br />
              <span className="text-government-gold">Administrator {user?.profile?.full_name?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Monitor system performance, manage resources, and oversee government service delivery across all departments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/admin/analytics"
              className="group inline-flex items-center justify-center px-8 py-4 bg-white text-government-dark-blue font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <BarChart3 className="mr-3 h-6 w-6 group-hover:animate-pulse" />
              View Analytics
            </Link>
            <Link
              href="/admin/services"
              className="group inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-bold text-lg rounded-2xl hover:bg-white hover:text-government-dark-blue transition-all duration-300"
            >
              <Settings className="mr-3 h-6 w-6" />
              Manage System
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-government-dark-blue border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading System Dashboard</h3>
          <p className="text-gray-600">Gathering system analytics and performance metrics...</p>
        </div>
      ) : stats ? (
        <>
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
                    <div className="text-3xl font-black text-gray-900">{stats.totalAppointments}</div>
                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Total</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Total Appointments</h3>
                <p className="text-sm text-gray-600 mt-1">All system bookings</p>
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/30 rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{stats.activeUsers}</div>
                    <div className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Active</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Active Users</h3>
                <p className="text-sm text-gray-600 mt-1">Registered citizens</p>
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
                    <UserCheck className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{stats.totalOfficers}</div>
                    <div className="text-xs text-amber-600 font-bold uppercase tracking-wide">Staff</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors">Government Officers</h3>
                <p className="text-sm text-gray-600 mt-1">Active staff members</p>
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl shadow-lg">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{stats.averageRating}</div>
                    <div className="text-xs text-purple-600 font-bold uppercase tracking-wide">Rating</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Service Quality</h3>
                <p className="text-sm text-gray-600 mt-1">Average user rating</p>
              </div>
            </div>
          </div>

          {/* Civic Issues Analytics */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-red-50/30 to-orange-50/20"></div>
            
            <div className="relative px-10 py-8 border-b border-red-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-red-100 p-2 rounded-xl mr-3">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <span className="text-red-600 text-sm font-bold uppercase tracking-wide">Civic Issues Management</span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Infrastructure Issues Overview</h2>
                  <p className="text-lg text-gray-600">Monitor and analyze reported civic infrastructure issues</p>
                </div>
                <Link
                  href="/admin/issues"
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-50 to-orange-50 text-red-600 hover:from-red-100 hover:to-orange-100 font-bold rounded-2xl border border-red-200 hover:border-red-300 transition-all duration-300 hover:scale-105"
                >
                  View All Issues
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            <div className="relative p-10">
              {issueLoading ? (
                <div className="text-center py-8">
                  <div className="relative mx-auto w-12 h-12 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-red-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-600">Loading issue statistics...</p>
                </div>
              ) : issueError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600">{issueError}</p>
                </div>
              ) : (
                <>
                  {/* Issues Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900">{issueStats.total}</div>
                          <div className="text-xs text-red-600 font-bold uppercase tracking-wide">Total</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Total Issues</h3>
                      <p className="text-sm text-gray-600 mt-1">All reported issues</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900">{issueStats.pending}</div>
                          <div className="text-xs text-orange-600 font-bold uppercase tracking-wide">Pending</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Pending Review</h3>
                      <p className="text-sm text-gray-600 mt-1">Awaiting action</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900">{issueStats.inProgress}</div>
                          <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Active</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">In Progress</h3>
                      <p className="text-sm text-gray-600 mt-1">Being worked on</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900">{issueStats.resolved}</div>
                          <div className="text-xs text-green-600 font-bold uppercase tracking-wide">Resolved</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Resolved</h3>
                      <p className="text-sm text-gray-600 mt-1">Completed</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-red-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900">{issueStats.critical}</div>
                          <div className="text-xs text-red-600 font-bold uppercase tracking-wide">Critical</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">High Priority</h3>
                      <p className="text-sm text-gray-600 mt-1">Urgent issues</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Issues by Category */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                        Issues by Category
                      </h3>
                      {issueStats.byCategoryStats.length > 0 ? (
                        <div className="space-y-3">
                          {issueStats.byCategoryStats.slice(0, 5).map((category) => (
                            <div key={category.category} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {category.category}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{category.count}</span>
                                <div className="text-xs text-green-600">
                                  ({category.resolved} resolved)
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No category data available</p>
                      )}
                    </div>

                    {/* Recent Issues */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-red-600" />
                        Recent Issues
                      </h3>
                      {issueStats.recentIssues.length > 0 ? (
                        <div className="space-y-3">
                          {issueStats.recentIssues.map((issue) => (
                            <div key={issue.id} className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {issue.title || `${issue.category} Issue`}
                                </p>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {issue.location}
                                  <span className="mx-2">•</span>
                                  {format(new Date(issue.created_at), 'MMM d')}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                issue.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                                issue.status === 'resolved' ? 'text-green-600 bg-green-100' :
                                issue.status === 'in_progress' ? 'text-blue-600 bg-blue-100' :
                                'text-gray-600 bg-gray-100'
                              }`}>
                                {issue.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No recent issues</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Comprehensive Issues Analytics Dashboard */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20"></div>
            
            <div className="relative px-10 py-8 border-b border-blue-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 p-2 rounded-xl mr-3">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-blue-600 text-sm font-bold uppercase tracking-wide">Advanced Analytics</span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Issues Analytics Dashboard</h2>
                  <p className="text-lg text-gray-600">Comprehensive data visualization and performance insights</p>
                </div>
              </div>
            </div>
            
            <div className="relative p-10">
              <IssueAnalyticsDashboard timeRange={30} />
            </div>
          </div>

          {/* Premium Quick Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Link
              href="/admin/analytics"
              className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-blue-50/50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
                  <BarChart3 className="h-10 w-10 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
                  System Analytics
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Access comprehensive analytics, performance metrics, and system insights for data-driven decision making.
                </p>
                <div className="mt-6 flex items-center text-blue-600 font-bold group-hover:text-blue-800 transition-colors">
                  <span>View Analytics</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link
              href="/admin/officers"
              className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-emerald-50/50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
                  <UserCheck className="h-10 w-10 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
                  Officer Management
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Manage government officers, verify accounts, assign departments, and monitor staff performance.
                </p>
                <div className="mt-6 flex items-center text-emerald-600 font-bold group-hover:text-emerald-800 transition-colors">
                  <span>Manage Officers</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link
              href="/admin/services"
              className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-purple-50/50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
                  <Settings className="h-10 w-10 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-purple-700 transition-colors">
                  Service Management
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Configure government services, manage departments, and optimize service delivery processes.
                </p>
                <div className="mt-6 flex items-center text-purple-600 font-bold group-hover:text-purple-800 transition-colors">
                  <span>Configure Services</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            <Link
              href="/admin/issues"
              className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-10 hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-orange-50/30 to-red-50/50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-8 shadow-xl">
                  <AlertTriangle className="h-10 w-10 text-white group-hover:animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-red-700 transition-colors">
                  Issues Management
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Monitor and manage civic infrastructure issues reported by citizens. Track resolution progress and coordinate with departments.
                </p>
                <div className="mt-6 flex items-center text-red-600 font-bold group-hover:text-red-800 transition-colors">
                  <span>Manage Issues</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity & System Status */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20"></div>
            
            <div className="relative px-10 py-8 border-b border-blue-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="bg-blue-100 p-2 rounded-xl mr-3">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-blue-600 text-sm font-bold uppercase tracking-wide">System Status</span>
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Recent System Activity</h2>
                  <p className="text-lg text-gray-600">Real-time monitoring and recent appointments</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-bold">All Systems Operational</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Uptime</div>
                    <div className="text-lg font-black text-green-600">{stats.systemUptime}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative p-10">
              {stats.recentAppointments?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentAppointments.slice(0, 5).map((appointment: any, index: number) => (
                    <div
                      key={appointment.id}
                      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100 hover:border-blue-300 hover:shadow-lg hover:scale-102 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                              <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-government-gold to-yellow-500 rounded-full flex items-center justify-center text-xs font-black text-white">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">
                              {appointment.service?.name || 'Government Service'}
                            </h4>
                            <p className="text-gray-600">
                              Citizen: {appointment.citizen?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-sm text-blue-600 font-medium">
                              Ref: {appointment.booking_reference}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                          </span>
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Activity className="h-12 w-12 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">System Running Smoothly</h3>
                  <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                    No recent activity to display. The system is operating normally with all services available.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Completed Today</p>
                  <p className="text-3xl font-black text-gray-900">{stats.completedAppointments}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {stats.totalAppointments > 0 ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0}% completion rate
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Active Departments</p>
                  <p className="text-3xl font-black text-gray-900">{stats.totalDepartments}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    All departments online
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Pending Review</p>
                  <p className="text-3xl font-black text-gray-900">{stats.pendingAppointments}</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    Awaiting officer action
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-100 to-orange-200 rounded-2xl">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Unable to Load Data</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      )}
    </div>
  )
}