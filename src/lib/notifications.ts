import { Database } from './database.types'

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

interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
}

export class NotificationService {
  private notifyLkApiKey: string
  private notifyLkUserId: string
  private notifyLkSenderId: string

  constructor() {
    this.notifyLkApiKey = process.env.NOTIFY_LK_API_KEY || ''
    this.notifyLkUserId = process.env.NOTIFY_LK_USER_ID || ''
    this.notifyLkSenderId = process.env.NOTIFY_LK_SENDER_ID || 'SevaNet'
  }

  /**
   * Send SMS notification via Notify.lk
   */
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    try {
      if (!this.notifyLkApiKey || !this.notifyLkUserId) {
        console.warn('Notify.lk credentials not configured, skipping SMS')
        return { success: false, error: 'SMS service not configured' }
      }

      // Clean phone number (remove +94 and add 0 prefix if needed)
      const cleanPhone = this.formatSriLankanPhone(phone)

      const response = await fetch('https://app.notify.lk/api/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.notifyLkApiKey}`
        },
        body: JSON.stringify({
          user_id: this.notifyLkUserId,
          sender: this.notifyLkSenderId,
          to: cleanPhone,
          message: message
        })
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
      console.error('SMS sending error:', error)
      return {
        success: false,
        error: 'Failed to send SMS'
      }
    }
  }

  /**
   * Format Sri Lankan phone number for Notify.lk
   */
  private formatSriLankanPhone(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Handle different formats
    if (cleaned.startsWith('94')) {
      // Remove country code and add 0
      cleaned = '0' + cleaned.substring(2)
    } else if (cleaned.startsWith('+94')) {
      // Remove +94 and add 0
      cleaned = '0' + cleaned.substring(3)
    } else if (!cleaned.startsWith('0')) {
      // Add 0 prefix if missing
      cleaned = '0' + cleaned
    }
    
    return cleaned
  }

  /**
   * Send appointment confirmation notification
   */
  async sendAppointmentConfirmation(data: {
    phone: string
    citizenName: string
    serviceName: string
    appointmentDate: string
    appointmentTime: string
    bookingReference: string
    department: string
  }): Promise<SMSResponse> {
    const message = `Dear ${data.citizenName},

Your SevaNet appointment is confirmed!

Service: ${data.serviceName}
Department: ${data.department}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Reference: ${data.bookingReference}

Please bring all required documents. Visit sevanet.gov.lk to manage your appointment.

- SevaNet Team`

    return this.sendSMS(data.phone, message)
  }

  /**
   * Send appointment reminder (24 hours before)
   */
  async sendAppointmentReminder(data: {
    phone: string
    citizenName: string
    serviceName: string
    appointmentDate: string
    appointmentTime: string
    bookingReference: string
    requiredDocuments: string[]
  }): Promise<SMSResponse> {
    const docsList = data.requiredDocuments.length > 0 
      ? `\n\nRequired Documents:\n${data.requiredDocuments.map(doc => `• ${doc}`).join('\n')}`
      : ''

    const message = `Reminder: Your SevaNet appointment is tomorrow!

Service: ${data.serviceName}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Reference: ${data.bookingReference}${docsList}

Visit sevanet.gov.lk for details.

- SevaNet Team`

    return this.sendSMS(data.phone, message)
  }

  /**
   * Send document status update
   */
  async sendDocumentStatusUpdate(data: {
    phone: string
    citizenName: string
    documentName: string
    status: 'approved' | 'rejected'
    officerComments?: string
    bookingReference: string
  }): Promise<SMSResponse> {
    const statusText = data.status === 'approved' ? 'APPROVED' : 'REJECTED'
    const commentsText = data.officerComments 
      ? `\n\nComments: ${data.officerComments}`
      : ''

    const message = `Document Update - Ref: ${data.bookingReference}

Document: ${data.documentName}
Status: ${statusText}${commentsText}

${data.status === 'rejected' 
  ? 'Please upload a corrected document via SevaNet.' 
  : 'Your document has been approved.'}

- SevaNet Team`

    return this.sendSMS(data.phone, message)
  }

  /**
   * Send appointment cancellation notification
   */
  async sendAppointmentCancellation(data: {
    phone: string
    citizenName: string
    serviceName: string
    appointmentDate: string
    bookingReference: string
    reason?: string
  }): Promise<SMSResponse> {
    const reasonText = data.reason ? `\n\nReason: ${data.reason}` : ''

    const message = `Appointment Cancelled - Ref: ${data.bookingReference}

Service: ${data.serviceName}
Original Date: ${data.appointmentDate}${reasonText}

You can book a new appointment at sevanet.gov.lk

- SevaNet Team`

    return this.sendSMS(data.phone, message)
  }

  /**
   * Log notification to database
   */
  async logNotification(supabase: any, data: NotificationData & { 
    status: 'sent' | 'failed'
    smsMessageId?: string
    error?: string
  }) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          appointment_id: data.appointmentId,
          type: 'sms',
          title: data.title,
          message: data.message,
          status: data.status,
          sent_at: data.status === 'sent' ? new Date().toISOString() : null,
          metadata: {
            sms_message_id: data.smsMessageId,
            error: data.error,
            phone: data.recipientPhone
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