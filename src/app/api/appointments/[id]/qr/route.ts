import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { QRCodeService } from '@/lib/qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use service role key for QR generation since it's a secure operation
    // that should work for valid appointments regardless of session state
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('QR Code API GET - Using service role for appointment:', params.id)

    const appointmentId = params.id

    // Get appointment details - service role has full access
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
      console.log('QR Code API GET - Appointment not found:', { appointmentId, error: appointmentError })
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    console.log('QR Code API GET - Found appointment:', {
      id: appointment.id,
      reference: appointment.booking_reference,
      status: appointment.status,
      citizen: appointment.citizen?.full_name,
      service: appointment.service?.name
    })

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
    // Use service role key for QR generation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

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