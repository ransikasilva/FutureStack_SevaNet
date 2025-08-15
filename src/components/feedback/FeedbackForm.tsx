'use client'

import { useState } from 'react'
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface FeedbackFormProps {
  appointmentId: string
  serviceName: string
  departmentName: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface FeedbackCategories {
  staff_helpfulness: number
  wait_time: number
  process_clarity: number
  facility_cleanliness: number
  overall_experience: number
}

export function FeedbackForm({ 
  appointmentId, 
  serviceName, 
  departmentName, 
  onSuccess, 
  onCancel 
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [categories, setCategories] = useState<FeedbackCategories>({
    staff_helpfulness: 0,
    wait_time: 0,
    process_clarity: 0,
    facility_cleanliness: 0,
    overall_experience: 0
  })
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryLabels = {
    staff_helpfulness: 'Staff Helpfulness',
    wait_time: 'Wait Time',
    process_clarity: 'Process Clarity',
    facility_cleanliness: 'Facility Cleanliness',
    overall_experience: 'Overall Experience'
  }

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
  }

  const handleCategoryRating = (category: keyof FeedbackCategories, categoryRating: number) => {
    setCategories(prev => ({
      ...prev,
      [category]: categoryRating
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please provide an overall rating')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          rating,
          comment: comment.trim() || null,
          categories,
          isAnonymous
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-4">Your feedback has been submitted successfully.</p>
        <p className="text-sm text-gray-500">Your input helps us improve government services.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Rate Your Experience</h3>
        <p className="text-gray-600">
          How was your experience with <strong>{serviceName}</strong> at {departmentName}?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-colors duration-200"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {rating > 0 && (
                <>
                  {rating} of 5 stars
                  {rating === 5 && ' - Excellent!'}
                  {rating === 4 && ' - Very Good'}
                  {rating === 3 && ' - Good'}
                  {rating === 2 && ' - Fair'}
                  {rating === 1 && ' - Poor'}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Category Ratings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rate Specific Aspects
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleCategoryRating(key as keyof FeedbackCategories, star)}
                      className="transition-colors duration-200"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= categories[key as keyof FeedbackCategories]
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue resize-none"
            placeholder="Tell us more about your experience. What went well? What could be improved?"
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 text-government-dark-blue focus:ring-government-dark-blue border-gray-300 rounded"
          />
          <label htmlFor="anonymous" className="ml-2 text-sm text-gray-600">
            Submit feedback anonymously
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="flex-1 bg-government-dark-blue text-white py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Submit Feedback
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Your feedback is valuable and helps us improve government services for everyone. 
          All feedback is reviewed by department officials to enhance service quality.
        </p>
      </div>
    </div>
  )
}