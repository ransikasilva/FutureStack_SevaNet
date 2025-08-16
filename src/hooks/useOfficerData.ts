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
        console.log('Fetching appointments for department:', departmentId)
        
        // Use the same working pattern as the appointments page
        let query = supabase
          .from('appointments')
          .select(`
            *,
            services!inner(
              id, name, description, duration_minutes, required_documents, department_id
            )
          `)
          .eq('services.department_id', departmentId)
          .order('created_at', { ascending: false })

        // Remove officer filter for now to see all department appointments
        // if (officerId) {
        //   query = query.eq('time_slots.officer_id', officerId)
        // }

        const { data, error } = await query

        console.log('Appointments query result:', { 
          data, 
          error, 
          count: data?.length,
          departmentId,
          queryUrl: query.toString()
        })

        if (error) {
          console.error('Query error details:', error)
          throw error
        }

        // Enhance appointments with real citizen data and time slots
        const appointmentsWithDocs = await Promise.all(
          (data || []).map(async (appointment) => {
            // Get real citizen data
            const { data: citizenData } = await supabase
              .from('profiles')
              .select('id, full_name, phone, nic')
              .eq('id', appointment.citizen_id)
              .single()

            // Get time slot data if time_slot_id exists
            let timeSlotData = null
            if (appointment.time_slot_id) {
              const { data: timeSlot } = await supabase
                .from('time_slots')
                .select('id, start_time, end_time')
                .eq('id', appointment.time_slot_id)
                .single()
              timeSlotData = timeSlot
            }

            return {
              ...appointment,
              service: appointment.services,
              citizen: citizenData || { 
                id: appointment.citizen_id,
                full_name: 'Unknown Citizen', 
                phone: 'N/A',
                nic: 'N/A'
              },
              time_slot: timeSlotData || { 
                start_time: appointment.created_at,
                end_time: appointment.created_at
              },
              documents: [] // Will be populated separately if needed
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

export function useTodaysSchedule(departmentId: string) {
  const [schedule, setSchedule] = useState<OfficerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!departmentId) return

    const fetchTodaysSchedule = async () => {
      try {
        console.log('Fetching schedule for department:', departmentId)

        // Get appointments for this department first
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            *,
            services!inner(
              id, name, department_id
            )
          `)
          .eq('services.department_id', departmentId)
          .order('created_at', { ascending: false })

        if (appointmentsError) {
          console.error('Appointments query error:', appointmentsError)
          throw appointmentsError
        }

        console.log('Schedule raw appointments:', appointments?.length)

        // Enhance with citizen data and time slots
        const scheduleWithDetails = await Promise.all(
          (appointments || []).map(async (appointment) => {
            // Get citizen data
            const { data: citizenData } = await supabase
              .from('profiles')
              .select('id, full_name, phone, nic')
              .eq('id', appointment.citizen_id)
              .single()

            // Get time slot data if time_slot_id exists
            let timeSlotData = null
            if (appointment.time_slot_id) {
              const { data: timeSlot } = await supabase
                .from('time_slots')
                .select('id, start_time, end_time')
                .eq('id', appointment.time_slot_id)
                .single()
              timeSlotData = timeSlot
            }

            return {
              ...appointment,
              service: appointment.services,
              citizen: citizenData || { 
                id: appointment.citizen_id,
                full_name: 'Unknown Citizen', 
                phone: 'N/A',
                nic: 'N/A'
              },
              time_slot: timeSlotData || { 
                start_time: appointment.created_at,
                end_time: appointment.created_at
              },
              documents: []
            }
          })
        )

        // Sort by time slot start time (appointments with actual time slots first)
        const sortedSchedule = scheduleWithDetails.sort((a, b) => {
          const aTime = a.time_slot?.start_time || a.created_at
          const bTime = b.time_slot?.start_time || b.created_at
          return new Date(aTime).getTime() - new Date(bTime).getTime()
        })

        console.log('Enhanced schedule:', sortedSchedule.length)
        setSchedule(sortedSchedule)
      } catch (err: any) {
        console.error('Failed to fetch schedule:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTodaysSchedule()
  }, [departmentId])

  return { schedule, loading, error }
}