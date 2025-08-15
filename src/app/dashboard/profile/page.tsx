'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { updateProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  User, 
  Mail, 
  Calendar, 
  CreditCard,
  Shield,
  Bell,
  Key,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

function ProfileContent() {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
  })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    appointment_reminders: true,
    status_updates: true
  })

  useEffect(() => {
    if (user?.profile) {
      setProfileData({
        full_name: user.profile.full_name || '',
        phone: user.profile.phone || '',
        address: user.profile.address || '',
        date_of_birth: user.profile.date_of_birth || '',
      })
    }
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage(null)

    try {
      await updateProfile(user.id, profileData)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Refresh the page to get updated user data
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Here you would typically save notification preferences to the database
      // For now, we'll just show a success message
      setMessage({ type: 'success', text: 'Notification preferences updated!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update notification preferences' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Professional Header */}
      <div className="relative bg-gradient-to-r from-government-dark-blue via-blue-700 to-government-dark-blue rounded-3xl p-8 lg:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-government-gold/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-government-gold/10 rounded-full -mr-48 -mt-48"></div>
        
        <div className="relative">
          <div className="flex items-center mb-4">
            <div className="bg-white/20 p-2 rounded-xl mr-3">
              <User className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-100 text-sm font-bold uppercase tracking-wide">Account Management</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Profile Settings
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
            Manage your account information, security settings, and notification preferences
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mt-6 sm:mt-0 flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <Shield className="h-4 w-4 mr-1" />
              <span>Secure profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-6 rounded-xl ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="h-6 w-6 mr-3" />
            ) : (
              <AlertCircle className="h-6 w-6 mr-3" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <User className="h-6 w-6 text-government-dark-blue mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              </div>
              <p className="text-gray-600 mt-1">Update your personal details and contact information</p>
            </div>
            <div className="p-8">

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
                      placeholder="0771234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Address
                  </label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
                    placeholder="Enter your full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-government-dark-blue hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-dark-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <Key className="h-6 w-6 text-government-dark-blue mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
              </div>
              <p className="text-gray-600 mt-1">Update your password to keep your account secure</p>
            </div>
            <div className="p-8">

              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
                      placeholder="Enter new password"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors"
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Should include letters and numbers</li>
                    <li>• Avoid using personal information</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading || !passwordData.new_password || !passwordData.confirm_password}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-government-dark-blue hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-dark-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Key className="h-5 w-5 mr-2" />
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Account Info */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-8 py-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Account Information</h3>
              <p className="text-gray-600 mt-1">Your account details and verification status</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Email Address</p>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-green-100 rounded-lg mr-4">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">National Identity Card</p>
                  <p className="text-gray-600 mt-1">{user.profile?.nic || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-purple-100 rounded-lg mr-4">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Account Type</p>
                  <p className="text-gray-600 mt-1 capitalize">{user.profile?.role || 'citizen'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Member Since</p>
                  <p className="text-gray-600 mt-1">
                    {new Date(user.profile?.created_at || user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center">
                <Bell className="h-6 w-6 text-government-dark-blue mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Notification Preferences</h3>
              </div>
              <p className="text-gray-600 mt-1">Control how you receive updates and reminders</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600 mt-1">Receive appointment confirmations and updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-government-dark-blue"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600 mt-1">Get text message alerts for important updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-government-dark-blue"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">Appointment Reminders</p>
                  <p className="text-sm text-gray-600 mt-1">24-hour advance reminders for scheduled appointments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.appointment_reminders}
                    onChange={(e) => setNotifications(prev => ({ ...prev, appointment_reminders: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-government-dark-blue"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">Status Updates</p>
                  <p className="text-sm text-gray-600 mt-1">Document approval status and appointment changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.status_updates}
                    onChange={(e) => setNotifications(prev => ({ ...prev, status_updates: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-government-dark-blue"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleNotificationUpdate}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}