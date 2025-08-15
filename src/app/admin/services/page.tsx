'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { DepartmentModal } from '@/components/admin/DepartmentModal'
import { ServiceModal } from '@/components/admin/ServiceModal'
import { 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Building,
  FileText,
  Clock,
  Users,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Department {
  id: string
  name: string
  description?: string
  address?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
  _count?: {
    services: number
  }
}

interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  service_fee: number
  is_active: boolean
  department: Department
  _count?: {
    appointments: number
  }
}

export default function AdminServicesPage() {
  const { user } = useAuthContext()
  const [departments, setDepartments] = useState<Department[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'departments' | 'services'>('departments')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  useEffect(() => {
    if (user?.profile?.role === 'admin') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (deptError) throw deptError
      setDepartments(deptData || [])

      // Fetch services with department info
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select(`
          *,
          departments!services_department_id_fkey (*)
        `)
        .order('name')

      if (serviceError) {
        console.error('Service fetch error:', serviceError)
        // Try simplified query
        const { data: simpleServiceData } = await supabase
          .from('services')
          .select('*')
          .order('name')
        
        setServices((simpleServiceData || []).map(service => ({
          ...service,
          department: { id: '', name: 'Unknown', description: '', address: '', contact_phone: '', contact_email: '', is_active: true }
        })))
      } else {
        setServices((serviceData || []).map(service => ({
          ...service,
          department: service.departments || { id: '', name: 'Unknown', description: '', address: '', contact_phone: '', contact_email: '', is_active: true }
        })))
      }

    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId)
      
      if (error) throw error
      
      await fetchData() // Refresh the data
    } catch (error: any) {
      alert('Failed to delete department: ' + error.message)
    }
  }
  
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
      
      if (error) throw error
      
      await fetchData() // Refresh the data
    } catch (error: any) {
      alert('Failed to delete service: ' + error.message)
    }
  }

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && dept.is_active) ||
      (filterActive === 'inactive' && !dept.is_active)
    return matchesSearch && matchesFilter
  })

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && service.is_active) ||
      (filterActive === 'inactive' && !service.is_active)
    return matchesSearch && matchesFilter
  })

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
                <Settings className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Service Management</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Services & Departments
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
              Manage government departments and services offered to citizens
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            <button 
              onClick={() => {
                if (activeTab === 'departments') {
                  setEditingDepartment(null)
                  setShowDepartmentModal(true)
                } else {
                  setEditingService(null)
                  setShowServiceModal(true)
                }
              }}
              className="group inline-flex items-center px-8 py-4 bg-white text-government-dark-blue font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <Plus className="mr-3 h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              Add New {activeTab === 'departments' ? 'Department' : 'Service'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'departments'
                  ? 'bg-government-dark-blue text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Building className="h-5 w-5 mr-2 inline" />
              Departments
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'services'
                  ? 'bg-government-dark-blue text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="h-5 w-5 mr-2 inline" />
              Services
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-all duration-200"
              />
            </div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="px-4 py-2 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading {activeTab}...</p>
        </div>
      ) : (
        <>
          {activeTab === 'departments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-xl mr-4">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                        <div className="flex items-center mt-1">
                          {dept.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs font-medium ${dept.is_active ? 'text-green-600' : 'text-red-600'}`}>
                            {dept.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setEditingDepartment(dept)
                          setShowDepartmentModal(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {dept.description && (
                    <p className="text-gray-600 text-sm mb-4">{dept.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    {dept.contact_phone && (
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2">{dept.contact_phone}</span>
                      </div>
                    )}
                    {dept.contact_email && (
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium">Email:</span>
                        <span className="ml-2">{dept.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start mb-4">
                        <div className="bg-green-100 p-3 rounded-xl mr-4">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                          <p className="text-blue-600 font-medium">{service.department?.name}</p>
                          <div className="flex items-center mt-2">
                            {service.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm font-medium ${service.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {service.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {service.description && (
                        <p className="text-gray-600 mb-4">{service.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">{service.duration_minutes} min</span> duration
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">Rs. {service.service_fee}</span> fee
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            <span className="font-medium">{service._count?.appointments || 0}</span> appointments
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                      <button 
                        onClick={() => {
                          setEditingService(service)
                          setShowServiceModal(true)
                        }}
                        className="px-4 py-2 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        <Edit className="h-4 w-4 mr-2 inline" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-2 inline" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'departments' ? filteredDepartments : filteredServices).length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'departments' ? (
                  <Building className="h-12 w-12 text-gray-400" />
                ) : (
                  <FileText className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No {activeTab} found
              </h3>
              <p className="text-gray-600 mb-8">
                {searchTerm || filterActive !== 'all' 
                  ? `No ${activeTab} match your current filters.`
                  : `No ${activeTab} have been created yet.`
                }
              </p>
              {(!searchTerm && filterActive === 'all') && (
                <button
                  onClick={() => {
                    if (activeTab === 'departments') {
                      setEditingDepartment(null)
                      setShowDepartmentModal(true)
                    } else {
                      setEditingService(null)
                      setShowServiceModal(true)
                    }
                  }}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-government-dark-blue hover:bg-blue-800 transition-colors"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add First {activeTab === 'departments' ? 'Department' : 'Service'}
                </button>
              )}
            </div>
          )}
        </>
      )}
      
      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => {
          setShowDepartmentModal(false)
          setEditingDepartment(null)
        }}
        department={editingDepartment}
        onSuccess={() => {
          fetchData()
        }}
      />
      
      <ServiceModal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false)
          setEditingService(null)
        }}
        service={editingService}
        onSuccess={() => {
          fetchData()
        }}
      />
    </div>
  )
}