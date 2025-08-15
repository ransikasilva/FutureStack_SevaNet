'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Department {
  id: string
  name: string
  description: string
  address: string
  contact_phone: string
  contact_email: string
  working_hours: any
  is_active: boolean
}

export interface Service {
  id: string
  department_id: string
  name: string
  description: string
  duration_minutes: number
  required_documents: string[]
  service_fee: number
  prerequisites: string
  is_active: boolean
  department?: Department
}

export interface TimeSlot {
  id: string
  service_id: string
  officer_id: string
  start_time: string
  end_time: string
  max_appointments: number
  current_bookings: number
  is_available: boolean
}

export interface Appointment {
  id: string
  citizen_id: string
  service_id: string
  time_slot_id: string
  booking_reference: string
  qr_code: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  notes: string
  officer_notes: string
  created_at: string
  updated_at: string
  service?: Service
  time_slot?: TimeSlot
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        setDepartments(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDepartments()
  }, [])

  return { departments, loading, error }
}

export function useServices(departmentId?: string) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('services')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('is_active', true)

      if (departmentId) {
        query = query.eq('department_id', departmentId)
      }

      const { data, error } = await query.order('name')

      if (error) throw error
      setServices(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [departmentId])

  return { services, loading, error, refetch: fetchServices }
}

export function useTimeSlots(serviceId: string, date?: string) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serviceId) {
      setTimeSlots([])
      setLoading(false)
      return
    }

    const fetchTimeSlots = async () => {
      try {
        let query = supabase
          .from('time_slots')
          .select('*')
          .eq('service_id', serviceId)
          .eq('is_available', true)
          .gte('start_time', new Date().toISOString())

        if (date) {
          const startOfDay = new Date(date)
          const endOfDay = new Date(date)
          endOfDay.setDate(endOfDay.getDate() + 1)
          
          query = query
            .gte('start_time', startOfDay.toISOString())
            .lt('start_time', endOfDay.toISOString())
        }

        const { data, error } = await query
          .order('start_time')

        if (error) throw error
        
        // Filter available slots
        const availableSlots = (data || []).filter(
          slot => slot.current_bookings < slot.max_appointments
        )
        
        setTimeSlots(availableSlots)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTimeSlots()
  }, [serviceId, date])

  return { timeSlots, loading, error }
}

export function useUserAppointments(userId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAppointments = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(*),
          time_slot:time_slots(*)
        `)
        .eq('citizen_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAppointments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) return

    fetchAppointments()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('user_appointments')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `citizen_id=eq.${userId}`
        }, 
        () => {
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return { appointments, loading, error, refetch: fetchAppointments }
}

export async function bookAppointment(appointmentData: {
  citizen_id: string
  service_id: string
  time_slot_id: string
  notes?: string
}) {
  // Generate booking reference as fallback if DB function doesn't work
  const generateBookingRef = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const bookingRef = generateBookingRef()

  // Generate QR code data
  const qrData = {
    booking_reference: bookingRef,
    service_id: appointmentData.service_id,
    citizen_id: appointmentData.citizen_id,
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert([{
      ...appointmentData,
      booking_reference: bookingRef,
      qr_code: JSON.stringify(qrData)
    }])
    .select()
    .single()

  if (error) throw error

  // Update time slot booking count
  try {
    await supabase.rpc('increment_slot_bookings', {
      slot_id: appointmentData.time_slot_id
    })
  } catch (slotError) {
    console.warn('Failed to update slot count:', slotError)
    // Don't fail the booking if this fails
  }

  // Send automatic notification (SMS + Email)
  try {
    const notificationResponse = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'appointment_confirmation',
        appointmentId: data.id,
        userId: appointmentData.citizen_id
      }),
    })
    
    const notificationResult = await notificationResponse.json()
    
    if (notificationResult.success) {
      console.log('Notification sent successfully:', {
        sms: notificationResult.smsResult?.success,
        email: notificationResult.emailResult?.success
      })
    } else {
      console.warn('Notification failed:', notificationResult.error)
    }
  } catch (notificationError) {
    console.warn('Notification request failed:', notificationError)
    // Don't fail the booking if notification fails
  }

  return data
}

export async function cancelAppointment(appointmentId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) throw error
  return data
}