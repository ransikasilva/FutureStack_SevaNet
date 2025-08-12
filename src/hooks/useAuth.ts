'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthUser } from '@/lib/auth'
import { Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      console.log('Getting initial session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Initial session result:', !!session)
      setSession(session)
      
      if (session?.user) {
        console.log('Found initial session, getting profile directly...')
        try {
          // Get user profile directly using session user with timeout
          console.log('Fetching initial profile for user_id:', session.user.id)
          
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Initial profile query timeout')), 3000)
          )
          
          const { data: profile, error: profileError } = await Promise.race([
            profilePromise, 
            timeoutPromise
          ]) as any
          
          console.log('Initial profile query result:', { profile: !!profile, error: profileError?.code, errorMessage: profileError?.message })

          const userWithProfile = {
            ...session.user,
            profile: profile || undefined
          }
          
          console.log('Setting initial user with profile:', userWithProfile.profile?.role)
          setUser(userWithProfile)
        } catch (error) {
          console.error('Initial profile fetch error:', error)
          setUser({ ...session.user, profile: undefined })
        }
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session)
        setSession(session)
        
        if (session?.user) {
          console.log('Getting profile for user:', session.user.email)
          
          try {
            // Get user profile directly using session user with timeout
            console.log('Fetching profile for user_id:', session.user.id)
            
            // Try a simple test query first
            console.log('Testing basic Supabase connection...')
            const testPromise = supabase.from('profiles').select('count').limit(1)
            const testTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Test query timeout')), 2000)
            )
            
            try {
              await Promise.race([testPromise, testTimeoutPromise])
              console.log('Basic connection test passed')
            } catch (testError) {
              console.error('Basic connection test failed:', testError)
              throw testError
            }
            
            // Now try the actual profile query
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile query timeout')), 5000)
            )
            
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise, 
              timeoutPromise
            ]) as any
            
            console.log('Profile query result:', { profile: !!profile, error: profileError?.code, errorMessage: profileError?.message })

            const userWithProfile = {
              ...session.user,
              profile: profile || undefined
            }
            
            console.log('Setting user with profile:', userWithProfile.profile?.role)
            setUser(userWithProfile)
          } catch (error) {
            console.error('Profile fetch error:', error)
            setUser({ ...session.user, profile: undefined })
          }
        } else {
          console.log('No session, clearing user')
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.profile?.role === 'admin',
    isOfficer: user?.profile?.role === 'officer',
    isCitizen: user?.profile?.role === 'citizen',
  }
}