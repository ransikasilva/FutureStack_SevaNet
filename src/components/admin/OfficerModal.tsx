'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, UserCheck, Phone, Mail, User, Building, CreditCard, Shield } from 'lucide-react'

interface Officer {
  id?: string
  full_name: string
  nic: string
  phone?: string
  department_id?: string
  role: 'officer' | 'admin'
  is_verified: boolean
}

interface Department {
  id: string
  name: string
}

interface OfficerModalProps {
  isOpen: boolean
  onClose: () => void
  officer?: Officer | null
  onSuccess: () => void
}

export function OfficerModal({ isOpen, onClose, officer, onSuccess }: OfficerModalProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState<Officer>({
    full_name: officer?.full_name || '',
    nic: officer?.nic || '',
    phone: officer?.phone || '',
    department_id: officer?.department_id || '',
    role: officer?.role || 'officer',
    is_verified: officer?.is_verified ?? true,
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  useEffect(() => {
    // Update form data when officer prop changes
    if (officer) {
      setFormData({
        full_name: officer.full_name || '',
        nic: officer.nic || '',
        phone: officer.phone || '',
        department_id: officer.department_id || '',
        role: officer.role || 'officer',
        is_verified: officer.is_verified ?? true,
      })
    } else {
      // Reset form for new officer
      setFormData({
        full_name: '',
        nic: '',
        phone: '',
        department_id: '',
        role: 'officer',
        is_verified: true,
      })
      // Generate email suggestion based on name for new officers
      if (formData.full_name) {
        const emailSuggestion = formData.full_name.toLowerCase().replace(/\s+/g, '.') + '@gov.lk'
        setEmail(emailSuggestion)
      } else {
        setEmail('')
      }
    }
  }, [officer])

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
      if (officer?.id) {
        // Update existing officer profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            nic: formData.nic,
            phone: formData.phone,
            department_id: formData.department_id || null,
            role: formData.role,
            is_verified: formData.is_verified
          })
          .eq('id', officer.id)
        
        if (updateError) throw updateError
      } else {
        // Create new officer - this requires creating a new user account
        // For demo purposes, we'll create a profile directly
        // In production, this should create a proper auth user first
        
        if (!email || !password) {
          throw new Error('Email and password are required for new officers')
        }

        // Generate a user_id (in production, this would come from auth.users)
        const tempUserId = crypto.randomUUID()
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            user_id: tempUserId,
            full_name: formData.full_name,
            nic: formData.nic,
            phone: formData.phone,
            department_id: formData.department_id || null,
            role: formData.role,
            is_verified: formData.is_verified
          })
        
        if (insertError) throw insertError
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const validateNIC = (nic: string) => {
    const oldNIC = /^[0-9]{9}[vVxX]$/
    const newNIC = /^[0-9]{12}$/
    return oldNIC.test(nic) || newNIC.test(nic)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-t-3xl p-8">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">
                {officer ? 'Edit Officer' : 'Add New Officer'}
              </h2>
              <p className="text-blue-100">
                {officer ? 'Update officer information' : 'Create a new government officer account'}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  National ID (NIC) *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 transition-all duration-200 ${
                      formData.nic && !validateNIC(formData.nic) 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-government-dark-blue focus:ring-government-dark-blue/20'
                    }`}
                    placeholder="123456789V or 200012345678"
                  />
                </div>
                {formData.nic && !validateNIC(formData.nic) && (
                  <p className="text-red-600 text-sm mt-1">Please enter a valid NIC number</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                    placeholder="+94 71 234 5678"
                  />
                </div>
              </div>

              {!officer && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required={!officer}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                      placeholder="john.doe@gov.lk"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Role *
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'officer' | 'admin' })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                  >
                    <option value="officer">Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {!officer && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required={!officer}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-government-dark-blue focus:ring-2 focus:ring-government-dark-blue/20 transition-all duration-200"
                    placeholder="Temporary password (user should change)"
                    minLength={6}
                  />
                </div>
              )}

              <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={formData.is_verified}
                  onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                  className="h-5 w-5 text-government-dark-blue border-2 border-gray-300 rounded focus:ring-government-dark-blue"
                />
                <label htmlFor="is_verified" className="ml-3 text-sm font-medium text-gray-700">
                  Officer account is verified and can access the system
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
              disabled={loading || (formData.nic ? !validateNIC(formData.nic) : false)}
              className="px-8 py-3 bg-government-dark-blue text-white font-bold rounded-xl hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Saving...' : officer ? 'Update Officer' : 'Create Officer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}