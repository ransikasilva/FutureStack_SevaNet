'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, Calendar, Filter, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface FeedbackItem {
  id: string
  rating: number
  comment: string
  categories: {
    staff_helpfulness: number
    wait_time: number
    process_clarity: number
    facility_cleanliness: number
    overall_experience: number
  }
  is_anonymous: boolean
  created_at: string
  services: {
    id: string
    name: string
    departments: {
      id: string
      name: string
    }
  }
  citizens: {
    full_name: string
  }
}

interface FeedbackSummary {
  totalFeedback: number
  averageRating: number
  ratingDistribution: {
    [key: number]: number
  }
}

interface FeedbackDisplayProps {
  serviceId?: string
  departmentId?: string
  showHeader?: boolean
}

export function FeedbackDisplay({ serviceId, departmentId, showHeader = true }: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all')

  useEffect(() => {
    fetchFeedback()
  }, [serviceId, departmentId])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (serviceId) params.append('serviceId', serviceId)
      if (departmentId) params.append('departmentId', departmentId)

      const response = await fetch(`/api/feedback?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch feedback')
      }

      setFeedback(result.feedback)
      setSummary(result.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(fb => fb.rating === parseInt(filter))

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchFeedback}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Service Feedback</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-government-dark-blue focus:border-government-dark-blue"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {summary.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(summary.averageRating), 'md')}
                </div>
                <p className="text-sm text-gray-600">
                  Based on {summary.totalFeedback} review{summary.totalFeedback !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Rating Distribution</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = summary.ratingDistribution[rating] || 0
                    const percentage = summary.totalFeedback > 0 
                      ? (count / summary.totalFeedback) * 100 
                      : 0

                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-8">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h4>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No feedback has been submitted for this service yet.'
                : `No ${filter}-star reviews found.`
              }
            </p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {renderStars(item.rating, 'md')}
                  <span className="text-sm font-medium text-gray-900">
                    {item.rating}/5 stars
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {item.citizens.full_name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {item.comment && (
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">{item.comment}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium">{item.services.name}</span>
                    <span className="mx-2">•</span>
                    <span>{item.services.departments.name}</span>
                  </div>
                  {item.is_anonymous && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                      Anonymous
                    </span>
                  )}
                </div>
              </div>

              {/* Category Ratings */}
              {item.categories && Object.values(item.categories).some(val => val > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Detailed Ratings</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(item.categories).map(([key, value]) => {
                      if (value === 0) return null
                      
                      const labels: { [key: string]: string } = {
                        staff_helpfulness: 'Staff',
                        wait_time: 'Wait Time',
                        process_clarity: 'Clarity',
                        facility_cleanliness: 'Cleanliness',
                        overall_experience: 'Experience'
                      }

                      return (
                        <div key={key} className="text-center">
                          <div className="text-xs text-gray-600 mb-1">{labels[key]}</div>
                          <div className="flex justify-center">
                            {renderStars(value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}