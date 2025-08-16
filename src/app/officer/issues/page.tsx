'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useDepartmentIssues, updateIssueStatus, Issue } from '@/hooks/useIssues'
import { 
  AlertTriangle, 
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
  TrendingUp,
  Users,
  MessageSquare,
  ArrowRight,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'

function OfficerIssuesContent() {
  const { user } = useAuthContext()
  const authorityId = user?.profile?.authority_id
  
  // For authority officers, we'll show issues based on their authority's category
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { issues, loading, error, refetch } = useDepartmentIssues(undefined, selectedCategory === 'all' ? undefined : selectedCategory, authorityId)
  
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'All Issues', icon: '📋' },
    { value: 'roads', label: 'Roads & Transportation', icon: '🛣️' },
    { value: 'electricity', label: 'Electricity & Power', icon: '⚡' },
    { value: 'water', label: 'Water Supply', icon: '💧' },
    { value: 'waste', label: 'Waste Management', icon: '🗑️' },
    { value: 'safety', label: 'Public Safety', icon: '🚨' },
    { value: 'health', label: 'Health Services', icon: '🏥' },
    { value: 'environment', label: 'Environment', icon: '🌿' },
    { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ]

  // Filter issues based on status
  const filteredIssues = issues.filter(issue => 
    filterStatus === 'all' ? true : issue.status === filterStatus
  )

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

  const handleStatusUpdate = async (issueId: string, newStatus: string) => {
    if (!issueId || !newStatus || !user?.id) return

    try {
      setUpdatingStatus(issueId)
      const result = await updateIssueStatus(issueId, newStatus, statusNote, user.id)
      
      if (result.success) {
        // Success - refresh data
        refetch()
        setStatusNote('')
        setSelectedIssue(null)
      } else {
        alert(result.message || 'Failed to update issue status')
      }
    } catch (err) {
      console.error('Failed to update issue status:', err)
      alert('Failed to update issue status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Calculate statistics
  const stats = {
    total: filteredIssues.length,
    pending: filteredIssues.filter(i => ['pending', 'under_review'].includes(i.status)).length,
    active: filteredIssues.filter(i => ['assigned', 'in_progress'].includes(i.status)).length,
    resolved: filteredIssues.filter(i => i.status === 'resolved').length,
    critical: filteredIssues.filter(i => i.severity_level >= 3).length
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative">
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-2 rounded-xl mr-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Issue Management</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Civic Issue Management
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
            Review and manage reported civic issues from citizens in your area of responsibility
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <Filter className="h-4 w-4 inline mr-2" />
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            <Filter className="h-4 w-4 inline mr-2" />
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">{stats.total}</div>
              <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Total</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">All Issues</h3>
          <p className="text-sm text-gray-600 mt-1">Total reported issues</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">{stats.pending}</div>
              <div className="text-xs text-orange-600 font-bold uppercase tracking-wide">Pending</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Needs Review</h3>
          <p className="text-sm text-gray-600 mt-1">Awaiting officer review</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">{stats.active}</div>
              <div className="text-xs text-purple-600 font-bold uppercase tracking-wide">Active</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">In Progress</h3>
          <p className="text-sm text-gray-600 mt-1">Being worked on</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">{stats.resolved}</div>
              <div className="text-xs text-green-600 font-bold uppercase tracking-wide">Resolved</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Completed</h3>
          <p className="text-sm text-gray-600 mt-1">Successfully resolved</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-gray-900">{stats.critical}</div>
              <div className="text-xs text-red-600 font-bold uppercase tracking-wide">Critical</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">High Priority</h3>
          <p className="text-sm text-gray-600 mt-1">Needs urgent attention</p>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900">Reported Issues</h2>
          <p className="text-gray-600 mt-1">
            {selectedCategory === 'all' ? 'All civic issues' : `${categories.find(c => c.value === selectedCategory)?.label} issues`}
            {filterStatus !== 'all' && ` • ${statusOptions.find(s => s.value === filterStatus)?.label}`}
          </p>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-12 w-12 text-government-dark-blue animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Issues</h3>
              <p className="text-gray-600">Fetching reported civic issues...</p>
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
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-16 w-16 text-blue-400" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">No Issues Found</h3>
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                {selectedCategory === 'all' 
                  ? 'No civic issues have been reported yet.' 
                  : `No ${categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} issues found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
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
                        <div className="flex items-center text-gray-600">
                          <Building className="h-4 w-4 mr-2" />
                          Category: {issue.category}
                        </div>
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
                    
                    <div className="ml-6 space-y-2">
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="w-full inline-flex items-center px-4 py-2 bg-government-dark-blue text-white rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      
                      {issue.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(issue.id, 'under_review')}
                          disabled={updatingStatus === issue.id}
                          className="w-full inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
                        >
                          {updatingStatus === issue.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Start Review
                            </>
                          )}
                        </button>
                      )}
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
                    Issue Details & Management
                  </h3>
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Issue Information */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4">Issue Information</h4>
                      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-xl">
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
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">{selectedIssue.description}</p>
                    </div>

                    {selectedIssue.image_url && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Attached Image</h4>
                        <img 
                          src={selectedIssue.image_url} 
                          alt="Issue" 
                          className="w-full rounded-xl shadow-md max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Action Panel */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-4">Status Management</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                          <div className="grid grid-cols-2 gap-2">
                            {statusOptions.filter(s => s.value !== 'all').map((status) => (
                              <button
                                key={status.value}
                                onClick={() => handleStatusUpdate(selectedIssue.id, status.value)}
                                disabled={updatingStatus === selectedIssue.id || selectedIssue.status === status.value}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  selectedIssue.status === status.value
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-government-dark-blue text-white hover:bg-blue-800 disabled:opacity-50'
                                }`}
                              >
                                {updatingStatus === selectedIssue.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  status.label
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Add Note (Optional)</label>
                          <textarea
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue"
                            placeholder="Add a note about the status update..."
                          />
                        </div>
                      </div>
                    </div>

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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OfficerIssuesPage() {
  return (
    <ProtectedRoute allowedRoles={['officer']}>
      <OfficerIssuesContent />
    </ProtectedRoute>
  )
}