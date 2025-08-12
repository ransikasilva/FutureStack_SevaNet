'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/auth/AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  allowedRoles,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    if (allowedRoles && user?.profile && !allowedRoles.includes(user.profile.role)) {
      // Redirect based on user role
      switch (user.profile.role) {
        case 'admin':
          router.push('/admin')
          break
        case 'officer':
          router.push('/officer')
          break
        case 'citizen':
        default:
          router.push('/dashboard')
          break
      }
      return
    }
  }, [user, loading, requireAuth, allowedRoles, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (allowedRoles && user?.profile && !allowedRoles.includes(user.profile.role)) {
    return null
  }

  return <>{children}</>
}