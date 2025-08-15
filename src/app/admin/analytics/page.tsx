'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Filter,
  Building
} from 'lucide-react'

interface AnalyticsData {
  totalAppointments: number
  confirmedAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowRate: number
  averageProcessingTime: number
  peakHours: Array<{ hour: number; count: number }>
  departmentStats: Array<{ 
    department: string
    total: number
    completed: number
    pending: number
  }>
  dailyTrends: Array<{
    date: string
    bookings: number
    completions: number
  }>
  topServices: Array<{
    service: string
    count: number
    department: string
  }>
}

export default function AnalyticsPage() {
  const { user } = useAuthContext()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Extend to 90 days
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (user?.profile?.role === 'admin') {
      fetchAnalytics()
    }
  }, [user, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching analytics data...', { dateRange })
      
      // First, let's check what data actually exists
      const { data: allAppointments, error: allError } = await supabase
        .from('appointments')
        .select('id, status, created_at')
        .order('created_at', { ascending: false })
      
      if (allError) {
        console.error('Error fetching appointments:', allError)
        throw new Error(`Database error: ${allError.message}`)
      }
      
      console.log('Total appointments in database:', allAppointments?.length)
      console.log('All appointments data:', allAppointments)
      console.log('Date range filter:', { start: dateRange.start, end: dateRange.end })
      
      // Test direct count query
      const { count, error: countError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
      
      console.log('Direct count query result:', { count, error: countError })
      
      // Now get appointments in date range - extend range to catch more data
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          service_id,
          time_slot_id,
          booking_reference
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      console.log('Appointments in date range:', appointments?.length)
      console.log('Sample appointment:', appointments?.[0])
      
      console.log('Sample appointment dates:', appointments?.slice(0, 3).map(a => a.created_at))
      console.log('Date range being used:', dateRange)
      
      // For now, let's use ALL appointments to ensure we see the data
      // We can add date filtering back once we confirm the data is showing
      const data = appointments || []
      console.log('Using ALL appointments for analytics:', data.length, 'total appointments')
      
      // Show some sample appointment data for debugging
      if (data.length > 0) {
        console.log('Sample appointment statuses:', data.slice(0, 5).map(a => ({ id: a.id, status: a.status, created: a.created_at })))
      }
      
      // Get services and departments for context - simplified query
      const { data: services } = await supabase
        .from('services')
        .select('id, name, department_id')
      
      const { data: departments } = await supabase
        .from('departments')
        .select('id, name')
      
      console.log('Services loaded:', services?.length)
      console.log('Departments loaded:', departments?.length)
      
      const deptMap = new Map(departments?.map(d => [d.id, d.name]) || [])
      const servicesMap = new Map(services?.map(s => ({ 
        id: s.id, 
        name: s.name, 
        departmentName: deptMap.get(s.department_id) || 'Unknown Department'
      })).map(s => [s.id, s]) || [])

      // Calculate basic stats
      const totalAppointments = data.length
      const confirmedAppointments = data.filter(a => a.status === 'confirmed').length
      const completedAppointments = data.filter(a => a.status === 'completed').length
      const cancelledAppointments = data.filter(a => a.status === 'cancelled').length
      const noShows = data.filter(a => a.status === 'no_show').length
      const noShowRate = totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0

      // Calculate average processing time
      const completedWithTimes = data.filter(a => 
        a.status === 'completed' && a.created_at && a.updated_at
      )
      const avgProcessingTime = completedWithTimes.length > 0
        ? completedWithTimes.reduce((acc, a) => {
            const created = new Date(a.created_at).getTime()
            const updated = new Date(a.updated_at).getTime()
            return acc + (updated - created)
          }, 0) / completedWithTimes.length / (1000 * 60 * 60) // Convert to hours
        : 0

      // Peak hours analysis - use created_at since time_slot data may not be available
      const hourCounts = new Array(24).fill(0)
      data.forEach(appointment => {
        // Use created_at as fallback for time analysis
        const timeToUse = appointment.created_at
        if (timeToUse) {
          const hour = new Date(timeToUse).getHours()
          hourCounts[hour]++
        }
      })
      const peakHours = hourCounts.map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Department statistics using the services map
      const departmentStatsMap = new Map()
      data.forEach(appointment => {
        const service = servicesMap.get(appointment.service_id)
        const deptName = service?.departmentName || 'Government Services'
        if (!departmentStatsMap.has(deptName)) {
          departmentStatsMap.set(deptName, { total: 0, completed: 0, pending: 0 })
        }
        const dept = departmentStatsMap.get(deptName)!
        dept.total++
        if (appointment.status === 'completed') dept.completed++
        if (appointment.status === 'pending' || appointment.status === 'confirmed') dept.pending++
      })
      const departmentStats = Array.from(departmentStatsMap.entries()).map(([department, stats]) => ({
        department,
        ...stats
      }))

      // Daily trends (last 7 days)
      const dailyMap = new Map()
      const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      last7Days.forEach(date => {
        dailyMap.set(date, { bookings: 0, completions: 0 })
      })

      data.forEach(appointment => {
        if (appointment.created_at) {
          const date = appointment.created_at.split('T')[0]
          if (dailyMap.has(date)) {
            dailyMap.get(date)!.bookings++
            if (appointment.status === 'completed') {
              dailyMap.get(date)!.completions++
            }
          }
        }
      })

      const dailyTrends = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        ...stats
      }))

      // Top services using the services map
      const serviceStatsMap = new Map()
      data.forEach(appointment => {
        const service = servicesMap.get(appointment.service_id)
        const serviceName = service?.name || 'Government Service'
        const deptName = service?.departmentName || 'Government Department'
        if (!serviceStatsMap.has(serviceName)) {
          serviceStatsMap.set(serviceName, { count: 0, department: deptName })
        }
        serviceStatsMap.get(serviceName)!.count++
      })
      const topServices = Array.from(serviceStatsMap.entries())
        .map(([service, data]) => ({ service, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      console.log('Final analytics result:', {
        totalAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        departmentStats: departmentStats.length,
        topServices: topServices.length
      })

      setAnalytics({
        totalAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowRate: Math.round(noShowRate * 100) / 100,
        averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
        peakHours,
        departmentStats,
        dailyTrends,
        topServices
      })

    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      // Set empty analytics data to show "no data" state instead of loading forever
      setAnalytics({
        totalAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowRate: 0,
        averageProcessingTime: 0,
        peakHours: [],
        departmentStats: [],
        dailyTrends: [],
        topServices: []
      })
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!analytics) return
    
    const csvData = [
      ['Metric', 'Value'],
      ['Total Appointments', analytics.totalAppointments],
      ['Confirmed Appointments', analytics.confirmedAppointments],
      ['Completed Appointments', analytics.completedAppointments],
      ['Cancelled Appointments', analytics.cancelledAppointments],
      ['No Show Rate (%)', analytics.noShowRate],
      ['Average Processing Time (hours)', analytics.averageProcessingTime],
      [''],
      ['Department', 'Total', 'Completed', 'Pending'],
      ...analytics.departmentStats.map(d => [d.department, d.total, d.completed, d.pending])
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sevanet-analytics-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
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
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Government Analytics</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              System Analytics
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Optimize resource allocation with real-time insights on service delivery and citizen engagement
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <button
              onClick={exportData}
              disabled={!analytics}
              className="group inline-flex items-center px-8 py-4 bg-white text-government-dark-blue font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              <Download className="mr-3 h-6 w-6 group-hover:animate-bounce" />
              Export Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-xl mr-3">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Date Range Filter</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-3">
              <label className="text-sm font-bold text-gray-700 min-w-0">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border-2 border-blue-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-bold text-gray-700 min-w-0">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border-2 border-blue-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      ) : analytics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Calendar className="h-10 w-10 text-blue-600" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total Appointments</p>
                  <p className="text-4xl font-black text-gray-900">{analytics.totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-green-100 p-4 rounded-2xl">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Completed</p>
                  <p className="text-4xl font-black text-gray-900">{analytics.completedAppointments}</p>
                  <p className="text-xs text-green-600 font-medium">
                    {analytics.totalAppointments > 0 ? Math.round((analytics.completedAppointments / analytics.totalAppointments) * 100) : 0}% completion rate
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-red-100 p-4 rounded-2xl">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">No Show Rate</p>
                  <p className="text-4xl font-black text-gray-900">{analytics.noShowRate}%</p>
                  <p className="text-xs text-red-600 font-medium">
                    Resource optimization metric
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center">
                <div className="bg-purple-100 p-4 rounded-2xl">
                  <Clock className="h-10 w-10 text-purple-600" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Avg Processing</p>
                  <p className="text-4xl font-black text-gray-900">{analytics.averageProcessingTime}h</p>
                  <p className="text-xs text-purple-600 font-medium">
                    Efficiency indicator
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-orange-100 p-3 rounded-xl mr-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Peak Booking Hours</h3>
                  <p className="text-sm text-gray-600">Busiest appointment times</p>
                </div>
              </div>
              <div className="space-y-4">
                {analytics.peakHours.length > 0 ? analytics.peakHours.map((hour) => (
                  <div key={hour.hour} className="flex items-center hover:bg-gray-50 rounded-xl p-3 transition-colors">
                    <div className="w-16 text-sm font-bold text-gray-700">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="bg-orange-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-6 rounded-full flex items-center justify-end pr-3 transition-all duration-700"
                          style={{
                            width: `${(hour.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%`
                          }}
                        >
                          <span className="text-xs text-white font-bold">{hour.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No peak hours data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Services */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 p-3 rounded-xl mr-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Most Popular Services</h3>
                  <p className="text-sm text-gray-600">Top requested services</p>
                </div>
              </div>
              <div className="space-y-4">
                {analytics.topServices.length > 0 ? analytics.topServices.map((service, index) => (
                  <div key={service.service} className="flex items-center justify-between hover:bg-gray-50 rounded-xl p-3 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white mr-3 ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{service.service}</p>
                        <p className="text-xs text-gray-600">{service.department}</p>
                      </div>
                    </div>
                    <div className="bg-purple-100 px-3 py-1 rounded-full">
                      <span className="text-sm font-bold text-purple-700">{service.count}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">No service data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-3 rounded-xl mr-4">
                <Building className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Department Performance</h3>
                <p className="text-sm text-gray-600">Service delivery by department</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="px-4 py-4 text-left text-sm font-black text-gray-900 uppercase tracking-wide">
                      Department
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-black text-gray-900 uppercase tracking-wide">
                      Total
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-black text-gray-900 uppercase tracking-wide">
                      Completed
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-black text-gray-900 uppercase tracking-wide">
                      Pending
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-black text-gray-900 uppercase tracking-wide">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.departmentStats.length > 0 ? analytics.departmentStats.map((dept, index) => (
                    <tr key={dept.department} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-green-500' : 
                            index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                          }`}></div>
                          <span className="text-sm font-bold text-gray-900">{dept.department}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full inline-block">
                          <span className="text-sm font-bold">{dept.total}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full inline-block">
                          <span className="text-sm font-bold">{dept.completed}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full inline-block">
                          <span className="text-sm font-bold">{dept.pending}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className={`px-3 py-1 rounded-full inline-block ${
                          dept.total > 0 && (dept.completed / dept.total) >= 0.8 
                            ? 'bg-green-100 text-green-700'
                            : dept.total > 0 && (dept.completed / dept.total) >= 0.5
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          <span className="text-sm font-bold">
                            {dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <div className="text-gray-500">
                          <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm">No department performance data available</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7-Day Trends */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-teal-100 p-3 rounded-xl mr-4">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">7-Day Appointment Trends</h3>
                <p className="text-sm text-gray-600">Daily booking and completion patterns</p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-8 mb-8">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full mr-3 shadow-sm"></div>
                <span className="text-sm font-bold text-gray-700">New Bookings</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded-full mr-3 shadow-sm"></div>
                <span className="text-sm font-bold text-gray-700">Completed Services</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between h-64 border-b-2 border-l-2 border-gray-300 pl-4 pb-4">
              {analytics.dailyTrends.map((day) => {
                const maxValue = Math.max(...analytics.dailyTrends.map(d => Math.max(d.bookings, d.completions)), 1)
                const bookingsHeight = (day.bookings / maxValue) * 200
                const completionsHeight = (day.completions / maxValue) * 200
                
                return (
                  <div key={day.date} className="flex-1 flex items-end justify-center space-x-2">
                    {/* Bookings Bar */}
                    <div className="relative group">
                      <div 
                        className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg shadow-lg transition-all duration-300 hover:shadow-xl"
                        style={{ height: `${bookingsHeight}px` }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.bookings}
                      </div>
                    </div>
                    
                    {/* Completions Bar */}
                    <div className="relative group">
                      <div 
                        className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg shadow-lg transition-all duration-300 hover:shadow-xl"
                        style={{ height: `${completionsHeight}px` }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.completions}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex items-center justify-between mt-4 ml-4">
              {analytics.dailyTrends.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <div className="text-sm font-bold text-gray-700">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(day.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Data Available</h3>
          <p className="text-gray-600">No appointments found for the selected date range.</p>
        </div>
      )}
    </div>
  )
}