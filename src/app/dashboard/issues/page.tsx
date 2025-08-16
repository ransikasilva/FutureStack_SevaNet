'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useUserIssues, getIssueStatus } from '@/hooks/useIssues'
import { IssueReportForm } from '@/components/issues/IssueReportForm'
import { 
  AlertTriangle, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Loader2,
  Phone,
  Mail,
  Building,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'

function IssuesContent() {
  const { user } = useAuthContext()
  const { issues, loading, error, refetch } = useUserIssues(user?.id)
  const [showReportForm, setShowReportForm] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [issueStatus, setIssueStatus] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'under_review': return 'text-blue-600 bg-blue-100'
      case 'assigned': return 'text-purple-600 bg-purple-100'
      case 'in_progress': return 'text-orange-600 bg-orange-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600 bg-green-100'
      case 2: return 'text-yellow-600 bg-yellow-100'
      case 3: return 'text-orange-600 bg-orange-100'
      case 4: return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityLabel = (level: number) => {
    switch (level) {
      case 1: return 'Low'
      case 2: return 'Medium'
      case 3: return 'High'
      case 4: return 'Critical'
      default: return 'Unknown'
    }
  }

  const handleViewDetails = async (issue: any) => {
    setSelectedIssue(issue)
    setLoadingStatus(true)
    
    try {
      const result = await getIssueStatus(issue.id)
      if (result.success) {
        setIssueStatus(result.status)
      }
    } catch (err) {
      console.error('Failed to fetch issue status:', err)
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleReportSuccess = () => {
    setShowReportForm(false)
    refetch()
  }

  if (showReportForm) {
    return (
      <IssueReportForm 
        onSuccess={handleReportSuccess}
        onClose={() => setShowReportForm(false)}
      />
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Issue Tracking</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              My Reported Issues
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Track your reported civic issues and their resolution progress
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <button
              onClick={() => setShowReportForm(true)}
              className="inline-flex items-center px-8 py-4 bg-white text-government-dark-blue font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-3 h-6 w-6" />
              Report New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">{issues.length}</div>
              <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Total</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Total Reports</h3>
          <p className="text-sm text-gray-600 mt-1">All your reported issues</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">
                {issues.filter(i => ['pending', 'under_review', 'assigned'].includes(i.status)).length}
              </div>
              <div className="text-xs text-orange-600 font-bold uppercase tracking-wide">Pending</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">In Progress</h3>
          <p className="text-sm text-gray-600 mt-1">Awaiting resolution</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">
                {issues.filter(i => i.status === 'resolved').length}
              </div>
              <div className="text-xs text-green-600 font-bold uppercase tracking-wide">Resolved</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Resolved</h3>
          <p className="text-sm text-gray-600 mt-1">Successfully completed</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">
                {issues.filter(i => i.status === 'in_progress').length}
              </div>
              <div className="text-xs text-purple-600 font-bold uppercase tracking-wide">Active</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Active Work</h3>
          <p className="text-sm text-gray-600 mt-1">Currently being fixed</p>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900">Recent Reports</h2>
          <p className="text-gray-600 mt-1">Your reported issues and their current status</p>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 text-government-dark-blue animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Issues</h3>
              <p className="text-gray-600">Fetching your reported issues...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Issues</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-6 py-3 bg-government-dark-blue text-white font-bold rounded-xl hover:bg-blue-800"
              >
                Try Again
              </button>
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-16 w-16 text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-government-gold to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">No Issues Reported Yet</h3>
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                Help improve your community by reporting infrastructure issues. Start by clicking the "Report New Issue" button.
              </p>
              <button
                onClick={() => setShowReportForm(true)}
                className="inline-flex items-center px-8 py-4 bg-government-dark-blue text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <Plus className="mr-3 h-6 w-6" />
                Report Your First Issue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div key={issue.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {issue.title || `${issue.category} Issue`}
                        </h3>
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getSeverityColor(issue.severity_level)}`}>
                          {getSeverityLabel(issue.severity_level)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed">{issue.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {issue.location}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(issue.created_at), 'MMM d, yyyy')}
                        </div>
                        {issue.booking_reference && (
                          <div className="flex items-center text-gray-600">
                            <Building className="h-4 w-4 mr-2" />
                            Ref: {issue.booking_reference}
                          </div>
                        )}
                      </div>
                      
                      {issue.assigned_authority && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                          <p className="text-sm font-medium text-blue-800">
                            Assigned to: {issue.assigned_authority}
                          </p>
                          {issue.estimated_completion && (
                            <p className="text-sm text-blue-600">
                              Expected completion: {format(new Date(issue.estimated_completion), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      <button
                        onClick={() => handleViewDetails(issue)}
                        className="inline-flex items-center px-4 py-2 bg-government-dark-blue text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-government-dark-blue bg-opacity-60 transition-opacity" onClick={() => setSelectedIssue(null)} />

            <div className="relative inline-block align-bottom bg-white/95 backdrop-blur-xl rounded-3xl px-8 pt-8 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 rounded-3xl"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-3xl font-black text-gray-900">
                    Issue Details
                  </h3>
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                {loadingStatus ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 text-government-dark-blue animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading detailed status...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Issue Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Title:</strong> {selectedIssue.title || `${selectedIssue.category} Issue`}</p>
                            <p><strong>Category:</strong> {selectedIssue.category}</p>
                            <p><strong>Status:</strong> 
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${getStatusColor(selectedIssue.status)}`}>
                                {selectedIssue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </p>
                            <p><strong>Severity:</strong>
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${getSeverityColor(selectedIssue.severity_level)}`}>
                                {getSeverityLabel(selectedIssue.severity_level)}
                              </span>
                            </p>
                            <p><strong>Location:</strong> {selectedIssue.location}</p>
                            <p><strong>Reported:</strong> {format(new Date(selectedIssue.created_at), 'EEEE, MMMM d, yyyy at h:mm a')}</p>
                            {selectedIssue.booking_reference && (
                              <p><strong>Reference:</strong> {selectedIssue.booking_reference}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-700 leading-relaxed">{selectedIssue.description}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedIssue.assigned_authority && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2">Assigned Authority</h4>
                            <div className="bg-blue-50 p-4 rounded-xl">
                              <p className="font-medium text-blue-900">{selectedIssue.assigned_authority}</p>
                              {selectedIssue.estimated_completion && (
                                <p className="text-sm text-blue-700 mt-1">
                                  Expected completion: {format(new Date(selectedIssue.estimated_completion), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {issueStatus && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2">Status Updates</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {issueStatus.status_history?.map((update: any, index: number) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(update.status)}`}>
                                      {update.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {format(new Date(update.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                  </div>
                                  {update.note && (
                                    <p className="text-sm text-gray-700">{update.note}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function IssuesPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <IssuesContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}