'use client'

import { SupabaseStatus } from '@/components/debug/SupabaseStatus'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, Database, User, Settings } from 'lucide-react'

export default function DebugPage() {
  const { user, loading } = useAuthContext()
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [profileStatus, setProfileStatus] = useState<any>(null)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [demoData, setDemoData] = useState<any>(null)
  const [creatingDemo, setCreatingDemo] = useState(false)

  const runQuickTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      // Test 1: Basic query
      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .limit(1)

      if (deptError) throw new Error(`Departments query failed: ${deptError.message}`)

      // Test 2: Auth check
      const { data: authData, error: authError } = await supabase.auth.getSession()
      if (authError) throw new Error(`Auth check failed: ${authError.message}`)

      // Test 3: User profile if authenticated
      let profileData = null
      if (authData.session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.session.user.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error(`Profile query failed: ${profileError.message}`)
        }
        profileData = profile
      }

      setTestResult(`✅ All tests passed!
      
📊 Database: Connected (${dept?.length || 0} departments found)
🔐 Auth: ${authData.session ? 'Authenticated' : 'Not authenticated'}
👤 Profile: ${profileData ? `Found (${profileData.full_name})` : 'Not found'}
🕒 Timestamp: ${new Date().toLocaleTimeString()}`)

    } catch (error: any) {
      setTestResult(`❌ Test failed: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const checkProfileStatus = async () => {
    try {
      const response = await fetch('/api/auth/create-profile')
      const data = await response.json()
      setProfileStatus(data)
    } catch (error) {
      console.error('Failed to check profile status:', error)
    }
  }

  const createProfile = async () => {
    setCreatingProfile(true)
    try {
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          nic: user?.user_metadata?.nic || '',
          phone: user?.user_metadata?.phone || '',
        }),
      })
      const data = await response.json()
      setProfileStatus(data)
      
      if (response.ok) {
        alert('Profile created successfully! Please refresh the page.')
      } else {
        alert(`Failed to create profile: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to create profile:', error)
      alert('Failed to create profile')
    } finally {
      setCreatingProfile(false)
    }
  }

  const fetchDemoStatus = async () => {
    try {
      const response = await fetch('/api/demo/seed')
      const data = await response.json()
      setDemoData(data)
    } catch (error) {
      console.error('Failed to fetch demo status:', error)
    }
  }

  const createDemoData = async () => {
    setCreatingDemo(true)
    try {
      const response = await fetch('/api/demo/seed', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        alert(`Demo data created successfully!\nTime slots: ${data.data.timeSlots}\nAppointments: ${data.data.appointments}`)
        fetchDemoStatus()
      } else {
        alert(`Failed to create demo data: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to create demo data:', error)
      alert('Failed to create demo data')
    } finally {
      setCreatingDemo(false)
    }
  }

  // Check profile status on component mount
  useEffect(() => {
    if (user && !loading) {
      checkProfileStatus()
      fetchDemoStatus()
    }
  }, [user, loading])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SevaNet Debug Dashboard</h1>
          <p className="text-gray-600">Check system status and connection health</p>
        </div>

        <div className="space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                <strong>Debug Mode:</strong> This page is for development and testing purposes only.
              </p>
            </div>
          </div>

          {/* Quick Test */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Connection Test
              </h3>
              <button
                onClick={runQuickTest}
                disabled={testing}
                className="btn-primary"
              >
                {testing ? 'Testing...' : 'Run Test'}
              </button>
            </div>

            {testResult && (
              <div className="bg-gray-50 rounded-md p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{testResult}</pre>
              </div>
            )}
          </div>

          {/* Supabase Status */}
          <SupabaseStatus />

          {/* Profile Status & Fix */}
          {user && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Status
                </h3>
                <button
                  onClick={checkProfileStatus}
                  className="btn-secondary text-sm"
                >
                  Refresh
                </button>
              </div>

              {profileStatus && (
                <div className="space-y-4">
                  {profileStatus.exists ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-700">
                        ✅ Profile exists in database
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Role: {profileStatus.profile?.role || 'Unknown'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700">
                          ❌ Profile missing from database
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          This is why you can&apos;t access protected features.
                        </p>
                      </div>
                      
                      <button
                        onClick={createProfile}
                        disabled={creatingProfile}
                        className="btn-primary"
                      >
                        {creatingProfile ? 'Creating Profile...' : 'Create Profile Now'}
                      </button>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    <p><strong>User ID:</strong> {profileStatus.user?.id}</p>
                    <p><strong>Email:</strong> {profileStatus.user?.email}</p>
                    <p><strong>Email Confirmed:</strong> {profileStatus.user?.email_confirmed_at ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current User */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Current User Status
            </h3>

            {loading ? (
              <div className="text-gray-600">Loading user data...</div>
            ) : user ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Email:</strong> {user.email}
                  </div>
                  <div>
                    <strong>User ID:</strong> {user.id}
                  </div>
                  <div>
                    <strong>Full Name:</strong> {user.profile?.full_name || 'Not set'}
                  </div>
                  <div>
                    <strong>Role:</strong> {user.profile?.role || 'Not set'}
                  </div>
                  <div>
                    <strong>NIC:</strong> {user.profile?.nic || 'Not set'}
                  </div>
                  <div>
                    <strong>Phone:</strong> {user.profile?.phone || 'Not set'}
                  </div>
                  <div>
                    <strong>Verified:</strong> {user.profile?.is_verified ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Department:</strong> {user.profile?.department_id || 'None'}
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <strong>Raw User Data:</strong>
                  <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-gray-600">Not authenticated</div>
            )}
          </div>

          {/* Environment Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Node Environment:</strong> {process.env.NODE_ENV || 'development'}
              </div>
              <div>
                <strong>Next.js Version:</strong> 14.x
              </div>
              <div>
                <strong>Supabase URL:</strong> ileyyewqhyfclcfdlisg.supabase.co
              </div>
              <div>
                <strong>App URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}
              </div>
            </div>
          </div>

          {/* Demo Data */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Demo Data Management</h3>
              <button
                onClick={fetchDemoStatus}
                className="btn-secondary text-sm"
              >
                Refresh
              </button>
            </div>

            {demoData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <div className="text-2xl font-bold text-blue-600">{demoData.departments}</div>
                    <div className="text-sm text-blue-700">Departments</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <div className="text-2xl font-bold text-green-600">{demoData.services}</div>
                    <div className="text-sm text-green-700">Services</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-md">
                    <div className="text-2xl font-bold text-purple-600">{demoData.timeSlots}</div>
                    <div className="text-sm text-purple-700">Time Slots</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-md">
                    <div className="text-2xl font-bold text-orange-600">{demoData.appointments}</div>
                    <div className="text-sm text-orange-700">Appointments</div>
                  </div>
                </div>

                {demoData.timeSlots === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">
                      ⚠️ No time slots found. Create demo data to enable appointment booking.
                    </p>
                  </div>
                )}

                <button
                  onClick={createDemoData}
                  disabled={creatingDemo}
                  className="btn-primary w-full"
                >
                  {creatingDemo ? 'Creating Demo Data...' : 'Create Time Slots & Demo Appointments'}
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/" className="btn-secondary text-center">
                Home
              </a>
              <a href="/auth/login" className="btn-secondary text-center">
                Login
              </a>
              <a href="/dashboard" className="btn-secondary text-center">
                Dashboard
              </a>
              <a href="/officer" className="btn-secondary text-center">
                Officer Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}