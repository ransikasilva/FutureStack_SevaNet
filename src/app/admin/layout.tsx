'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    console.log('Admin layout auth check:', { user: !!user, loading, role: user?.profile?.role })
    
    if (!loading) {
      if (!user) {
        console.log('No user, redirecting to login')
        router.push('/auth/login')
        return
      } 
      
      if (user.profile?.role !== 'admin') {
        console.log('Non-admin user, redirecting to appropriate dashboard')
        // Redirect non-admin users to their appropriate dashboard
        if (user.profile?.role === 'officer') {
          router.push('/officer')
        } else {
          router.push('/dashboard')
        }
        return
      }
      
      console.log('Admin user authorized')
      setIsAuthorized(true)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-government-dark-blue border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this area.</p>
        </div>
      </div>
    )
  }

  return <DashboardLayout>{children}</DashboardLayout>
}