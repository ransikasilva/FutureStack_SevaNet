'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface OfficerAppointment {
  id: string
  citizen_id: string
  service_id: string
  time_slot_id: string
  booking_reference: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes: string
  officer_notes: string
  created_at: string
  updated_at: string
  citizen?: {
    id: string
    full_name: string
    nic: string
    phone: string
  }
  service?: {
    id: string
    name: string
    description: string
    duration_minutes: number
    required_documents: string[]
  }
  time_slot?: {
    id: string
    start_time: string
    end_time: string
  }
  documents?: any[]
}

export function useOfficerAppointments(departmentId: string, officerId?: string) {
  const [appointments, setAppointments] = useState<OfficerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!departmentId) return

    const fetchAppointments = async () => {
      try {
        let query = supabase
          .from('appointments')
          .select(`
            *,
            citizen:profiles!appointments_citizen_id_fkey(
              id, full_name, nic, phone
            ),
            service:services(
              id, name, description, duration_minutes, required_documents
            ),
            time_slot:time_slots(
              id, start_time, end_time
            )
          `)
          .eq('service.department_id', departmentId)
          .order('time_slot.start_time', { ascending: true })

        if (officerId) {
          query = query.eq('time_slot.officer_id', officerId)
        }

        const { data, error } = await query

        if (error) throw error

        // Fetch documents for each appointment
        const appointmentsWithDocs = await Promise.all(
          (data || []).map(async (appointment) => {
            const { data: documents } = await supabase
              .from('documents')
              .select('*')
              .eq('appointment_id', appointment.id)
              .order('uploaded_at', { ascending: false })

            return {
              ...appointment,
              documents: documents || []
            }
          })
        )

        setAppointments(appointmentsWithDocs)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('officer_appointments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments' 
        }, 
        () => {
          fetchAppointments()
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents' 
        }, 
        () => {
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [departmentId, officerId])

  const refetch = () => {
    setLoading(true)
    setError(null)
    // This will trigger the useEffect
  }

  return { appointments, loading, error, refetch }
}

export async function updateAppointmentStatus(
  appointmentId: string, 
  status: string, 
  officerNotes?: string
) {
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  }
  
  if (officerNotes) {
    updateData.officer_notes = officerNotes
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function reviewDocument(
  documentId: string,
  status: 'approved' | 'rejected',
  comments?: string
) {
  const { data, error } = await supabase
    .from('documents')
    .update({
      status,
      officer_comments: comments || null
    })
    .eq('id', documentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function useDepartmentStats(departmentId: string) {
  const [stats, setStats] = useState({
    total_appointments: 0,
    pending_appointments: 0,
    confirmed_appointments: 0,
    completed_appointments: 0,
    pending_documents: 0,
    total_documents: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!departmentId) return

    const fetchStats = async () => {
      try {
        // Get appointment counts
        const { data: appointmentCounts, error: appointmentError } = await supabase
          .rpc('get_department_appointment_stats', { dept_id: departmentId })

        if (appointmentError) {
          // Fallback to manual queries if RPC doesn't exist
          const today = new Date().toISOString().split('T')[0]
          
          const { count: totalAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('service.department_id', departmentId)

          const { count: pendingAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('service.department_id', departmentId)
            .eq('status', 'pending')

          const { count: confirmedAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('service.department_id', departmentId)
            .eq('status', 'confirmed')

          const { count: completedAppointments } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('service.department_id', departmentId)
            .eq('status', 'completed')

          setStats({
            total_appointments: totalAppointments || 0,
            pending_appointments: pendingAppointments || 0,
            confirmed_appointments: confirmedAppointments || 0,
            completed_appointments: completedAppointments || 0,
            pending_documents: 0, // Will implement later
            total_documents: 0 // Will implement later
          })
        } else {
          setStats(appointmentCounts[0] || stats)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [departmentId])

  return { stats, loading, error }
}

export function useTodaysSchedule(officerId: string) {
  const [schedule, setSchedule] = useState<OfficerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!officerId) return

    const fetchTodaysSchedule = async () => {
      try {
        const today = new Date()
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            citizen:profiles!appointments_citizen_id_fkey(
              id, full_name, nic, phone
            ),
            service:services(
              id, name, description, duration_minutes
            ),
            time_slot:time_slots(
              id, start_time, end_time
            )
          `)
          .eq('time_slot.officer_id', officerId)
          .gte('time_slot.start_time', startOfDay)
          .lte('time_slot.start_time', endOfDay)
          .order('time_slot.start_time', { ascending: true })

        if (error) throw error
        setSchedule(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTodaysSchedule()
  }, [officerId])

  return { schedule, loading, error }
}