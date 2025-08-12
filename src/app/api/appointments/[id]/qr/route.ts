import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { QRCodeService } from '@/lib/qrcode'
import { Database } from '@/lib/database.types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointmentId = params.id

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        citizen:profiles!citizen_id (
          id,
          full_name,
          phone
        ),
        service:services (
          id,
          name,
          department:departments (
            name
          )
        ),
        time_slot:time_slots (
          start_time,
          end_time
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check if user has access to this appointment
    const userProfile = await supabase
      .from('profiles')
      .select('id, role, department_id')
      .eq('user_id', session.user.id)
      .single()

    if (userProfile.error) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Authorization check
    const canAccess = 
      userProfile.data.id === appointment.citizen_id || // Citizen owns the appointment
      userProfile.data.role === 'officer' || // Officer can view department appointments
      userProfile.data.role === 'admin' // Admin can view all

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prepare QR code data
    const appointmentDate = new Date(appointment.time_slot.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const appointmentTime = new Date(appointment.time_slot.start_time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const qrData = {
      appointmentId: appointment.id,
      bookingReference: appointment.booking_reference,
      citizenId: appointment.citizen.id,
      serviceId: appointment.service.id,
      appointmentDate,
      appointmentTime,
      departmentName: appointment.service.department.name,
      serviceName: appointment.service.name,
      citizenName: appointment.citizen.full_name,
      citizenPhone: appointment.citizen.phone || '',
      status: appointment.status,
      generatedAt: new Date().toISOString()
    }

    // Generate QR code
    const qrCodeDataURL = await QRCodeService.generateAppointmentQR(qrData)

    // Update appointment with QR code if not already present
    if (!appointment.qr_code) {
      await supabase
        .from('appointments')
        .update({ qr_code: qrCodeDataURL })
        .eq('id', appointmentId)
    }

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      appointmentDetails: {
        bookingReference: appointment.booking_reference,
        citizenName: appointment.citizen.full_name,
        serviceName: appointment.service.name,
        departmentName: appointment.service.department.name,
        appointmentDate,
        appointmentTime,
        status: appointment.status
      }
    })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointmentId = params.id
    const { type } = await request.json()

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    let qrCodeDataURL: string

    switch (type) {
      case 'simple':
        qrCodeDataURL = await QRCodeService.generateSimpleQR(appointment.booking_reference)
        break
      case 'verification':
        qrCodeDataURL = await QRCodeService.generateVerificationQR(appointmentId, appointment.booking_reference)
        break
      default:
        return NextResponse.json({ error: 'Invalid QR type' }, { status: 400 })
    }

    return NextResponse.json({ qrCode: qrCodeDataURL })

  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}