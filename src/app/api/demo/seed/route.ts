import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify admin access
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('Creating demo data...')

    // 1. Get existing services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')

    if (servicesError) {
      throw servicesError
    }

    // 2. Create time slots for the next 30 days
    console.log('Creating time slots...')
    const timeSlots = []
    const today = new Date()
    
    for (let day = 1; day <= 30; day++) {
      const date = new Date(today)
      date.setDate(today.getDate() + day)
      
      // Skip Sundays
      if (date.getDay() === 0) continue
      
      // Create slots from 9 AM to 4 PM
      for (let hour = 9; hour < 16; hour++) {
        for (const service of services) {
          const startTime = new Date(date)
          startTime.setHours(hour, 0, 0, 0)
          
          const endTime = new Date(startTime)
          endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)

          timeSlots.push({
            service_id: service.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            max_appointments: Math.floor(Math.random() * 3) + 1, // 1-3 slots
            current_bookings: 0,
            is_available: true
          })
        }
      }
    }

    // Insert time slots in batches
    const batchSize = 100
    let totalSlots = 0
    for (let i = 0; i < timeSlots.length; i += batchSize) {
      const batch = timeSlots.slice(i, i + batchSize)
      const { error: slotError } = await supabase
        .from('time_slots')
        .insert(batch)

      if (slotError) {
        console.error('Error inserting time slots batch:', slotError)
      } else {
        totalSlots += batch.length
      }
    }

    // 3. Create demo appointments
    console.log('Creating demo appointments...')
    const { data: recentSlots } = await supabase
      .from('time_slots')
      .select('*')
      .limit(10)

    // Create a few demo appointments
    const demoAppointments = []
    if (recentSlots && recentSlots.length > 0) {
      for (let i = 0; i < Math.min(3, recentSlots.length); i++) {
        const slot = recentSlots[i]
        const statuses = ['pending', 'confirmed', 'completed']
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        
        demoAppointments.push({
          citizen_id: session.user.id, // Use current user as demo citizen
          service_id: slot.service_id,
          time_slot_id: slot.id,
          booking_reference: `DEMO${Date.now()}${i}`.slice(-8),
          status: randomStatus,
          notes: `Demo appointment ${i + 1}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert(demoAppointments)

      if (appointmentError) {
        console.error('Error creating demo appointments:', appointmentError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully',
      data: {
        timeSlots: totalSlots,
        appointments: demoAppointments.length,
        services: services.length
      }
    })

  } catch (error) {
    console.error('Demo data creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create demo data' },
      { status: 500 }
    )
  }
}

// Get demo data status
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get counts of existing data
    const [deptCount, servicesCount, slotsCount, appointmentsCount] = await Promise.all([
      supabase.from('departments').select('*', { count: 'exact', head: true }),
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('time_slots').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      departments: deptCount.count || 0,
      services: servicesCount.count || 0,
      timeSlots: slotsCount.count || 0,
      appointments: appointmentsCount.count || 0
    })

  } catch (error) {
    console.error('Failed to get demo data status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}