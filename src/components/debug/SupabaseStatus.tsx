'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Users } from 'lucide-react'

interface ConnectionStatus {
  connected: boolean
  authenticated: boolean
  user: any
  error: string | null
  tables: {
    departments: number
    services: number
    appointments: number
    profiles: number
  }
  loading: boolean
}

export function SupabaseStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    authenticated: false,
    user: null,
    error: null,
    tables: {
      departments: 0,
      services: 0,
      appointments: 0,
      profiles: 0
    },
    loading: true
  })

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Test basic connection
      const { error: healthError } = await supabase
        .from('departments')
        .select('id')
        .limit(1)

      if (healthError) {
        throw new Error(`Connection failed: ${healthError.message}`)
      }

      // Check authentication
      const { data: authData, error: authError } = await supabase.auth.getSession()
      const isAuthenticated = !authError && !!authData.session
      const user = authData.session?.user || null

      // Get table counts
      const [deptCount, servicesCount, appointmentsCount, profilesCount] = await Promise.all([
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ])

      setStatus({
        connected: true,
        authenticated: isAuthenticated,
        user,
        error: null,
        tables: {
          departments: deptCount.count || 0,
          services: servicesCount.count || 0,
          appointments: appointmentsCount.count || 0,
          profiles: profilesCount.count || 0
        },
        loading: false
      })

    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        connected: false,
        authenticated: false,
        user: null,
        error: error.message,
        loading: false
      }))
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const getStatusIcon = () => {
    if (status.loading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
    if (status.error) return <XCircle className="h-5 w-5 text-red-500" />
    if (status.connected) return <CheckCircle className="h-5 w-5 text-green-500" />
    return <AlertCircle className="h-5 w-5 text-yellow-500" />
  }

  const getStatusText = () => {
    if (status.loading) return 'Checking connection...'
    if (status.error) return 'Connection failed'
    if (status.connected) return 'Connected successfully'
    return 'Not connected'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Supabase Connection Status
        </h3>
        <button
          onClick={checkConnection}
          disabled={status.loading}
          className="btn-secondary text-sm"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${status.loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
          </div>
          <div className="text-sm text-gray-600">
            URL: ileyyewqhyfclcfdlisg.supabase.co
          </div>
        </div>

        {/* Error Message */}
        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {status.error}
            </p>
          </div>
        )}

        {/* Authentication Status */}
        {status.connected && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">Authentication</span>
            </div>
            <div className="flex items-center">
              {status.authenticated ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-700">
                    Signed in as {status.user?.email || 'Unknown'}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-700">Not signed in</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Database Tables */}
        {status.connected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-md">
              <div className="text-2xl font-bold text-blue-600">{status.tables.departments}</div>
              <div className="text-sm text-blue-700">Departments</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-md">
              <div className="text-2xl font-bold text-green-600">{status.tables.services}</div>
              <div className="text-sm text-green-700">Services</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-md">
              <div className="text-2xl font-bold text-purple-600">{status.tables.appointments}</div>
              <div className="text-sm text-purple-700">Appointments</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-md">
              <div className="text-2xl font-bold text-orange-600">{status.tables.profiles}</div>
              <div className="text-sm text-orange-700">Profiles</div>
            </div>
          </div>
        )}

        {/* Connection Details */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Supabase URL:</strong> https://ileyyewqhyfclcfdlisg.supabase.co</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
          <p><strong>Auto Refresh Token:</strong> Enabled</p>
          <p><strong>Persist Session:</strong> Enabled</p>
        </div>
      </div>
    </div>
  )
}