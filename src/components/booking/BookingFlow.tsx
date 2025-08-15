'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { ServiceBrowser } from '@/components/services/ServiceBrowser'
import { AppointmentCalendar } from './AppointmentCalendar'
import { bookAppointment } from '@/hooks/useAppointments'
import { checkDocumentRequirements, attachWalletDocumentsToAppointment, DocumentRequirement } from '@/hooks/useDocumentWallet'
import { DocumentCheckStep } from './DocumentCheckStep'
import { Check, ArrowLeft, ArrowRight, Calendar, FileText, CreditCard, Wallet, XCircle, MessageSquare, CheckCircle } from 'lucide-react'
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
      {/* Professional Progress Steps */}
      <div className="mb-10">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center space-x-8">
            {steps.map((step) => (
              <li key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-300 ${
                    currentStep >= step.number
                      ? 'bg-government-dark-blue border-government-dark-blue text-white shadow-lg'
                      : 'border-gray-300 text-gray-500 bg-white'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <span
                  className={`ml-3 text-base font-bold ${
                    currentStep >= step.number ? 'text-government-dark-blue' : 'text-gray-500'
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
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Select a Government Service
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Choose the government service you need to book an appointment for
              </p>
            </div>
            <ServiceBrowser
              onServiceSelect={handleServiceSelect}
              selectedService={selectedService}
            />
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {currentStep === 2 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Choose Your Appointment Time
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Select a convenient date and time for your appointment
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-government-gold/10 border border-blue-200 rounded-xl p-6 max-w-lg mx-auto">
                <div className="flex items-center justify-center">
                  <div className="p-2 bg-white rounded-lg mr-4 shadow-sm">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {selectedService?.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
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
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Document Requirements
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Verify you have all required documents for your appointment
              </p>
            </div>
            
            <DocumentCheckStep
              requirements={documentRequirements}
              loading={checkingDocuments}
              citizenId={user?.profile?.id || ''}
              onRefresh={checkDocuments}
            />
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Confirm Your Appointment
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Review your appointment details and confirm your booking
              </p>
            </div>

            {error && (
              <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 mr-3" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Appointment Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  Appointment Summary
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Service</h4>
                      <p className="text-lg font-bold text-gray-900">{selectedService?.name}</p>
                      <p className="text-gray-600 mt-1">{selectedService?.department?.name}</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Duration</h4>
                      <p className="text-lg font-bold text-gray-900">{selectedService?.duration_minutes} minutes</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Date & Time</h4>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedSlot && format(new Date(selectedSlot.start_time), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-gray-600 mt-1">
                        {selectedSlot && 
                          `${format(new Date(selectedSlot.start_time), 'HH:mm')} - ${format(new Date(selectedSlot.end_time), 'HH:mm')}`
                        }
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Service Fee</h4>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedService?.service_fee === 0 
                          ? 'Free' 
                          : `LKR ${selectedService?.service_fee?.toLocaleString()}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {selectedService?.required_documents && selectedService.required_documents.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center">
                      <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      Required Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedService.required_documents.map((doc: string, index: number) => (
                        <div key={index} className="flex items-center bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="w-3 h-3 bg-government-dark-blue rounded-full mr-3 flex-shrink-0"></div>
                          <span className="text-gray-900 font-medium">{doc}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-government-gold/10 border border-yellow-200 rounded-xl">
                      <div className="flex items-start">
                        <div className="p-2 bg-white rounded-lg mr-4 shadow-sm">
                          <Wallet className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <h5 className="font-bold text-yellow-900 mb-2">Pro Tip</h5>
                          <p className="text-yellow-800 leading-relaxed">
                            You can upload these documents after booking to speed up your appointment and avoid delays.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  </div>
                  Additional Notes (Optional)
                </h4>
                <textarea
                  className="w-full border border-gray-300 rounded-xl px-6 py-4 text-base focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue transition-colors resize-none"
                  rows={4}
                  placeholder="Any special requirements, accessibility needs, or notes for your appointment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Professional Navigation Buttons */}
        <div className="border-t border-gray-200 px-8 py-6 flex justify-between bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl hover:bg-white transition-all duration-300 shadow-sm border border-gray-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="flex space-x-4">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedToStep2) ||
                  (currentStep === 2 && !canProceedToStep3) ||
                  (currentStep === 3 && !canProceedToStep4)
                }
                className="inline-flex items-center px-8 py-3 border border-transparent text-white bg-government-dark-blue rounded-xl hover:bg-blue-800 transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Next Step
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleBooking}
                disabled={loading}
                className="inline-flex items-center px-8 py-3 border border-transparent text-white bg-gradient-to-r from-government-dark-blue to-blue-700 rounded-xl hover:from-blue-800 hover:to-blue-900 transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirm Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}