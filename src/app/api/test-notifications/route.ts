import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notifications'
import { QRCodeService } from '@/lib/qrcode'

export async function POST(request: NextRequest) {
  try {
    const { phone = '0777876698', email = 'ransikasilva03.22@gmail.com' } = await request.json()
    
    console.log('Testing SMS notification to:', phone)
    
    // Test SMS directly
    const smsResult = await notificationService.sendSMS(phone, 
      `🧪 TEST SMS from SevaNet Portal

Service: Passport Application Test
Date: Friday, August 15, 2025
Time: 10:00 AM
Reference: TEST123

This is a test message to verify SMS functionality works properly.

- SevaNet Team`)
    
    // Generate QR code for test
    let qrCodeDataUrl = null
    try {
      const testQrData = {
        appointmentId: 'TEST-APPT-123',
        bookingReference: 'TEST123',
        citizenId: 'TEST-CITIZEN-123',
        serviceId: 'TEST-SERVICE-123',
        appointmentDate: 'Friday, August 15, 2025',
        appointmentTime: '10:00 AM',
        departmentName: 'Department of Immigration & Emigration',
        serviceName: 'Passport Application',
        citizenName: 'John Doe Test',
        citizenPhone: phone,
        status: 'pending',
        generatedAt: new Date().toISOString()
      }
      qrCodeDataUrl = await QRCodeService.generateAppointmentQR(testQrData)
      console.log('Test QR code generated successfully')
    } catch (qrError) {
      console.warn('Test QR code generation failed:', qrError)
    }

    // Test appointment confirmation (SMS + Email)
    const confirmationResult = await notificationService.sendAppointmentConfirmation({
      phone,
      email: email, // Now includes email
      citizenName: 'John Doe Test',
      serviceName: 'Passport Application',
      appointmentDate: 'Friday, August 15, 2025', 
      appointmentTime: '10:00 AM',
      bookingReference: 'TEST123',
      department: 'Department of Immigration & Emigration',
      appointmentId: 'TEST-APPT-123',
      qrCodeDataUrl: qrCodeDataUrl || undefined
    })
    
    return NextResponse.json({
      success: true,
      results: {
        directSMS: {
          success: smsResult.success,
          messageId: smsResult.messageId,
          error: smsResult.error
        },
        appointmentConfirmation: {
          success: confirmationResult.success,
          smsSuccess: confirmationResult.smsResult?.success,
          emailSuccess: confirmationResult.emailResult?.success,
          smsMessageId: confirmationResult.smsResult?.messageId,
          smsError: confirmationResult.smsResult?.error,
          emailError: confirmationResult.emailResult?.error
        }
      }
    })
    
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { error: 'Failed to test notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SMS Test Endpoint',
    usage: 'POST to this endpoint with {"phone": "0777876698"} to test SMS notifications',
    environment: {
      notifyLkConfigured: !!(process.env.NOTIFY_LK_API_KEY && process.env.NOTIFY_LK_USER_ID),
      resendConfigured: !!process.env.RESEND_API_KEY
    }
  })
}