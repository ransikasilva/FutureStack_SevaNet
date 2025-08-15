'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'

// Backend API base URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export interface Issue {
  id: string
  user_id: string
  category: string
  title?: string
  description: string
  location: string
  image_url?: string
  status: 'pending' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
  severity_level: 1 | 2 | 3 | 4
  assigned_authority_id?: string
  booking_reference?: string
  created_at: string
  updated_at: string
  assigned_authority?: string
  estimated_completion?: string
}

export interface IssueCategory {
  name: string
  description: string
  icon: string
}

export interface Authority {
  id: string
  name: string
  department: string
  category: string
  contact_phone: string
  contact_email: string
  emergency_contact: string
  is_emergency_service: boolean
  coverage_area: string
}

export interface AIAnalysisResult {
  detected_issue: string
  category: string
  description: string
  severity_level: number
  confidence_score: number
  recommended_authority: Authority
  analysis_details: any
  suggested_location?: string
}

// Hook for managing user's reported issues
export function useUserIssues(userId?: string) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUserIssues(userId)
    }
  }, [userId])

  const fetchUserIssues = async (userIdParam: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_API_URL}/api/v1/issues/my-reports/${userIdParam}`)
      const data = await response.json()
      
      if (data.success) {
        setIssues(data.reports || [])
      } else {
        setError('Failed to fetch issues')
      }
    } catch (err) {
      console.error('Failed to fetch user issues:', err)
      setError('Failed to fetch issues')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    if (userId) {
      fetchUserIssues(userId)
    }
  }

  return { issues, loading, error, refetch }
}

// Hook for getting issue categories
export function useIssueCategories() {
  const [categories, setCategories] = useState<IssueCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${BACKEND_API_URL}/api/v1/issues/categories`)
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories || [])
      } else {
        setError('Failed to fetch categories')
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  return { categories, loading, error }
}

// Hook for getting authorities
export function useAuthorities(category?: string) {
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAuthorities(category)
  }, [category])

  const fetchAuthorities = async (categoryParam?: string) => {
    try {
      setLoading(true)
      const url = categoryParam 
        ? `${BACKEND_API_URL}/api/v1/issues/authorities?category=${categoryParam}`
        : `${BACKEND_API_URL}/api/v1/issues/authorities`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setAuthorities(data.authorities || [])
      } else {
        setError('Failed to fetch authorities')
      }
    } catch (err) {
      console.error('Failed to fetch authorities:', err)
      setError('Failed to fetch authorities')
    } finally {
      setLoading(false)
    }
  }

  return { authorities, loading, error }
}

// Function to report a new issue
export async function reportIssue(formData: FormData): Promise<{ success: boolean; issue?: Issue; message?: string }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/issues/report`, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    
    if (data.success) {
      return { success: true, issue: data.issue, message: data.message }
    } else {
      return { success: false, message: data.message || 'Failed to report issue' }
    }
  } catch (error) {
    console.error('Failed to report issue:', error)
    return { success: false, message: 'Failed to report issue' }
  }
}

// Function to analyze image with AI
export async function analyzeImageWithAI(
  image: File, 
  location?: string, 
  latitude?: number, 
  longitude?: number
): Promise<{ success: boolean; analysis?: AIAnalysisResult; message?: string }> {
  try {
    const formData = new FormData()
    formData.append('image', image)
    if (location) formData.append('address', location)
    if (latitude) formData.append('latitude', latitude.toString())
    if (longitude) formData.append('longitude', longitude.toString())

    const response = await fetch(`${BACKEND_API_URL}/api/v1/issues/analyze-image`, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()
    
    if (data.success) {
      return { success: true, analysis: data.analysis, message: data.message }
    } else {
      return { success: false, message: data.message || 'Failed to analyze image' }
    }
  } catch (error) {
    console.error('Failed to analyze image:', error)
    return { success: false, message: 'Failed to analyze image' }
  }
}

// Function to get issue status
export async function getIssueStatus(issueId: string): Promise<{ success: boolean; status?: any; message?: string }> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/issues/${issueId}/status`)
    const data = await response.json()
    
    if (data.success) {
      return { success: true, status: data.status, message: data.message }
    } else {
      return { success: false, message: data.message || 'Failed to get issue status' }
    }
  } catch (error) {
    console.error('Failed to get issue status:', error)
    return { success: false, message: 'Failed to get issue status' }
  }
}

// Function to update issue status (for officers)
export async function updateIssueStatus(
  issueId: string, 
  status: string, 
  note?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const formData = new FormData()
    formData.append('status', status)
    if (note) formData.append('note', note)

    const response = await fetch(`${BACKEND_API_URL}/api/v1/issues/${issueId}/update`, {
      method: 'PUT',
      body: formData
    })

    const data = await response.json()
    
    if (data.success) {
      return { success: true, message: data.message }
    } else {
      return { success: false, message: data.message || 'Failed to update issue status' }
    }
  } catch (error) {
    console.error('Failed to update issue status:', error)
    return { success: false, message: 'Failed to update issue status' }
  }
}

// Hook for officers to get department issues
export function useDepartmentIssues(departmentId?: string, category?: string) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (departmentId || category) {
      fetchDepartmentIssues()
    }
  }, [departmentId, category])

  const fetchDepartmentIssues = async () => {
    try {
      setLoading(true)
      // For now, we'll use mock data since the backend doesn't have department-specific filtering yet
      // In a real implementation, this would call a backend endpoint that filters by department
      const response = await fetch(`${BACKEND_API_URL}/api/v1/issues/categories`)
      const data = await response.json()
      
      // Mock department issues - in production this would be a proper API endpoint
      setIssues([])
    } catch (err) {
      console.error('Failed to fetch department issues:', err)
      setError('Failed to fetch department issues')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchDepartmentIssues()
  }

  return { issues, loading, error, refetch }
}