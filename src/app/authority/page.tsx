'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
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
  TrendingUp,
  Users,
  Building,
  Filter,
  Activity,
  MessageSquare,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import IssuesMapClient from '@/components/maps/IssuesMapClient'
import Link from 'next/link'

function AuthorityDashboardContent() {
  const { user } = useAuthContext()
  const authorityId = user?.profile?.authority_id
  
  // Get authority information
  const [authorityInfo, setAuthorityInfo] = useState<any>(null)
  const [loadingAuthority, setLoadingAuthority] = useState(true)
  
  // Modal state for issue management
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [statusNote, setStatusNote] = useState('')
  
  // For authority officers, we'll show issues based on their authority's category
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  // Filter by authority category - authority officers should only see issues in their category
  const authorityCategory = authorityInfo?.category
  const effectiveCategory = authorityCategory || selectedCategory === 'all' ? authorityCategory : selectedCategory
  const { issues, loading, error, refetch } = useDepartmentIssues(undefined, effectiveCategory, authorityId)

  // Fetch authority information
  useEffect(() => {
    const fetchAuthorityInfo = async () => {
      if (!authorityId) return
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/v1/issues/authorities`)
        const data = await response.json()
        
        if (data.success) {
          const authority = data.authorities.find((auth: any) => auth.id === authorityId)
          setAuthorityInfo(authority)
        }
      } catch (error) {
        console.error('Failed to fetch authority info:', error)
      } finally {
        setLoadingAuthority(false)
      }
    }

    fetchAuthorityInfo()
  }, [authorityId])

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

  // Handle status updates
  const handleStatusUpdate = async (issueId: string, newStatus: string) => {
    if (!issueId || !newStatus || !user?.id) return

    try {
      setUpdatingStatus(issueId)
      const result = await updateIssueStatus(issueId, newStatus, statusNote, user.id)
      
      if (result.success) {
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

  const statusOptions = [
    { value: 'pending', label: 'Pending Review' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ]

  // Calculate statistics
  const stats = {
    total: issues.length,
    pending: issues.filter(i => ['pending', 'under_review'].includes(i.status)).length,
    active: issues.filter(i => ['assigned', 'in_progress'].includes(i.status)).length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    critical: issues.filter(i => i.severity_level >= 3).length
  }

  if (loadingAuthority) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading authority dashboard...</p>
        </div>
      </div>
    )
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
              <Building className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Authority Dashboard</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            {authorityInfo?.name || 'Authority Dashboard'}
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
            Manage civic issues for {authorityInfo?.category || 'your authority'} • {authorityInfo?.coverage_area || 'Area Coverage'}
          </p>
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

      {/* Issues Map */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900 flex items-center">
            <MapPin className="h-6 w-6 mr-2 text-red-600" />
            Issues Location Map
          </h2>
          <p className="text-gray-600 mt-1">Visual overview of reported issues in your authority area</p>
        </div>
        <div className="p-8">
          <div className="rounded-lg overflow-hidden">
            <IssuesMapClient 
              issues={issues
                .filter(issue => issue.latitude != null && issue.longitude != null)
                .map(issue => ({
                  ...issue,
                  latitude: issue.latitude!,
                  longitude: issue.longitude!
                }))
              } 
              height="500px" 
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link
          href="/authority/issues"
          className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-900">{stats.pending}</div>
              <div className="text-xs text-orange-600 font-bold uppercase tracking-wide">Pending</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
            Manage Issues
          </h3>
          <p className="text-sm text-gray-600 mt-1">Review and update issue status</p>
        </Link>

        <Link
          href="/authority/analytics"
          className="group relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-900">{stats.total}</div>
              <div className="text-xs text-purple-600 font-bold uppercase tracking-wide">Total</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
            View Analytics
          </h3>
          <p className="text-sm text-gray-600 mt-1">Performance insights and trends</p>
        </Link>

        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-900">{authorityInfo?.contact_phone || 'N/A'}</div>
              <div className="text-xs text-green-600 font-bold uppercase tracking-wide">Contact</div>
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Authority Contact</h3>
          <p className="text-sm text-gray-600 mt-1">{authorityInfo?.contact_email || 'Email not available'}</p>
        </div>
      </div>

      {/* Recent Issues List */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-black text-gray-900">Recent Issues</h2>
          <p className="text-gray-600 mt-1">Latest civic issues reported in your authority area</p>
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
          ) : issues.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-16 w-16 text-blue-400" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">No Issues Found</h3>
              <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                No civic issues have been reported in your authority area yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.slice(0, 5).map((issue) => (
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
                    </div>
                    
                    <div className="ml-6">
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="inline-flex items-center px-4 py-2 bg-government-dark-blue text-white rounded-lg hover:bg-blue-800 transition-colors font-medium text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Manage Issue
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {issues.length > 5 && (
                <div className="text-center pt-6">
                  <Link
                    href="/authority/issues"
                    className="inline-flex items-center px-8 py-3 bg-government-dark-blue text-white font-bold rounded-xl hover:bg-blue-800 transition-colors"
                  >
                    View All {issues.length} Issues
                    <TrendingUp className="h-5 w-5 ml-2" />
                  </Link>
                </div>
              )}
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
                    Issue Management
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
                        <div className="relative">
                          <img 
                            src={selectedIssue.image_url} 
                            alt="Issue" 
                            className="w-full rounded-xl shadow-md max-h-64 object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', selectedIssue.image_url)
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                            <div className="text-center">
                              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Image could not be loaded</p>
                              <p className="text-xs text-gray-400 mt-1">URL: {selectedIssue.image_url}</p>
                            </div>
                          </div>
                        </div>
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
                            {statusOptions.map((status) => (
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

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setSelectedIssue(null)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Close
                        </button>
                        <Link
                          href="/authority/issues"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                        >
                          View All Issues
                        </Link>
                      </div>
                    </div>
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

export default function AuthorityDashboardPage() {
  return <AuthorityDashboardContent />
}