'use client'

import { useState, useEffect } from 'react'
import { Download, Printer, RefreshCw, QrCode } from 'lucide-react'
import { downloadQRCode, printQRCode } from '@/lib/qrcode'

interface QRCodeDisplayProps {
  appointmentId: string
  bookingReference?: string
  size?: 'sm' | 'md' | 'lg'
  showActions?: boolean
  className?: string
}

interface AppointmentDetails {
  bookingReference: string
  citizenName: string
  serviceName: string
  departmentName: string
  appointmentDate: string
  appointmentTime: string
  status: string
}

export function QRCodeDisplay({ 
  appointmentId, 
  bookingReference,
  size = 'md',
  showActions = true,
  className = ''
}: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  }

  useEffect(() => {
    if (appointmentId) {
      generateQRCode()
    }
  }, [appointmentId])

  const generateQRCode = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('QRCodeDisplay - Generating QR for appointment:', appointmentId)
      const response = await fetch(`/api/appointments/${appointmentId}/qr`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      console.log('QRCodeDisplay - API response:', { 
        status: response.status, 
        statusText: response.statusText,
        url: response.url
      })
      
      const data = await response.json()
      console.log('QRCodeDisplay - Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR code')
      }

      setQrCode(data.qrCode)
      setAppointmentDetails(data.appointmentDetails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (qrCode && appointmentDetails) {
      downloadQRCode(qrCode, `sevanet-${appointmentDetails.bookingReference}.png`)
    }
  }

  const handlePrint = () => {
    if (qrCode && appointmentDetails) {
      printQRCode(qrCode, appointmentDetails)
    }
  }

  const handleRefresh = () => {
    generateQRCode()
  }

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
        <p className="text-sm text-gray-600">Generating QR code...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-red-50 ${className}`}>
        <QrCode className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-red-600 text-center mb-3">{error}</p>
        <button
          onClick={handleRefresh}
          className="btn-secondary text-sm"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </button>
      </div>
    )
  }

  if (!qrCode) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 border border-gray-200 rounded-lg ${className}`}>
        <QrCode className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">QR code not available</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center p-6 border border-gray-200 rounded-lg bg-white ${className}`}>
      {/* QR Code Image */}
      <div className={`${sizeClasses[size]} flex items-center justify-center mb-4`}>
        <img
          src={qrCode}
          alt="Appointment QR Code"
          className="w-full h-full object-contain border border-gray-100 rounded"
        />
      </div>

      {/* Booking Reference */}
      {appointmentDetails && (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">Booking Reference</p>
          <p className="text-lg font-mono font-bold text-gray-900">
            {appointmentDetails.bookingReference}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex space-x-3">
          <button
            onClick={handleDownload}
            className="btn-secondary text-sm"
            title="Download QR Code"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary text-sm"
            title="Print QR Code"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </button>
          <button
            onClick={handleRefresh}
            className="btn-secondary text-sm"
            title="Refresh QR Code"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md text-center">
        <p className="text-xs text-blue-700">
          Present this QR code at your appointment for quick verification
        </p>
      </div>
    </div>
  )
}

// Simplified QR display for list views
export function QRCodeThumbnail({ 
  appointmentId, 
  bookingReference,
  className = ''
}: { 
  appointmentId: string
  bookingReference?: string
  className?: string 
}) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const generateSimpleQR = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/qr`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'simple' })
        })
        const data = await response.json()
        if (response.ok) {
          setQrCode(data.qrCode)
        }
      } catch (error) {
        console.error('Failed to generate QR thumbnail:', error)
      } finally {
        setLoading(false)
      }
    }

    if (appointmentId) {
      generateSimpleQR()
    }
  }, [appointmentId])

  if (loading) {
    return (
      <div className={`w-16 h-16 bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!qrCode) {
    return (
      <div className={`w-16 h-16 bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <QrCode className="h-6 w-6 text-gray-400" />
      </div>
    )
  }

  return (
    <div className={`w-16 h-16 rounded overflow-hidden ${className}`}>
      <img
        src={qrCode}
        alt={`QR code for ${bookingReference}`}
        className="w-full h-full object-cover"
      />
    </div>
  )
}