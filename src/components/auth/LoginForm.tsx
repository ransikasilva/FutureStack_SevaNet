'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function LoginForm({ onSuccess, redirectTo = '/dashboard' }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')

    try {
      console.log('Attempting login for:', email)
      const result = await signIn(email, password)
      console.log('Login successful:', result)
      
      onSuccess?.()
      
      // Get user profile to determine role-based redirect
      let finalRedirectTo = redirectTo
      if (result.user) {
        console.log('Login - User ID:', result.user.id, 'Email:', result.user.email)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('user_id', result.user.id)
            .single()
          
          console.log('Login - Profile query result:', { profile, profileError })
          
          if (profile?.role) {
            console.log('Login - User role detected:', profile.role)
            switch (profile.role) {
              case 'admin':
                finalRedirectTo = '/admin'
                console.log('Login - Redirecting admin to /admin')
                break
              case 'officer':
                finalRedirectTo = '/officer'
                console.log('Login - Redirecting officer to /officer')
                break
              default: // citizen
                finalRedirectTo = '/dashboard'
                console.log('Login - Redirecting citizen to /dashboard')
                break
            }
          } else {
            console.log('Login - No role found in profile, using default redirect')
          }
        } catch (profileError) {
          console.error('Failed to get user profile:', profileError)
          // Use default redirect if profile fetch fails
        }
      }
      
      console.log('Login - Final redirect URL:', finalRedirectTo)
      
      // Add a small delay before redirect to ensure state is updated
      setTimeout(() => {
        router.push(finalRedirectTo)
      }, 100)
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-government-dark-blue focus:border-government-dark-blue"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-government-dark-blue focus:border-government-dark-blue"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-government-dark-blue focus:ring-government-dark-blue border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <a
            href="/auth/forgot-password"
            className="font-medium text-government-dark-blue hover:text-blue-700 underline"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-government-dark-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-dark-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </div>
    </form>
  )
}