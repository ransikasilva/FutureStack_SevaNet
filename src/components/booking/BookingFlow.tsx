'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { ServiceBrowser } from '@/components/services/ServiceBrowser'
import { AppointmentCalendar } from './AppointmentCalendar'
import { bookAppointment } from '@/hooks/useAppointments'
import { checkDocumentRequirements, attachWalletDocumentsToAppointment, DocumentRequirement } from '@/hooks/useDocumentWallet'
import { DocumentCheckStep } from './DocumentCheckStep'
import { Check, ArrowLeft, ArrowRight, Calendar, FileText, CreditCard, Wallet } from 'lucide-react'
import { format } from 'date-fns'

interface BookingFlowProps {
  onComplete?: (appointment: any) => void
}

export function BookingFlow({ onComplete }: BookingFlowProps) {
  const { user } = useAuthContext()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([])
  const [checkingDocuments, setCheckingDocuments] = useState(false)

  const steps = [
    { number: 1, title: 'Select Service', icon: FileText },
    { number: 2, title: 'Choose Date & Time', icon: Calendar },
    { number: 3, title: 'Check Documents', icon: Wallet },
    { number: 4, title: 'Confirm & Book', icon: Check },
  ]

  const handleServiceSelect = (service: any) => {
    setSelectedService(service)
    setSelectedSlot(null) // Reset slot when service changes
  }

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot)
  }

  const handleNext = async () => {
    if (currentStep === 2 && selectedService?.required_documents?.length > 0) {
      // Check document requirements before proceeding to step 3
      await checkDocuments()
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const checkDocuments = async () => {
    if (!user?.profile?.id || !selectedService?.required_documents) return

    setCheckingDocuments(true)
    try {
      const requirements = await checkDocumentRequirements(
        user.profile.id,
        selectedService.required_documents
      )
      setDocumentRequirements(requirements)
    } catch (error) {
      console.error('Failed to check document requirements:', error)
    } finally {
      setCheckingDocuments(false)
    }
  }

  const handleBooking = async () => {
    if (!user?.profile?.id || !selectedService || !selectedSlot) return

    setLoading(true)
    setError(null)

    try {
      const appointment = await bookAppointment({
        citizen_id: user.profile.id,
        service_id: selectedService.id,
        time_slot_id: selectedSlot.id,
        notes: notes.trim() || undefined,
      })

      // Auto-attach wallet documents if available
      if (selectedService.required_documents?.length > 0) {
        try {
          await attachWalletDocumentsToAppointment(
            appointment.id,
            user.profile.id,
            selectedService.required_documents
          )
        } catch (attachError) {
          console.warn('Failed to attach wallet documents:', attachError)
          // Don't fail the booking if document attachment fails
        }
      }

      onComplete?.(appointment)
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = selectedService
  const canProceedToStep3 = selectedService && selectedSlot
  const canProceedToStep4 = selectedService && selectedSlot && 
    (selectedService.required_documents?.length === 0 || 
     documentRequirements.every(req => req.available))
  const hasDocumentRequirements = selectedService?.required_documents?.length > 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center space-x-8">
            {steps.map((step) => (
              <li key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select a Government Service
            </h2>
            <ServiceBrowser
              onServiceSelect={handleServiceSelect}
              selectedService={selectedService}
            />
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {currentStep === 2 && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Appointment Time
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {selectedService?.name}
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedService?.department?.name} • {selectedService?.duration_minutes} minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <AppointmentCalendar
              serviceId={selectedService?.id}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
            />
          </div>
        )}

        {/* Step 3: Document Check */}
        {currentStep === 3 && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Document Requirements
            </h2>
            
            <DocumentCheckStep
              requirements={documentRequirements}
              loading={checkingDocuments}
              onRefresh={checkDocuments}
            />
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Confirm Your Appointment
            </h2>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Appointment Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Appointment Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Service</h4>
                    <p className="text-gray-900">{selectedService?.name}</p>
                    <p className="text-sm text-gray-600">{selectedService?.department?.name}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Date & Time</h4>
                    <p className="text-gray-900">
                      {selectedSlot && format(new Date(selectedSlot.start_time), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedSlot && 
                        `${format(new Date(selectedSlot.start_time), 'HH:mm')} - ${format(new Date(selectedSlot.end_time), 'HH:mm')}`
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Duration</h4>
                    <p className="text-gray-900">{selectedService?.duration_minutes} minutes</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Service Fee</h4>
                    <p className="text-gray-900">
                      {selectedService?.service_fee === 0 
                        ? 'Free' 
                        : `LKR ${selectedService?.service_fee?.toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>

                {selectedService?.required_documents && selectedService.required_documents.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedService.required_documents.map((doc: string, index: number) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-primary-600 rounded-full mr-2"></div>
                          {doc}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      💡 Tip: You can upload these documents after booking to speed up your appointment.
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Any special requirements or notes for your appointment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>

          <div className="flex space-x-3">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedToStep2) ||
                  (currentStep === 2 && !canProceedToStep3) ||
                  (currentStep === 3 && !canProceedToStep4)
                }
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleBooking}
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}