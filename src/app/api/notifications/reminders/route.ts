import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notificationService } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Calculate tomorrow's date range (24 hours from now)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0)
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)

    console.log('Checking for appointments between:', tomorrowStart.toISOString(), 'and', tomorrowEnd.toISOString())

    // Get all confirmed appointments for tomorrow
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services:service_id (
          name,
          required_documents,
          department_id,
          departments:department_id (name)
        ),
        citizens:citizen_id (
          full_name,
          phone,
          user_id
        ),
        time_slots:time_slot_id (
          start_time,
          end_time
        )
      `)
      .eq('status', 'confirmed')
      .gte('time_slots.start_time', tomorrowStart.toISOString())
      .lte('time_slots.start_time', tomorrowEnd.toISOString())

    if (error) {
      console.error('Failed to fetch appointments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    if (!appointments || appointments.length === 0) {
      console.log('No appointments found for tomorrow')
      return NextResponse.json({
        success: true,
        message: 'No appointments found for tomorrow',
        count: 0
      })
    }

    console.log(`Found ${appointments.length} appointments for tomorrow`)

    let sentCount = 0
    let failedCount = 0
    const results = []

    // Send reminder for each appointment
    for (const appointment of appointments) {
      try {
        const citizen = appointment.citizens
        const service = appointment.services
        const timeSlot = appointment.time_slots

        if (!citizen?.phone || !timeSlot?.start_time) {
          console.warn(`Skipping appointment ${appointment.id}: missing phone or time slot`)
          failedCount++
          continue
        }

        // Get citizen's email
        let citizenEmail = null
        if (citizen.user_id) {
          const { data: authUser } = await supabase.auth.admin.getUserById(citizen.user_id)
          citizenEmail = authUser.user?.email
        }

        const appointmentDate = new Date(timeSlot.start_time).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        const appointmentTime = new Date(timeSlot.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })

        // Send reminder notification
        const result = await notificationService.sendAppointmentReminder({
          phone: citizen.phone,
          email: citizenEmail || undefined,
          citizenName: citizen.full_name,
          serviceName: service.name,
          appointmentDate,
          appointmentTime,
          bookingReference: appointment.booking_reference,
          requiredDocuments: service.required_documents || []
        })

        // Log the notification
        await notificationService.logNotification(supabase, {
          userId: citizen.user_id,
          appointmentId: appointment.id,
          type: 'appointment_reminder',
          title: 'Appointment reminder notification',
          message: 'Automated 24-hour reminder sent',
          recipientPhone: citizen.phone,
          recipientEmail: citizenEmail || undefined,
          status: result.success ? 'sent' : 'failed',
          smsMessageId: result.smsResult?.messageId,
          emailMessageId: result.emailResult?.messageId,
          error: result.smsResult?.error || result.emailResult?.error
        })

        if (result.success) {
          sentCount++
          console.log(`Reminder sent successfully for appointment ${appointment.booking_reference}`)
        } else {
          failedCount++
          console.error(`Failed to send reminder for appointment ${appointment.booking_reference}:`, result.smsResult?.error || result.emailResult?.error)
        }

        results.push({
          appointmentId: appointment.id,
          bookingReference: appointment.booking_reference,
          citizenName: citizen.full_name,
          success: result.success,
          smsSuccess: result.smsResult?.success,
          emailSuccess: result.emailResult?.success,
          error: result.smsResult?.error || result.emailResult?.error
        })

      } catch (error) {
        console.error(`Error processing appointment ${appointment.id}:`, error)
        failedCount++
        results.push({
          appointmentId: appointment.id,
          bookingReference: appointment.booking_reference,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`Reminder job completed: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${appointments.length} appointments`,
      sentCount,
      failedCount,
      totalAppointments: appointments.length,
      results
    })

  } catch (error) {
    console.error('Reminder job error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

// GET endpoint to manually trigger reminder job (for testing)
export async function GET(request: NextRequest) {
  try {
    // Check for authorization header or API key for security
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'development-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Call the POST method to process reminders
    return POST(request)
  } catch (error) {
    console.error('Manual reminder trigger error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger reminders' },
      { status: 500 }
    )
  }
}