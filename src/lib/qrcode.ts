import QRCode from 'qrcode'

export interface QRCodeData {
  appointmentId: string
  bookingReference: string
  citizenId: string
  serviceId: string
  appointmentDate: string
  appointmentTime: string
  departmentName: string
  serviceName: string
  citizenName: string
  citizenPhone: string
  status: string
  generatedAt: string
}

export class QRCodeService {
  /**
   * Generate unique verification code
   */
  static generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Generate QR code for appointment
   */
  static async generateAppointmentQR(appointmentData: Partial<QRCodeData>): Promise<string> {
    try {
      // Generate unique verification code (8-digit alphanumeric)
      const verificationCode = this.generateVerificationCode()
      
      const qrData = {
        type: 'SEVANET_APPOINTMENT',
        version: '1.0',
        code: verificationCode,
        ref: appointmentData.bookingReference,
        citizen: appointmentData.citizenName,
        service: appointmentData.serviceName,
        dept: appointmentData.departmentName,
        date: appointmentData.appointmentDate,
        time: appointmentData.appointmentTime,
        status: appointmentData.status,
        generated: new Date().toISOString().substring(0, 10) // YYYY-MM-DD
      }

      const qrString = JSON.stringify(qrData)
      
      const qrCodeOptions = {
        errorCorrectionLevel: 'M' as const,
        type: 'image/png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#1F2937', // Dark gray
          light: '#FFFFFF' // White
        },
        width: 256
      }

      const qrCodeDataURL = await QRCode.toDataURL(qrString, qrCodeOptions)
      return qrCodeDataURL
    } catch (error) {
      console.error('QR Code generation failed:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate simple QR code with verification code
   */
  static async generateSimpleQR(bookingReference: string): Promise<string> {
    try {
      const verificationCode = this.generateVerificationCode()
      
      const simpleQrData = {
        type: 'SEVANET_VERIFY',
        code: verificationCode,
        ref: bookingReference,
        generated: new Date().toISOString().substring(0, 10)
      }
      
      const qrCodeOptions = {
        errorCorrectionLevel: 'M' as const,
        type: 'image/png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF'
        },
        width: 200
      }

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(simpleQrData), qrCodeOptions)
      return qrCodeDataURL
    } catch (error) {
      console.error('Simple QR Code generation failed:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Parse QR code data
   */
  static parseQRData(qrString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrString)
      
      if (data.type !== 'sevanet_appointment' || !data.bookingReference) {
        return null
      }

      return data as QRCodeData
    } catch (error) {
      console.error('Failed to parse QR data:', error)
      return null
    }
  }

  /**
   * Validate QR code data
   */
  static validateQRData(data: QRCodeData): boolean {
    const requiredFields = [
      'appointmentId',
      'bookingReference', 
      'citizenId',
      'serviceId',
      'appointmentDate',
      'status'
    ]

    return requiredFields.every(field => data[field as keyof QRCodeData])
  }

  /**
   * Generate QR code for appointment verification at office
   */
  static async generateVerificationQR(appointmentId: string, bookingReference: string): Promise<string> {
    try {
      const verificationData = {
        type: 'sevanet_verification',
        appointmentId,
        bookingReference,
        timestamp: new Date().toISOString(),
        action: 'checkin'
      }

      const qrCodeOptions = {
        errorCorrectionLevel: 'H' as const,
        type: 'image/png' as const,
        quality: 0.95,
        margin: 2,
        color: {
          dark: '#059669', // Green
          light: '#FFFFFF'
        },
        width: 300
      }

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(verificationData), qrCodeOptions)
      return qrCodeDataURL
    } catch (error) {
      console.error('Verification QR Code generation failed:', error)
      throw new Error('Failed to generate verification QR code')
    }
  }
}

// Helper function to download QR code as image
export function downloadQRCode(dataURL: string, filename: string = 'appointment-qr.png') {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Helper function to print QR code
export function printQRCode(dataURL: string, appointmentDetails: any) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SevaNet Appointment - ${appointmentDetails.bookingReference}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #1F2937;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1F2937;
          margin-bottom: 10px;
        }
        .qr-container {
          text-align: center;
          margin: 30px 0;
        }
        .qr-image {
          border: 2px solid #E5E7EB;
          padding: 10px;
          display: inline-block;
        }
        .details {
          background: #F9FAFB;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #E5E7EB;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .label {
          font-weight: bold;
          color: #374151;
        }
        .value {
          color: #1F2937;
        }
        .instructions {
          margin-top: 30px;
          padding: 15px;
          background: #EFF6FF;
          border-left: 4px solid #3B82F6;
          border-radius: 4px;
        }
        .instructions h3 {
          margin-top: 0;
          color: #1E40AF;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          color: #6B7280;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">SevaNet</div>
        <p>Government Services Appointment Portal</p>
      </div>

      <div class="qr-container">
        <img src="${dataURL}" alt="Appointment QR Code" class="qr-image" />
        <h2>Booking Reference: ${appointmentDetails.bookingReference}</h2>
      </div>

      <div class="details">
        <div class="detail-row">
          <span class="label">Citizen Name:</span>
          <span class="value">${appointmentDetails.citizenName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Service:</span>
          <span class="value">${appointmentDetails.serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Department:</span>
          <span class="value">${appointmentDetails.departmentName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date:</span>
          <span class="value">${appointmentDetails.appointmentDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time:</span>
          <span class="value">${appointmentDetails.appointmentTime}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value">${appointmentDetails.status}</span>
        </div>
      </div>

      <div class="instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Bring this QR code to your appointment</li>
          <li>Present it to the officer for quick verification</li>
          <li>Ensure you have all required documents</li>
          <li>Arrive 15 minutes before your scheduled time</li>
        </ul>
      </div>

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Visit sevanet.gov.lk for more information</p>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}