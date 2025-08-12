'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertCircle, FileText, MapPin, Calendar, Phone, Mail } from 'lucide-react'
import { format } from 'date-fns'

interface Issue {
  id: string
  title: string
  category: string
  description: string
  location: string
  status: string
  severity_level: number
  booking_reference: string
  created_at: string
  updated_at: string
  assigned_authority?: string
  estimated_completion?: string
}

interface MyReportsProps {
  userId: string
}

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  under_review: { color: 'bg-blue-100 text-blue-800', icon: FileText, label: 'Under Review' },
  assigned: { color: 'bg-purple-100 text-purple-800', icon: AlertCircle, label: 'Assigned' },
  in_progress: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'In Progress' },
  resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Closed' }
}

const CATEGORY_ICONS = {
  roads: '🛣️',
  electricity: '⚡',
  water: '💧',
  waste: '🗑️',
  safety: '🛡️',
  health: '🏥',
  environment: '🌱',
  infrastructure: '🏢'
}

const SEVERITY_CONFIG = {
  1: { label: 'Low', color: 'bg-green-100 text-green-800' },
  2: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  4: { label: 'Critical', color: 'bg-red-100 text-red-800' }
}

export function MyReports({ userId }: MyReportsProps) {
  const [reports, setReports] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<Issue | null>(null)

  useEffect(() => {
    fetchReports()
  }, [userId])

  const fetchReports = async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/issues/my-reports/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setReports(result.reports)
      } else {
        throw new Error(result.message || 'Failed to load reports')
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError('Failed to load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  }

  const getSeverityInfo = (level: number) => {
    return SEVERITY_CONFIG[level as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG[1]
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading your reports...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchReports}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
        <p className="text-gray-500 mb-4">
          You haven't reported any issues yet. Help improve your community by reporting civic issues.
        </p>
        <a
          href="/dashboard/report-issue"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Report Your First Issue
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
          <div className="text-sm text-gray-600">Total Reports</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-800">
            {reports.filter(r => r.status === 'pending' || r.status === 'under_review').length}
          </div>
          <div className="text-sm text-yellow-700">Under Review</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-800">
            {reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length}
          </div>
          <div className="text-sm text-orange-700">In Progress</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-800">
            {reports.filter(r => r.status === 'resolved').length}
          </div>
          <div className="text-sm text-green-700">Resolved</div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => {
          const statusInfo = getStatusInfo(report.status)
          const severityInfo = getSeverityInfo(report.severity_level)
          const StatusIcon = statusInfo.icon

          return (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{CATEGORY_ICONS[report.category as keyof typeof CATEGORY_ICONS] || '📋'}</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500">Ref: {report.booking_reference}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {report.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3 line-clamp-2">{report.description}</p>

                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityInfo.color}`}>
                      {severityInfo.label} Priority
                    </span>
                    {report.assigned_authority && (
                      <span className="text-xs text-gray-500">
                        Assigned to: {report.assigned_authority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Issue Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setSelectedReport(null)}>
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedReport.title}</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference</label>
                  <p className="text-gray-900">{selectedReport.booking_reference}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900 capitalize flex items-center">
                    <span className="mr-2">{CATEGORY_ICONS[selectedReport.category as keyof typeof CATEGORY_ICONS] || '📋'}</span>
                    {selectedReport.category}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{selectedReport.location}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{selectedReport.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedReport.status).color}`}>
                      {getStatusInfo(selectedReport.status).label}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityInfo(selectedReport.severity_level).color}`}>
                      {getSeverityInfo(selectedReport.severity_level).label}
                    </div>
                  </div>
                </div>

                {selectedReport.assigned_authority && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned Authority</label>
                    <p className="text-gray-900">{selectedReport.assigned_authority}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reported On</label>
                    <p className="text-gray-900">{format(new Date(selectedReport.created_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{format(new Date(selectedReport.updated_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>

                {selectedReport.estimated_completion && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimated Completion</label>
                    <p className="text-gray-900">{selectedReport.estimated_completion}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  <p>• You will receive notifications about status updates</p>
                  <p>• Contact the assigned authority for urgent matters</p>
                  <p>• Track progress updates in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}