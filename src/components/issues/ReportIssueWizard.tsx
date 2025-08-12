'use client'

import { useState } from 'react'
import { useAuthContext } from '@/components/auth/AuthProvider'
import { AIAnalysisStep } from './AIAnalysisStep'
import { ReportIssueForm } from './ReportIssueForm'
import { CheckCircle, ArrowLeft, Zap, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AIAnalysis {
  detected_issue: string
  category: string
  description: string
  severity_level: number
  recommended_authority: {
    name: string
    contact_phone: string
    contact_email: string
    emergency_contact: string
  }
  confidence_score: number
  suggested_location?: string
}

export function ReportIssueWizard() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<'ai-analysis' | 'manual-form'>('ai-analysis')
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  const handleAIAnalysisComplete = (analysis: AIAnalysis, image?: File) => {
    setAiAnalysis(analysis)
    if (image) setSelectedImage(image)
    setCurrentStep('manual-form')
  }

  const handleSkipAI = () => {
    setAiAnalysis(null)
    setSelectedImage(null)
    setCurrentStep('manual-form')
  }

  const handleBackToAI = () => {
    setCurrentStep('ai-analysis')
  }

  const steps = [
    {
      id: 'ai-analysis',
      title: 'AI Analysis',
      description: 'Upload photo for AI detection',
      icon: Zap,
      completed: aiAnalysis !== null
    },
    {
      id: 'manual-form',
      title: 'Issue Details',
      description: 'Complete issue information',
      icon: FileText,
      completed: false
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => {
              const isActive = step.id === currentStep
              const isCompleted = step.completed
              const StepIcon = step.icon

              return (
                <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex items-center">
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`
                          flex h-10 w-10 items-center justify-center rounded-full border-2
                          ${isActive
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : isCompleted
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-300 bg-white text-gray-500'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className="flex-1 ml-6 mr-4">
                        <div
                          className={`h-0.5 ${
                            isCompleted ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentStep === 'ai-analysis' ? 'AI-Powered Issue Detection' : 'Complete Issue Report'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {currentStep === 'ai-analysis' 
                  ? 'Upload a photo to automatically detect the issue and suggest authorities'
                  : 'Review and complete your issue report details'
                }
              </p>
            </div>
            {currentStep === 'manual-form' && (
              <button
                onClick={handleBackToAI}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to AI Analysis
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {currentStep === 'ai-analysis' ? (
            <AIAnalysisStep
              onAnalysisComplete={handleAIAnalysisComplete}
              onSkip={handleSkipAI}
            />
          ) : (
            <ReportIssueForm
              preFilledData={aiAnalysis ? {
                category: aiAnalysis.category,
                title: aiAnalysis.detected_issue,
                description: aiAnalysis.description,
                location: aiAnalysis.suggested_location || '',
                severityLevel: aiAnalysis.severity_level,
                recommendedAuthority: aiAnalysis.recommended_authority
              } : undefined}
              selectedImage={selectedImage}
              aiAnalysis={aiAnalysis}
              onBack={handleBackToAI}
            />
          )}
        </div>
      </div>

      {/* Help Section */}
      {currentStep === 'ai-analysis' && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How AI Analysis Works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="space-y-1">
                  <li>• Upload a clear photo of the civic issue</li>
                  <li>• Our AI will identify the problem type and severity</li>
                  <li>• Get automatic suggestions for the right government authority</li>
                  <li>• Skip this step if you prefer manual entry</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'manual-form' && aiAnalysis && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">AI Analysis Results Applied</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  The form has been pre-filled with AI analysis results. You can review and modify 
                  any details before submitting your issue report.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}