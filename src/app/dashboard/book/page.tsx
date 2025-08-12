'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { CheckCircle, Calendar, FileText } from 'lucide-react'

function BookAppointmentContent() {
  const [bookingComplete, setBookingComplete] = useState(false)
  const [completedAppointment, setCompletedAppointment] = useState<any>(null)
  const router = useRouter()

  const handleBookingComplete = (appointment: any) => {
    setCompletedAppointment(appointment)
    setBookingComplete(true)
  }

  if (bookingComplete && completedAppointment) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Appointment Booked Successfully!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your appointment has been confirmed. You will receive a confirmation email and SMS shortly.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Reference:</span>
                <span className="font-mono font-medium">{completedAppointment.booking_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="capitalize text-yellow-600 font-medium">{completedAppointment.status}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/appointments')}
              className="w-full btn-primary"
            >
              <Calendar className="h-5 w-5 mr-2" />
              View My Appointments
            </button>
            
            <button
              onClick={() => router.push('/dashboard/documents')}
              className="w-full btn-secondary"
            >
              <FileText className="h-5 w-5 mr-2" />
              Upload Documents
            </button>
            
            <button
              onClick={() => {
                setBookingComplete(false)
                setCompletedAppointment(null)
              }}
              className="w-full text-gray-600 hover:text-gray-800 py-2"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Book New Appointment
        </h1>
        <p className="text-gray-600">
          Schedule your government service appointment in just a few steps
        </p>
      </div>

      <BookingFlow onComplete={handleBookingComplete} />
    </div>
  )
}

export default function BookAppointmentPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <BookAppointmentContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}