import { useState } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'

interface SendNotificationParams {
  type: 'appointment_confirmation' | 'appointment_reminder' | 'appointment_cancelled' | 'document_status'
  appointmentId: string
  userId: string
  data?: {
    reason?: string
    documentName?: string
    status?: 'approved' | 'rejected'
    comments?: string
  }
}

interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

export function useNotifications() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()

  const sendNotification = async (params: SendNotificationParams): Promise<NotificationResult> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification')
      }

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.error
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const sendAppointmentConfirmation = async (appointmentId: string, userId: string) => {
    return sendNotification({
      type: 'appointment_confirmation',
      appointmentId,
      userId
    })
  }

  const sendAppointmentReminder = async (appointmentId: string, userId: string) => {
    return sendNotification({
      type: 'appointment_reminder',
      appointmentId,
      userId
    })
  }

  const sendAppointmentCancellation = async (appointmentId: string, userId: string, reason?: string) => {
    return sendNotification({
      type: 'appointment_cancelled',
      appointmentId,
      userId,
      data: { reason }
    })
  }

  const sendDocumentStatusUpdate = async (
    appointmentId: string, 
    userId: string, 
    documentName: string, 
    status: 'approved' | 'rejected',
    comments?: string
  ) => {
    return sendNotification({
      type: 'document_status',
      appointmentId,
      userId,
      data: {
        documentName,
        status,
        comments
      }
    })
  }

  const getNotificationHistory = async (userId?: string) => {
    try {
      const url = new URL('/api/notifications/send', window.location.origin)
      if (userId) {
        url.searchParams.set('userId', userId)
      }

      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch notifications')
      }

      return result.notifications
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications'
      setError(errorMessage)
      return []
    }
  }

  return {
    loading,
    error,
    sendNotification,
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    sendAppointmentCancellation,
    sendDocumentStatusUpdate,
    getNotificationHistory
  }
}

// Helper function to automatically send confirmation when appointment is booked
export async function sendAutoConfirmation(appointmentId: string, userId: string) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'appointment_confirmation',
        appointmentId,
        userId
      }),
    })

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Auto-confirmation failed:', error)
    return { success: false, error: 'Auto-confirmation failed' }
  }
}