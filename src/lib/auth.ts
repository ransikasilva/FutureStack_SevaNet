import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  nic: string
  phone?: string
  address?: string
  date_of_birth?: string
  role: 'citizen' | 'officer' | 'admin'
  department_id?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

// Sign up with email and password
export async function signUp(email: string, password: string, userData: {
  full_name: string
  nic: string
  phone?: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.full_name,
        nic: userData.nic,
        phone: userData.phone,
      },
    },
  })

  if (error) throw error

  // If user was created successfully, create their profile
  if (data.user && !error) {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: data.user.id,
            full_name: userData.full_name,
            nic: userData.nic,
            phone: userData.phone || null,
            role: 'citizen',
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't throw here as the user account was created successfully
        // The profile can be created later when they log in
      }
    } catch (profileErr) {
      console.error('Failed to create profile:', profileErr)
    }
  }

  return data
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  console.log('SignIn called for:', email)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('Supabase signIn result:', { data: !!data, error })

  if (error) {
    console.error('Supabase signIn error:', error)
    throw error
  }
  
  console.log('SignIn successful, returning data')
  return data
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current user with profile
export async function getCurrentUser(): Promise<AuthUser | null> {
  console.log('getCurrentUser: Starting...')
  
  let user: any
  
  try {
    // Add timeout to prevent hanging
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getUser timeout')), 5000)
    )
    
    const { data } = await Promise.race([userPromise, timeoutPromise]) as any
    user = data.user
    console.log('getCurrentUser: Got user from auth:', !!user, user?.email)
  
    if (!user) {
      console.log('getCurrentUser: No user, returning null')
      return null
    }
  } catch (error) {
    console.error('getCurrentUser: Error getting user:', error)
    return null
  }

  // Get user profile
  console.log('getCurrentUser: Fetching profile for user_id:', user.id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  console.log('getCurrentUser: Profile query result:', { profile: !!profile, error: profileError?.code })

  // If profile doesn't exist, create one from user metadata
  if (profileError && profileError.code === 'PGRST116') {
    console.log('getCurrentUser: Profile not found, creating new one...')
    try {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            nic: user.user_metadata?.nic || '',
            phone: user.user_metadata?.phone || null,
            role: 'citizen',
            is_verified: user.email_confirmed_at ? true : false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      console.log('getCurrentUser: Profile creation result:', { newProfile: !!newProfile, createError })

      if (createError) {
        console.error('Failed to create profile:', createError)
        return { ...user, profile: undefined }
      }

      console.log('getCurrentUser: Returning user with new profile')
      return { ...user, profile: newProfile }
    } catch (err) {
      console.error('Profile creation failed:', err)
      return { ...user, profile: undefined }
    }
  }

  console.log('getCurrentUser: Returning user with existing profile')
  return {
    ...user,
    profile: profile || undefined
  }
}

// Get user profile by user ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// Update user profile
export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Reset password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) throw error
}

// Update password
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) throw error
}

// Check if user has specific role
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user?.profile) return false
  return roles.includes(user.profile.role)
}

// Check if user is admin
export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ['admin'])
}

// Check if user is officer
export function isOfficer(user: AuthUser | null): boolean {
  return hasRole(user, ['officer'])
}

// Check if user is citizen
export function isCitizen(user: AuthUser | null): boolean {
  return hasRole(user, ['citizen'])
}

// Validate NIC format
export function validateNIC(nic: string): boolean {
  const oldNIC = /^[0-9]{9}[vVxX]$/
  const newNIC = /^[0-9]{12}$/
  return oldNIC.test(nic) || newNIC.test(nic)
}

// Validate phone number (Sri Lankan format)
export function validatePhone(phone: string): boolean {
  const sriLankanPhone = /^(\+94|0)?[1-9][0-9]{8}$/
  return sriLankanPhone.test(phone.replace(/\s+/g, ''))
}