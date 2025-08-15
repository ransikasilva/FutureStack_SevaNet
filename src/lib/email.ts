import nodemailer from 'nodemailer'

interface EmailData {
  to: string
  citizenName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  bookingReference: string
  department: string
  qrCodeDataUrl?: string
}

interface DocumentEmailData {
  to: string
  citizenName: string
  documentName: string
  status: 'approved' | 'rejected'
  officerComments?: string
  bookingReference: string
}

interface CancellationEmailData {
  to: string
  citizenName: string
  serviceName: string
  appointmentDate: string
  bookingReference: string
  reason?: string
}

interface ReminderEmailData {
  to: string
  citizenName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  bookingReference: string
  requiredDocuments: string[]
  qrCodeUrl?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private fromEmail: string
  private isEnabled: boolean = false

  constructor() {
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpFrom = process.env.SMTP_FROM

    if (!smtpUser || !smtpPass || !smtpHost) {
      console.warn('SMTP credentials not found. Email notifications will be disabled.')
      this.isEnabled = false
    } else {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      })
      this.isEnabled = true
      console.log(`Email service configured with SMTP: ${smtpHost}`)
    }
    
    this.fromEmail = smtpFrom || 'SevaNet <noreply@sevanet.gov.lk>'
  }

  async sendAppointmentConfirmation(data: EmailData) {
    try {
      if (!this.isEnabled || !this.transporter) {
        console.warn('Email service not configured, skipping email')
        return { success: false, error: 'Email service not configured' }
      }

      // Debug QR code data
      console.log('Email QR code debug:', {
        hasQrCode: !!data.qrCodeDataUrl,
        qrCodeLength: data.qrCodeDataUrl?.length,
        qrCodePrefix: data.qrCodeDataUrl?.substring(0, 50)
      })

      const mailOptions: any = {
        from: this.fromEmail,
        to: data.to,
        subject: `Appointment Confirmed - ${data.bookingReference}`,
        html: this.generateConfirmationEmail(data)
      }

      // Add QR code as attachment if available
      if (data.qrCodeDataUrl) {
        const base64Data = data.qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')
        mailOptions.attachments = [
          {
            filename: `qr-code-${data.bookingReference}.png`,
            content: base64Data,
            encoding: 'base64',
            cid: 'qr-code-image' // Content-ID for referencing in HTML
          }
        ]
      }

      const result = await this.transporter.sendMail(mailOptions)
      
      console.log('Email sent successfully:', result.messageId)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Email service error:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }

  async sendAppointmentReminder(data: ReminderEmailData) {
    try {
      if (!this.isEnabled || !this.transporter) {
        console.warn('Email service not configured, skipping email')
        return { success: false, error: 'Email service not configured' }
      }

      const mailOptions = {
        from: this.fromEmail,
        to: data.to,
        subject: `Appointment Reminder - Tomorrow at ${data.appointmentTime}`,
        html: this.generateReminderEmail(data)
      }

      const result = await this.transporter.sendMail(mailOptions)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Email service error:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }

  async sendDocumentStatusUpdate(data: DocumentEmailData) {
    try {
      if (!this.isEnabled || !this.transporter) {
        console.warn('Email service not configured, skipping email')
        return { success: false, error: 'Email service not configured' }
      }

      const subject = `Document ${data.status === 'approved' ? 'Approved' : 'Rejected'} - ${data.bookingReference}`
      
      const mailOptions = {
        from: this.fromEmail,
        to: data.to,
        subject,
        html: this.generateDocumentStatusEmail(data)
      }

      const result = await this.transporter.sendMail(mailOptions)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Email service error:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }

  async sendAppointmentCancellation(data: CancellationEmailData) {
    try {
      if (!this.isEnabled || !this.transporter) {
        console.warn('Email service not configured, skipping email')
        return { success: false, error: 'Email service not configured' }
      }

      const mailOptions = {
        from: this.fromEmail,
        to: data.to,
        subject: `Appointment Cancelled - ${data.bookingReference}`,
        html: this.generateCancellationEmail(data)
      }

      const result = await this.transporter.sendMail(mailOptions)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Email service error:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }

  private generateConfirmationEmail(data: EmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmed</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #003366, #0066cc); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .appointment-card { background: #f8f9fa; border-left: 4px solid #003366; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: bold; color: #003366; }
            .value { color: #333; }
            .qr-section { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; }
            .btn { display: inline-block; background: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏛️ SevaNet</h1>
                <h2>Appointment Confirmed!</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${data.citizenName}</strong>,</p>
                
                <p>Your appointment has been successfully confirmed. Please save this email for your records.</p>
                
                <div class="appointment-card">
                    <h3 style="margin-top: 0; color: #003366;">Appointment Details</h3>
                    <div class="detail-row">
                        <span class="label">Service:</span>
                        <span class="value">${data.serviceName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Department:</span>
                        <span class="value">${data.department}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Date:</span>
                        <span class="value">${data.appointmentDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Time:</span>
                        <span class="value">${data.appointmentTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Reference Number:</span>
                        <span class="value"><strong>${data.bookingReference}</strong></span>
                    </div>
                </div>

                <div class="qr-section">
                    <h4>📱 Show this QR code at your appointment</h4>
                    ${data.qrCodeDataUrl ? `
                      <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                        <!-- Try CID attachment first, then fallback to base64 -->
                        <img src="cid:qr-code-image" alt="Appointment QR Code" 
                             style="max-width: 200px; height: auto; border: 2px solid #E5E7EB; padding: 10px; border-radius: 8px; display: block; margin: 15px auto; background: white;"
                             onerror="this.src='${data.qrCodeDataUrl}'; this.onerror=null;" />
                        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 10px;">
                          Present this QR code at your appointment for quick verification
                        </p>
                        <p style="font-size: 10px; color: #0066cc; text-align: center; margin-top: 5px;">
                          📎 QR code is also attached to this email
                        </p>
                      </div>
                      <!-- Fallback base64 image -->
                      <div style="text-align: center; margin-top: 10px;">
                        <p style="font-size: 10px; color: #999;">
                          If QR code doesn't appear above, view the attached image or use reference: <strong>${data.bookingReference}</strong>
                        </p>
                      </div>
                    ` : `
                      <p style="font-size: 14px; color: #666;">
                        QR code will be available in your dashboard after booking confirmation
                      </p>
                    `}
                </div>

                <h3>📋 Important Instructions:</h3>
                <ul>
                    <li>Arrive 15 minutes before your scheduled time</li>
                    <li>Bring all required original documents</li>
                    <li>Present your NIC and this appointment confirmation</li>
                    <li>Download the SevaNet mobile app for easy access</li>
                </ul>

                <p>You will receive a reminder 24 hours before your appointment with a complete checklist of required documents.</p>

                <a href="https://sevanet.gov.lk/dashboard/appointments" class="btn">Manage Your Appointments</a>
            </div>
            
            <div class="footer">
                <p><strong>SevaNet - Government Services Portal</strong></p>
                <p>For support, visit <a href="https://sevanet.gov.lk">sevanet.gov.lk</a> or call 1919</p>
                <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateReminderEmail(data: ReminderEmailData): string {
    const docsList = data.requiredDocuments.length > 0 
      ? data.requiredDocuments.map(doc => `<li>${doc}</li>`).join('')
      : '<li>No specific documents required</li>'

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .reminder-card { background: #fff3cd; border-left: 4px solid #ff6b35; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .urgent { background: #fff3cd; border: 2px solid #ff6b35; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .checklist { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .btn { display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Appointment Reminder</h1>
                <h2>Your appointment is tomorrow!</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${data.citizenName}</strong>,</p>
                
                <div class="urgent">
                    <h3 style="margin: 0; color: #ff6b35;">📅 Tomorrow at ${data.appointmentTime}</h3>
                </div>
                
                <div class="reminder-card">
                    <h3 style="margin-top: 0;">Appointment Details</h3>
                    <p><strong>Service:</strong> ${data.serviceName}</p>
                    <p><strong>Date:</strong> ${data.appointmentDate}</p>
                    <p><strong>Time:</strong> ${data.appointmentTime}</p>
                    <p><strong>Reference:</strong> ${data.bookingReference}</p>
                </div>

                <div class="checklist">
                    <h3>📋 Required Documents Checklist</h3>
                    <p><strong>Please bring the following original documents:</strong></p>
                    <ul>
                        ${docsList}
                    </ul>
                    <p style="color: #666; font-size: 14px;"><em>Note: Photocopies are not acceptable. Original documents must be presented.</em></p>
                </div>

                <h3>⚡ Quick Reminders:</h3>
                <ul>
                    <li><strong>Arrive 15 minutes early</strong> for check-in</li>
                    <li>Bring your <strong>National Identity Card</strong></li>
                    <li>Have your <strong>appointment confirmation ready</strong></li>
                    <li>Check traffic conditions before leaving</li>
                </ul>

                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4>📱 Mobile App Tip:</h4>
                    <p>Download the SevaNet mobile app for faster check-in using QR codes!</p>
                </div>

                <a href="https://sevanet.gov.lk/dashboard/appointments" class="btn">View Appointment Details</a>
            </div>
            
            <div class="footer">
                <p><strong>SevaNet - Government Services Portal</strong></p>
                <p>Need to reschedule? Visit <a href="https://sevanet.gov.lk">sevanet.gov.lk</a> or call 1919</p>
                <p style="font-size: 12px; color: #999;">This is an automated reminder. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateDocumentStatusEmail(data: DocumentEmailData): string {
    const isApproved = data.status === 'approved'
    const statusColor = isApproved ? '#28a745' : '#dc3545'
    const statusText = isApproved ? 'APPROVED' : 'REJECTED'
    const icon = isApproved ? '✅' : '❌'

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document ${statusText}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .status-card { background: ${isApproved ? '#d4edda' : '#f8d7da'}; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${icon} Document ${statusText}</h1>
                <h2>Reference: ${data.bookingReference}</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${data.citizenName}</strong>,</p>
                
                <div class="status-card">
                    <h3 style="margin-top: 0;">Document Review Update</h3>
                    <p><strong>Document:</strong> ${data.documentName}</p>
                    <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
                    ${data.officerComments ? `<p><strong>Comments:</strong> ${data.officerComments}</p>` : ''}
                </div>

                ${isApproved ? `
                    <h3>✅ Great News!</h3>
                    <p>Your document has been approved and you're all set for your appointment. No further action is required for this document.</p>
                ` : `
                    <h3>📝 Action Required</h3>
                    <p>Your document requires corrections. Please upload a revised version through your SevaNet dashboard.</p>
                    <h4>Next Steps:</h4>
                    <ul>
                        <li>Review the officer's comments above</li>
                        <li>Make the necessary corrections</li>
                        <li>Upload the corrected document via your dashboard</li>
                        <li>Wait for re-approval before your appointment</li>
                    </ul>
                `}

                <a href="https://sevanet.gov.lk/dashboard/documents" class="btn">Manage Documents</a>
            </div>
            
            <div class="footer">
                <p><strong>SevaNet - Government Services Portal</strong></p>
                <p>For support, visit <a href="https://sevanet.gov.lk">sevanet.gov.lk</a> or call 1919</p>
                <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  private generateCancellationEmail(data: CancellationEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Cancelled</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
            .cancellation-card { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .btn { display: inline-block; background: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Appointment Cancelled</h1>
                <h2>Reference: ${data.bookingReference}</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${data.citizenName}</strong>,</p>
                
                <p>We regret to inform you that your appointment has been cancelled.</p>
                
                <div class="cancellation-card">
                    <h3 style="margin-top: 0;">Cancelled Appointment Details</h3>
                    <p><strong>Service:</strong> ${data.serviceName}</p>
                    <p><strong>Original Date:</strong> ${data.appointmentDate}</p>
                    <p><strong>Reference:</strong> ${data.bookingReference}</p>
                    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
                </div>

                <h3>🔄 What's Next?</h3>
                <ul>
                    <li><strong>Book a new appointment</strong> through your SevaNet dashboard</li>
                    <li>Choose from available time slots that work for your schedule</li>
                    <li>Your previously uploaded documents are still saved in your account</li>
                    <li>Contact us if you need assistance with rebooking</li>
                </ul>

                <p>We apologize for any inconvenience caused and appreciate your understanding.</p>

                <a href="https://sevanet.gov.lk/dashboard/book" class="btn">Book New Appointment</a>
            </div>
            
            <div class="footer">
                <p><strong>SevaNet - Government Services Portal</strong></p>
                <p>For support, visit <a href="https://sevanet.gov.lk">sevanet.gov.lk</a> or call 1919</p>
                <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `
  }
}

export const emailService = new EmailService()