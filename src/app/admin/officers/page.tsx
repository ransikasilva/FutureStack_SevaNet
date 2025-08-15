'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { OfficerModal } from '@/components/admin/OfficerModal'
import { 
  UserCheck, 
  Plus,
  Edit,
  Trash2,
  Building,
  Mail,
  Phone,
  Calendar,
  Users,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  User
} from 'lucide-react'

interface Officer {
  id: string
  user_id?: string
  full_name: string
  nic: string
  phone?: string
  role: 'officer' | 'admin'
  department_id?: string
  is_verified: boolean
  created_at?: string
  department?: {
    id: string
    name: string
  }
  user?: {
    email: string
  }
  _count?: {
    appointments: number
  }
}

export default function AdminOfficersPage() {
  const { user } = useAuthContext()
  const [officers, setOfficers] = useState<Officer[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all')
  const [showOfficerModal, setShowOfficerModal] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null)

  useEffect(() => {
    if (user?.profile?.role === 'admin') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('Fetching officer data...')
      
      // Fetch departments for filter
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (deptError) {
        console.error('Department fetch error:', deptError)
        throw deptError
      }
      console.log('Departments fetched:', deptData?.length)
      setDepartments(deptData || [])

      // Fetch officers (profiles with role 'officer' or 'admin')
      const { data: officerData, error: officerError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          nic,
          phone,
          role,
          department_id,
          is_verified,
          created_at,
          departments!profiles_department_id_fkey (id, name)
        `)
        .in('role', ['officer', 'admin'])
        .order('full_name')

      console.log('Officers query result:', { data: officerData, error: officerError })
      
      if (officerError) {
        console.error('Officer fetch error:', officerError)
        throw officerError
      }

      // Get user emails for officers - simplified approach
      const officersWithEmails = (officerData || []).map((officer: any) => {
        // For now, we'll use a placeholder email since auth.admin requires special permissions
        return {
          ...officer,
          department: officer.departments?.[0] || { id: '', name: 'Unassigned' }, // Map the joined data correctly
          user: { email: `${officer.full_name?.toLowerCase().replace(/\s+/g, '.')}@gov.lk` }
        }
      })

      console.log('Officers with emails:', officersWithEmails.length)
      setOfficers(officersWithEmails)

    } catch (error) {
      console.error('Failed to fetch officers:', error)
      // Fallback: just get basic profiles data
      try {
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, nic, phone, role, department_id, is_verified, created_at')
          .in('role', ['officer', 'admin'])
          .order('full_name')
        
        console.log('Fallback data:', fallbackData)
        
        setOfficers((fallbackData || []).map((officer: any) => ({
          ...officer,
          department: { id: '', name: 'Unassigned' },
          user: { email: `${officer.full_name?.toLowerCase().replace(/\s+/g, '.')}@gov.lk` || 'N/A' }
        })))
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError)
        setOfficers([])
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = 
      officer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = filterDepartment === 'all' || officer.department_id === filterDepartment
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'verified' && officer.is_verified) ||
      (filterStatus === 'unverified' && !officer.is_verified)
    
    return matchesSearch && matchesDepartment && matchesStatus
  })
  
  const handleVerifyOfficer = async (officerId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', officerId)
      
      if (error) throw error
      
      await fetchData() // Refresh the data
    } catch (error: any) {
      alert('Failed to verify officer: ' + error.message)
    }
  }
  
  const handleDeleteOfficer = async (officerId: string) => {
    if (!confirm('Are you sure you want to delete this officer? This action cannot be undone.')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', officerId)
      
      if (error) throw error
      
      await fetchData() // Refresh the data
    } catch (error: any) {
      alert('Failed to delete officer: ' + error.message)
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
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-xl mr-3">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Staff Management</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Government Officers
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Manage government officers and administrative staff across all departments
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <button 
              onClick={() => {
                setEditingOfficer(null)
                setShowOfficerModal(true)
              }}
              className="group inline-flex items-center px-8 py-4 bg-white text-government-dark-blue font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-3 h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              Add New Officer
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total Officers</p>
              <p className="text-3xl font-black text-gray-900">{officers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Verified</p>
              <p className="text-3xl font-black text-gray-900">{officers.filter(o => o.is_verified).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Admins</p>
              <p className="text-3xl font-black text-gray-900">{officers.filter(o => o.role === 'admin').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Building className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Departments</p>
              <p className="text-3xl font-black text-gray-900">{departments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-xl mr-3">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Search & Filter Officers</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search officers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-all duration-200 min-w-[200px]"
              />
            </div>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-all duration-200"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading officers...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOfficers.map((officer) => (
            <div
              key={officer.id}
              className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start mb-4">
                    <div className={`p-3 rounded-xl mr-4 ${
                      officer.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {officer.role === 'admin' ? (
                        <Shield className="h-8 w-8 text-purple-600" />
                      ) : (
                        <User className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-gray-900">{officer.full_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          officer.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {officer.role}
                        </span>
                        <div className="flex items-center">
                          {officer.is_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs font-medium ${officer.is_verified ? 'text-green-600' : 'text-red-600'}`}>
                            {officer.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </div>
                      <p className="text-blue-600 font-medium mt-1">
                        {officer.department?.name || 'No Department Assigned'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Joined {officer.created_at ? new Date(officer.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{officer.user?.email}</span>
                    </div>
                    {officer.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{officer.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">{officer._count?.appointments || 0}</span> appointments handled
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                  <button 
                    onClick={() => {
                      setEditingOfficer(officer)
                      setShowOfficerModal(true)
                    }}
                    className="px-4 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    <Edit className="h-4 w-4 mr-2 inline" />
                    Edit
                  </button>
                  {!officer.is_verified && (
                    <button 
                      onClick={() => handleVerifyOfficer(officer.id)}
                      className="px-4 py-2 text-green-600 border border-green-200 hover:bg-green-50 rounded-lg transition-colors font-medium"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 inline" />
                      Verify
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteOfficer(officer.id)}
                    className="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    <Trash2 className="h-4 w-4 mr-2 inline" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredOfficers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCheck className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No officers found
              </h3>
              <p className="text-gray-600 mb-8">
                {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                  ? 'No officers match your current filters.'
                  : 'No officers have been registered yet.'
                }
              </p>
            </div>
          )}
        </div>
      )}
      
      <OfficerModal
        isOpen={showOfficerModal}
        onClose={() => {
          setShowOfficerModal(false)
          setEditingOfficer(null)
        }}
        officer={editingOfficer}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}