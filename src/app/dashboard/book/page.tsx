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
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 pb-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Appointment Booked Successfully!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your government service appointment has been confirmed and scheduled. You will receive detailed confirmation via email and SMS within the next few minutes.
            </p>
          </div>
        </div>

        {/* Success Details */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointment Information */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
              <p className="text-gray-600 mt-1">Your confirmed appointment information</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-green-900">Booking Reference</span>
                  <span className="font-mono text-lg font-bold text-green-800">{completedAppointment.booking_reference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-900">Status</span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    {completedAppointment.status.charAt(0).toUpperCase() + completedAppointment.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Officer will review your appointment request</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>You'll receive confirmation or additional instructions</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Upload required documents to speed up processing</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-8 py-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                <p className="text-gray-600 mt-1">Manage your appointment and documents</p>
              </div>
              <div className="p-8 space-y-4">
                <button
                  onClick={() => router.push('/dashboard/appointments')}
                  className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-government-dark-blue hover:bg-blue-800 transition-colors shadow-sm"
                >
                  <Calendar className="h-5 w-5 mr-3" />
                  View My Appointments
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/documents')}
                  className="w-full inline-flex items-center justify-center px-6 py-4 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  Upload Required Documents
                </button>
                
                <button
                  onClick={() => {
                    setBookingComplete(false)
                    setCompletedAppointment(null)
                  }}
                  className="w-full text-center py-3 text-government-dark-blue hover:text-blue-800 font-medium transition-colors"
                >
                  Book Another Appointment
                </button>
              </div>
            </div>

            {/* Help Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Need Assistance?</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>• Call our helpline: <strong>1919</strong> (toll-free)</p>
                <p>• Email support: <strong>support@sevanet.lk</strong></p>
                <p>• Office hours: Mon-Fri, 8:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Book New Appointment
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Schedule your government service appointment with our streamlined booking system
            </p>
          </div>
        </div>
      </div>

      {/* Booking Process */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Appointment Booking Process
          </h2>
          <p className="text-gray-600 mt-1">Follow these simple steps to book your government service appointment</p>
        </div>
        
        <div className="p-8">
          <BookingFlow onComplete={handleBookingComplete} />
        </div>
      </div>

      {/* Helpful Information */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-8 py-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            Booking Guidelines
          </h3>
          <p className="text-gray-600 mt-1">Important information to help you prepare for your appointment</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">Before Booking</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Ensure you have all required documents ready</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Check service requirements and prerequisites</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Select a convenient date and time slot</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-government-dark-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span>Provide accurate contact information</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">After Booking</h4>
              <div className="space-y-4 text-gray-700">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">You will receive:</h5>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Email confirmation with appointment details</li>
                    <li>• SMS notification with booking reference</li>
                    <li>• QR code for easy check-in</li>
                    <li>• Document upload instructions</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-medium text-yellow-900 mb-2">Next Steps:</h5>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• Upload required documents if possible</li>
                    <li>• Wait for officer confirmation</li>
                    <li>• Arrive 15 minutes early on appointment day</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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