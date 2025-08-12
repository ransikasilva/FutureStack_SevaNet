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
  Filter
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
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (user?.profile?.role === 'admin') {
      fetchAnalytics()
    }
  }, [user, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Get all appointments in date range
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services (
            name,
            department:departments (name)
          ),
          time_slot:time_slots (start_time, end_time)
        `)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end + 'T23:59:59')

      if (error) throw error

      const data = appointments || []

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

      // Peak hours analysis
      const hourCounts = new Array(24).fill(0)
      data.forEach(appointment => {
        if (appointment.time_slot?.start_time) {
          const hour = new Date(appointment.time_slot.start_time).getHours()
          hourCounts[hour]++
        }
      })
      const peakHours = hourCounts.map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Department statistics
      const deptMap = new Map()
      data.forEach(appointment => {
        const deptName = appointment.service?.department?.name || 'Unknown'
        if (!deptMap.has(deptName)) {
          deptMap.set(deptName, { total: 0, completed: 0, pending: 0 })
        }
        const dept = deptMap.get(deptName)
        dept.total++
        if (appointment.status === 'completed') dept.completed++
        if (appointment.status === 'pending' || appointment.status === 'confirmed') dept.pending++
      })
      const departmentStats = Array.from(deptMap.entries()).map(([department, stats]) => ({
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
        const date = appointment.created_at.split('T')[0]
        if (dailyMap.has(date)) {
          dailyMap.get(date).bookings++
          if (appointment.status === 'completed') {
            dailyMap.get(date).completions++
          }
        }
      })

      const dailyTrends = Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        ...stats
      }))

      // Top services
      const serviceMap = new Map()
      data.forEach(appointment => {
        const serviceName = appointment.service?.name || 'Unknown'
        const deptName = appointment.service?.department?.name || 'Unknown'
        if (!serviceMap.has(serviceName)) {
          serviceMap.set(serviceName, { count: 0, department: deptName })
        }
        serviceMap.get(serviceName).count++
      })
      const topServices = Array.from(serviceMap.entries())
        .map(([service, data]) => ({ service, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">System performance and usage statistics</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportData}
            disabled={!analytics}
            className="btn-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
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
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completedAppointments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">No Show Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.noShowRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageProcessingTime}h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Booking Hours</h3>
              <div className="space-y-3">
                {analytics.peakHours.map((hour) => (
                  <div key={hour.hour} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">
                      {hour.hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-primary-500 h-6 rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(hour.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%`
                          }}
                        >
                          <span className="text-xs text-white font-medium">{hour.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Services */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Services</h3>
              <div className="space-y-3">
                {analytics.topServices.map((service, index) => (
                  <div key={service.service} className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{service.service}</p>
                      <p className="text-xs text-gray-500">{service.department}</p>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">{service.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.departmentStats.map((dept) => (
                    <tr key={dept.department}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dept.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dept.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dept.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dept.pending}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Trends</h3>
            <div className="space-y-3">
              {analytics.dailyTrends.map((day) => (
                <div key={day.date} className="flex items-center">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 ml-4">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Bookings: {day.bookings}</div>
                        <div className="bg-blue-100 rounded h-4">
                          <div
                            className="bg-blue-500 h-4 rounded"
                            style={{
                              width: `${(day.bookings / Math.max(...analytics.dailyTrends.map(d => d.bookings))) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Completions: {day.completions}</div>
                        <div className="bg-green-100 rounded h-4">
                          <div
                            className="bg-green-500 h-4 rounded"
                            style={{
                              width: `${(day.completions / Math.max(...analytics.dailyTrends.map(d => d.completions))) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
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