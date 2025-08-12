'use client'

import { useState, useEffect } from 'react'
import { useTimeSlots } from '@/hooks/useAppointments'
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'

interface AppointmentCalendarProps {
  serviceId: string
  onSlotSelect: (slot: any) => void
  selectedSlot?: any
}

export function AppointmentCalendar({ serviceId, onSlotSelect, selectedSlot }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  
  const { timeSlots, loading, error } = useTimeSlots(
    serviceId, 
    format(selectedDate, 'yyyy-MM-dd')
  )

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7))
  }

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  const canGoToPreviousWeek = () => {
    const prevWeekStart = addDays(weekStart, -7)
    return !isBefore(prevWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const formatTimeSlot = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`
  }

  const getAvailableSlots = (date: Date) => {
    return timeSlots.filter(slot => 
      isSameDay(new Date(slot.start_time), date)
    )
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday or Saturday
  }

  if (!serviceId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Please select a service to view available appointments</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Select Appointment Date & Time
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousWeek}
            disabled={!canGoToPreviousWeek()}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
            {format(weekStart, 'MMM yyyy')}
          </span>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {weekDays.map((date, index) => {
          const availableSlots = getAvailableSlots(date)
          const isSelected = isSameDay(date, selectedDate)
          const isCurrentDay = isToday(date)
          const isPast = isBefore(date, new Date()) && !isCurrentDay
          const isWeekendDay = isWeekend(date)
          
          return (
            <div key={index} className="min-h-[80px]">
              <button
                onClick={() => setSelectedDate(date)}
                disabled={isPast || isWeekendDay}
                className={`w-full p-2 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600'
                    : isPast || isWeekendDay
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : availableSlots.length > 0
                    ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="text-lg font-semibold">
                  {format(date, 'd')}
                </div>
                {!isPast && !isWeekendDay && (
                  <div className="text-xs mt-1">
                    {availableSlots.length > 0 
                      ? `${availableSlots.length} slots`
                      : 'No slots'
                    }
                  </div>
                )}
                {isWeekendDay && (
                  <div className="text-xs mt-1 text-gray-400">
                    Closed
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Time Slots for Selected Date */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Available Times for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h4>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading available times...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            Error loading time slots: {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {getAvailableSlots(selectedDate).map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSlotSelect(slot)}
                className={`p-3 rounded-lg border transition-colors text-sm ${
                  selectedSlot?.id === slot.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-primary-50 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTimeSlot(slot.start_time, slot.end_time)}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {slot.max_appointments - slot.current_bookings} available
                </div>
              </button>
            ))}
          </div>
        )}
        
        {!loading && !error && getAvailableSlots(selectedDate).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No available time slots for this date</p>
            <p className="text-sm mt-1">Please select a different date</p>
          </div>
        )}
      </div>
    </div>
  )
}