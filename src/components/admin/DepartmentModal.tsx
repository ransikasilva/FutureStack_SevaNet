'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Building, Phone, Mail, MapPin } from 'lucide-react'

interface Department {
  id?: string
  name: string
  description?: string
  address?: string
  contact_phone?: string
  contact_email?: string
  is_active: boolean
}

interface DepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  department?: Department | null
  onSuccess: () => void
}

export function DepartmentModal({ isOpen, onClose, department, onSuccess }: DepartmentModalProps) {
  const [formData, setFormData] = useState<Department>({
    name: department?.name || '',
    description: department?.description || '',
    address: department?.address || '',
    contact_phone: department?.contact_phone || '',
    contact_email: department?.contact_email || '',
    is_active: department?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Update form data when department prop changes
    if (department) {
      setFormData({
        name: department.name || '',
        description: department.description || '',
        address: department.address || '',
        contact_phone: department.contact_phone || '',
        contact_email: department.contact_email || '',
        is_active: department.is_active ?? true,
      })
    } else {
      // Reset form for new department
      setFormData({
        name: '',
        description: '',
        address: '',
        contact_phone: '',
        contact_email: '',
        is_active: true,
      })
    }
  }, [department])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (department?.id) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update(formData)
          .eq('id', department.id)
        
        if (error) throw error
      } else {
        // Create new department
        const { error } = await supabase
          .from('departments')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative bg-gradient-to-r from-government-dark-blue to-blue-700 rounded-t-3xl p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <Building className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">
                {department ? 'Edit Department' : 'Add New Department'}
              </h2>
              <p className="text-blue-100">
                {department ? 'Update department information' : 'Create a new government department'}
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

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                placeholder="e.g., Department of Motor Traffic"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                placeholder="Brief description of the department's services..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                  placeholder="Physical address of the department"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                    placeholder="+94 11 234 5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                    placeholder="contact@department.gov.lk"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-5 w-5 text-government-dark-blue border-2 border-gray-300 rounded focus:ring-government-dark-blue"
              />
              <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700">
                Department is active and accepting appointments
              </label>
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
              {loading ? 'Saving...' : department ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}