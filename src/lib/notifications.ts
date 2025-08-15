import { Database } from './database.types'
import { emailService } from './email'

type NotificationType = 'appointment_confirmation' | 'appointment_reminder' | 'document_status' | 'appointment_cancelled'

interface NotificationData {
  userId: string
  appointmentId?: string
  type: NotificationType
  title: string
  message: string
  recipientPhone?: string
  recipientEmail?: string
}

interface NotificationResponse {
  success: boolean
  messageId?: string
  error?: string
  smsResult?: SMSResponse
  emailResult?: SMSResponse | null
}

interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

export class NotificationService {
  // Text.lk configuration (preferred)
  private textLkApiToken: string
  private textLkSenderId: string
  
  // Notify.lk configuration (backup)
  private notifyLkApiKey: string
  private notifyLkUserId: string
  private notifyLkSenderId: string
  
  private smsProvider: 'text.lk' | 'notify.lk'

  constructor() {
    // Configure Text.lk (preferred)
    this.textLkApiToken = process.env.TEXT_LK_API_TOKEN || ''
    this.textLkSenderId = process.env.TEXT_LK_SENDER_ID || 'SevaNet'
    
    // Configure Notify.lk (backup)
    this.notifyLkApiKey = process.env.NOTIFY_LK_API_KEY || ''
    this.notifyLkUserId = process.env.NOTIFY_LK_USER_ID || ''
    this.notifyLkSenderId = process.env.NOTIFY_LK_SENDER_ID || 'SevaNet'
    
    // Choose SMS provider based on what's configured
    if (this.textLkApiToken) {
      this.smsProvider = 'text.lk'
      console.log('Using Text.lk SMS service')
    } else if (this.notifyLkApiKey && this.notifyLkUserId) {
      this.smsProvider = 'notify.lk'
      console.log('Using Notify.lk SMS service')
    } else {
      this.smsProvider = 'text.lk'
      console.warn('No SMS service configured')
    }
  }

  /**
   * Send SMS notification via Text.lk or Notify.lk
   */
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    if (this.smsProvider === 'text.lk') {
      return this.sendSMSViaTextLk(phone, message)
    } else {
      return this.sendSMSViaNotifyLk(phone, message)
    }
  }

  /**
   * Send SMS via Text.lk service
   */
  private async sendSMSViaTextLk(phone: string, message: string): Promise<SMSResponse> {
    try {
      if (!this.textLkApiToken) {
        console.warn('Text.lk API token not configured, skipping SMS')
        return { success: false, error: 'SMS service not configured' }
      }

      // Format phone number for Text.lk (expects 94XXXXXXXXX)
      const cleanPhone = this.formatSriLankanPhone(phone)

      const requestBody = {
        recipient: cleanPhone,
        sender_id: this.textLkSenderId,
        type: 'plain',
        message: message
      }
      
      console.log('Text.lk SMS Request:', {
        url: 'https://app.text.lk/api/v3/sms/send',
        headers: {
          'Authorization': `Bearer ${this.textLkApiToken.substring(0, 8)}...`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      const response = await fetch('https://app.text.lk/api/v3/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.textLkApiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      
      console.log('Text.lk SMS Response:', {
        status: response.status,
        ok: response.ok,
        body: result
      })

      if (response.ok && result.status === 'success') {
        return {
          success: true,
          messageId: result.data?.uid || result.data?.id
        }
      } else {
        return {
          success: false,
          error: result.message || 'SMS sending failed'
        }
      }
    } catch (error) {
      console.error('Text.lk SMS error:', error)
      return {
        success: false,
        error: 'Failed to send SMS via Text.lk'
      }
    }
  }

  /**
   * Send SMS via Notify.lk service (backup)
   */
  private async sendSMSViaNotifyLk(phone: string, message: string): Promise<SMSResponse> {
    try {
      if (!this.notifyLkApiKey || !this.notifyLkUserId) {
        console.warn('Notify.lk credentials not configured, skipping SMS')
        return { success: false, error: 'SMS service not configured' }
      }

      // Format phone number for Notify.lk
      const cleanPhone = this.formatSriLankanPhone(phone)

      const requestBody = {
        user_id: this.notifyLkUserId,
        api_key: this.notifyLkApiKey,
        sender: this.notifyLkSenderId,
        to: cleanPhone,
        message: message
      }

      const response = await fetch('https://app.notify.lk/api/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (response.ok && result.status === 'success') {
        return {
          success: true,
          messageId: result.data?.message_id
        }
      } else {
        return {
          success: false,
          error: result.message || 'SMS sending failed'
        }
      }
    } catch (error) {
      console.error('Notify.lk SMS error:', error)
      return {
        success: false,
        error: 'Failed to send SMS via Notify.lk'
      }
    }
  }

  /**
   * Format Sri Lankan phone number for Notify.lk (expects 94XXXXXXXXX format)
   */
  private formatSriLankanPhone(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Handle different formats and convert to 94XXXXXXXXX
    if (cleaned.startsWith('94')) {
      // Already has country code
      return cleaned
    } else if (cleaned.startsWith('0')) {
      // Remove 0 prefix and add 94
      return '94' + cleaned.substring(1)
    } else if (cleaned.startsWith('7')) {
      // Mobile number without 0 prefix, add 94
      return '94' + cleaned
    } else {
      // Unknown format, assume it's a local number and add 94
      return '94' + cleaned
    }
  }

  /**
   * Send appointment confirmation notification (both SMS and Email)
   */
  async sendAppointmentConfirmation(data: {
    phone: string
    email?: string
    citizenName: string
    serviceName: string
    appointmentDate: string
    appointmentTime: string
    bookingReference: string
    department: string
    appointmentId?: string
    qrCodeDataUrl?: string
  }): Promise<NotificationResponse> {
    const smsMessage = `📋 APPOINTMENT CONFIRMED - SevaNet

Dear ${data.citizenName},
Your government service appointment is confirmed!

🏛️ SERVICE DETAILS:
• Service: ${data.serviceName}
• Department: ${data.department}
• Reference: ${data.bookingReference}

📅 APPOINTMENT SCHEDULE:
• Date: ${data.appointmentDate}
• Time: ${data.appointmentTime}
• Duration: Approx. 30-45 minutes

📋 IMPORTANT REMINDERS:
• Arrive 15 minutes early
• Bring your NIC and all required documents
• QR code available in your SevaNet dashboard
• Download SevaNet app for faster check-in

🔗 Manage appointment: sevanet.gov.lk/dashboard
📞 Support: Call 1919

- SevaNet Portal Team`

    // Send SMS
    const smsResult = await this.sendSMS(data.phone, smsMessage)

    // Send Email if email address is provided
    let emailResult = null
    if (data.email) {
      emailResult = await emailService.sendAppointmentConfirmation({
        to: data.email,
        citizenName: data.citizenName,
        serviceName: data.serviceName,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        bookingReference: data.bookingReference,
        department: data.department,
        qrCodeDataUrl: data.qrCodeDataUrl
      })
    }

    return {
      success: smsResult.success || (emailResult?.success ?? false),
      smsResult,
      emailResult,
      messageId: smsResult.messageId || emailResult?.messageId
    }
  }

  /**
   * Send appointment reminder (24 hours before) - both SMS and Email
   */
  async sendAppointmentReminder(data: {
    phone: string
    email?: string
    citizenName: string
    serviceName: string
    appointmentDate: string
    appointmentTime: string
    bookingReference: string
    requiredDocuments: string[]
  }): Promise<NotificationResponse> {
    const docsList = data.requiredDocuments.length > 0 
      ? `\n\nRequired Documents:\n${data.requiredDocuments.map(doc => `• ${doc}`).join('\n')}`
      : ''

    const smsMessage = `⏰ APPOINTMENT REMINDER - SevaNet

Dear ${data.citizenName},
Your appointment is TOMORROW!

🏛️ SERVICE: ${data.serviceName}
📅 DATE: ${data.appointmentDate}
🕐 TIME: ${data.appointmentTime}
📋 REF: ${data.bookingReference}

${docsList}

✅ CHECKLIST FOR TOMORROW:
• Arrive 15 minutes early
• Bring original NIC
• Have your QR code ready (check app/dashboard)
• All required documents listed above

🚗 TRAFFIC TIP: Check road conditions before leaving

📱 Quick check-in: Use SevaNet app QR scanner
🔗 Dashboard: sevanet.gov.lk/dashboard
📞 Support: 1919

Ready for your visit? Reply YES to confirm.

- SevaNet Portal Team`

    // Send SMS
    const smsResult = await this.sendSMS(data.phone, smsMessage)

    // Send Email if email address is provided
    let emailResult = null
    if (data.email) {
      emailResult = await emailService.sendAppointmentReminder({
        to: data.email,
        citizenName: data.citizenName,
        serviceName: data.serviceName,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        bookingReference: data.bookingReference,
        requiredDocuments: data.requiredDocuments
      })
    }

    return {
      success: smsResult.success || (emailResult?.success ?? false),
      smsResult,
      emailResult,
      messageId: smsResult.messageId || emailResult?.messageId
    }
  }

  /**
   * Send document status update - both SMS and Email
   */
  async sendDocumentStatusUpdate(data: {
    phone: string
    email?: string
    citizenName: string
    documentName: string
    status: 'approved' | 'rejected'
    officerComments?: string
    bookingReference: string
  }): Promise<NotificationResponse> {
    const statusText = data.status === 'approved' ? 'APPROVED' : 'REJECTED'
    const commentsText = data.officerComments 
      ? `\n\nComments: ${data.officerComments}`
      : ''

    const statusEmoji = data.status === 'approved' ? '✅' : '❌'
    
    const smsMessage = `${statusEmoji} DOCUMENT ${statusText} - SevaNet

Dear ${data.citizenName},

📄 DOCUMENT: ${data.documentName}
📋 REF: ${data.bookingReference}
🏛️ STATUS: ${statusText}${commentsText}

${data.status === 'approved' 
  ? `✅ GREAT NEWS! Your document is approved.
• No further action needed for this document
• You're all set for your appointment
• Keep this confirmation for your records`
  : `❌ ACTION REQUIRED:
• Review officer comments above
• Upload corrected document via dashboard
• Resubmit before your appointment date
• Check SevaNet app for step-by-step guide`}

🔗 Upload documents: sevanet.gov.lk/dashboard/documents
📞 Need help? Call 1919

- SevaNet Portal Team`

    // Send SMS
    const smsResult = await this.sendSMS(data.phone, smsMessage)

    // Send Email if email address is provided
    let emailResult = null
    if (data.email) {
      emailResult = await emailService.sendDocumentStatusUpdate({
        to: data.email,
        citizenName: data.citizenName,
        documentName: data.documentName,
        status: data.status,
        officerComments: data.officerComments,
        bookingReference: data.bookingReference
      })
    }

    return {
      success: smsResult.success || (emailResult?.success ?? false),
      smsResult,
      emailResult,
      messageId: smsResult.messageId || emailResult?.messageId
    }
  }

  /**
   * Send appointment cancellation notification - both SMS and Email
   */
  async sendAppointmentCancellation(data: {
    phone: string
    email?: string
    citizenName: string
    serviceName: string
    appointmentDate: string
    bookingReference: string
    reason?: string
  }): Promise<NotificationResponse> {
    const reasonText = data.reason ? `\n\nReason: ${data.reason}` : ''

    const smsMessage = `❌ APPOINTMENT CANCELLED - SevaNet

Dear ${data.citizenName},
We regret to inform you that your appointment has been cancelled.

🏛️ CANCELLED APPOINTMENT:
• Service: ${data.serviceName}
• Original Date: ${data.appointmentDate}
• Reference: ${data.bookingReference}${reasonText}

🔄 NEXT STEPS:
• Book a new appointment via SevaNet dashboard
• Choose from available time slots
• Your uploaded documents are still saved
• No penalty fees apply

💡 BOOKING TIPS:
• Book early for preferred time slots
• Check document requirements beforehand
• Enable notifications for updates

🔗 Book now: sevanet.gov.lk/dashboard/book
📞 Support: Call 1919 for assistance

We apologize for any inconvenience caused.

- SevaNet Portal Team`

    // Send SMS
    const smsResult = await this.sendSMS(data.phone, smsMessage)

    // Send Email if email address is provided
    let emailResult = null
    if (data.email) {
      emailResult = await emailService.sendAppointmentCancellation({
        to: data.email,
        citizenName: data.citizenName,
        serviceName: data.serviceName,
        appointmentDate: data.appointmentDate,
        bookingReference: data.bookingReference,
        reason: data.reason
      })
    }

    return {
      success: smsResult.success || (emailResult?.success ?? false),
      smsResult,
      emailResult,
      messageId: smsResult.messageId || emailResult?.messageId
    }
  }

  /**
   * Log notification to database
   */
  async logNotification(supabase: any, data: NotificationData & { 
    status: 'sent' | 'failed'
    smsMessageId?: string
    emailMessageId?: string
    error?: string
  }) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          appointment_id: data.appointmentId,
          type: 'combined', // Both SMS and email
          title: data.title,
          message: data.message,
          status: data.status,
          sent_at: data.status === 'sent' ? new Date().toISOString() : null,
          metadata: {
            sms_message_id: data.smsMessageId,
            email_message_id: data.emailMessageId,
            error: data.error,
            phone: data.recipientPhone,
            email: data.recipientEmail
          }
        })

      if (error) {
        console.error('Failed to log notification:', error)
      }
    } catch (error) {
      console.error('Notification logging error:', error)
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService()

// Helper function to schedule reminder notifications
export function scheduleAppointmentReminder(appointmentDate: Date, reminderCallback: () => void) {
  const now = new Date()
  const reminderTime = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000) // 24 hours before
  
  if (reminderTime > now) {
    const delay = reminderTime.getTime() - now.getTime()
    setTimeout(reminderCallback, delay)
  }
}

// Message templates
export const SMS_TEMPLATES = {
  APPOINTMENT_CONFIRMATION: 'Your SevaNet appointment is confirmed! Service: {service}, Date: {date}, Time: {time}, Ref: {reference}',
  APPOINTMENT_REMINDER: 'Reminder: Your SevaNet appointment is tomorrow at {time}. Ref: {reference}. Bring required documents.',
  DOCUMENT_APPROVED: 'Document approved for appointment {reference}. You\'re all set for your visit!',
  DOCUMENT_REJECTED: 'Document rejected for appointment {reference}. Please upload corrected version. Comments: {comments}',
  APPOINTMENT_CANCELLED: 'Appointment {reference} has been cancelled. Reason: {reason}. Book new appointment at sevanet.gov.lk'
}