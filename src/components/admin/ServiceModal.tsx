'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, FileText, Clock, DollarSign, Building, ListChecks } from 'lucide-react'

interface Service {
  id?: string
  name: string
  description?: string
  department_id: string
  duration_minutes: number
  service_fee: number
  required_documents: string[]
  prerequisites?: string
  is_active: boolean
}

interface Department {
  id: string
  name: string
}

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service?: Service | null
  onSuccess: () => void
}

export function ServiceModal({ isOpen, onClose, service, onSuccess }: ServiceModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState<Service>({
    name: service?.name || '',
    description: service?.description || '',
    department_id: service?.department_id || '',
    duration_minutes: service?.duration_minutes || 30,
    service_fee: service?.service_fee || 0,
    required_documents: service?.required_documents || [],
    prerequisites: service?.prerequisites || '',
    is_active: service?.is_active ?? true,
  })
  const [newDocument, setNewDocument] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  useEffect(() => {
    // Update form data when service prop changes
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        department_id: service.department_id || '',
        duration_minutes: service.duration_minutes || 30,
        service_fee: service.service_fee || 0,
        required_documents: service.required_documents || [],
        prerequisites: service.prerequisites || '',
        is_active: service.is_active ?? true,
      })
    } else {
      // Reset form for new service
      setFormData({
        name: '',
        description: '',
        department_id: '',
        duration_minutes: 30,
        service_fee: 0,
        required_documents: [],
        prerequisites: '',
        is_active: true,
      })
    }
  }, [service])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setDepartments(data || [])
    } catch (err) {
      console.error('Failed to fetch departments:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (service?.id) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(formData)
          .eq('id', service.id)
        
        if (error) throw error
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert(formData)
        
        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addDocument = () => {
    if (newDocument.trim() && !formData.required_documents.includes(newDocument.trim())) {
      setFormData({
        ...formData,
        required_documents: [...formData.required_documents, newDocument.trim()]
      })
      setNewDocument('')
    }
  }

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      required_documents: formData.required_documents.filter((_, i) => i !== index)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-t-3xl p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">
                {service ? 'Edit Service' : 'Add New Service'}
              </h2>
              <p className="text-blue-100">
                {service ? 'Update service information' : 'Create a new government service'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                  placeholder="e.g., Driving License Application"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Department *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      min="15"
                      max="480"
                      required
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Service Fee (Rs.)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.service_fee}
                      onChange={(e) => setFormData({ ...formData, service_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                  placeholder="Detailed description of the service..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Prerequisites
                </label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                  placeholder="Any requirements or conditions before applying..."
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Required Documents
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newDocument}
                      onChange={(e) => setNewDocument(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                      placeholder="e.g., National ID Card"
                    />
                    <button
                      type="button"
                      onClick={addDocument}
                      className="px-4 py-3 bg-government-dark-blue text-white rounded-xl hover:bg-blue-800 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.required_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <ListChecks className="h-4 w-4 text-government-dark-blue mr-2" />
                          <span className="text-sm font-medium text-gray-700">{doc}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-5 w-5 text-government-dark-blue border-2 border-gray-300 rounded focus:ring-government-dark-blue"
                />
                <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700">
                  Service is active and accepting appointments
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-government-dark-blue text-white font-bold rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}