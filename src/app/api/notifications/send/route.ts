import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notificationService } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      'https://ileyyewqhyfclcfdlisg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZXl5ZXdxaHlmY2xjZmRsaXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzAzODUsImV4cCI6MjA3MDU0NjM4NX0.P3ytuf_q8Ua2ah7QA6U6QkV3RLOie6Q4x4dfTh6Zvs4',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, appointmentId, userId, data } = body

    // Validate required fields
    if (!type || !appointmentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, appointmentId, userId' },
        { status: 400 }
      )
    }

    // Get appointment details for notification
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        services:service_id (
          name,
          department_id,
          required_documents,
          departments:department_id (name)
        ),
        citizens:citizen_id (
          full_name,
          phone
        ),
        time_slots:time_slot_id (
          start_time,
          end_time
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const citizen = appointment.citizens
    const service = appointment.services
    const timeSlot = appointment.time_slots

    if (!citizen?.phone) {
      return NextResponse.json(
        { error: 'Citizen phone number not found' },
        { status: 400 }
      )
    }

    let smsResult
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

    // Send appropriate notification based on type
    switch (type) {
      case 'appointment_confirmation':
        smsResult = await notificationService.sendAppointmentConfirmation({
          phone: citizen.phone,
          citizenName: citizen.full_name,
          serviceName: service.name,
          appointmentDate,
          appointmentTime,
          bookingReference: appointment.booking_reference,
          department: service.departments.name
        })
        break

      case 'appointment_reminder':
        smsResult = await notificationService.sendAppointmentReminder({
          phone: citizen.phone,
          citizenName: citizen.full_name,
          serviceName: service.name,
          appointmentDate,
          appointmentTime,
          bookingReference: appointment.booking_reference,
          requiredDocuments: service.required_documents || []
        })
        break

      case 'appointment_cancelled':
        smsResult = await notificationService.sendAppointmentCancellation({
          phone: citizen.phone,
          citizenName: citizen.full_name,
          serviceName: service.name,
          appointmentDate,
          bookingReference: appointment.booking_reference,
          reason: data?.reason
        })
        break

      case 'document_status':
        if (!data?.documentName || !data?.status) {
          return NextResponse.json(
            { error: 'Document name and status required for document notifications' },
            { status: 400 }
          )
        }
        
        smsResult = await notificationService.sendDocumentStatusUpdate({
          phone: citizen.phone,
          citizenName: citizen.full_name,
          documentName: data.documentName,
          status: data.status,
          officerComments: data.comments,
          bookingReference: appointment.booking_reference
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    // Log notification to database
    await notificationService.logNotification(supabase, {
      userId,
      appointmentId,
      type,
      title: `${type.replace('_', ' ')} notification`,
      message: 'SMS notification sent',
      recipientPhone: citizen.phone,
      status: smsResult.success ? 'sent' : 'failed',
      smsMessageId: smsResult.messageId,
      error: smsResult.error
    })

    return NextResponse.json({
      success: smsResult.success,
      messageId: smsResult.messageId,
      error: smsResult.error
    })

  } catch (error) {
    console.error('Notification sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// Get notification history for a user
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      'https://ileyyewqhyfclcfdlisg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZXl5ZXdxaHlmY2xjZmRsaXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzAzODUsImV4cCI6MjA3MDU0NjM4NX0.P3ytuf_q8Ua2ah7QA6U6QkV3RLOie6Q4x4dfTh6Zvs4',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: notifications, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ notifications })

  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}