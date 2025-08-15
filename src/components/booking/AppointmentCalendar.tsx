'use client'

import { useState } from 'react'
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
      <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Service First</h3>
        <p className="text-gray-600">Please select a service to view available appointments</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Professional Calendar Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Select Appointment Date & Time
          </h3>
          <div className="flex items-center bg-gray-50 rounded-xl p-2">
            <button
              onClick={goToPreviousWeek}
              disabled={!canGoToPreviousWeek()}
              className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-gray-200"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-base font-bold text-gray-900 min-w-[140px] text-center px-4">
              {format(weekStart, 'MMMM yyyy')}
            </span>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-white transition-colors shadow-sm border border-gray-200"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Week Days Headers */}
        <div className="grid grid-cols-7 gap-3 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-sm font-bold text-gray-700 py-3 bg-gray-100 rounded-lg">
              {day}
            </div>
          ))}
        </div>
        
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((date, index) => {
            const availableSlots = getAvailableSlots(date)
            const isSelected = isSameDay(date, selectedDate)
            const isCurrentDay = isToday(date)
            const isPast = isBefore(date, new Date()) && !isCurrentDay
            const isWeekendDay = isWeekend(date)
            
            return (
              <div key={index} className="min-h-[100px]">
                <button
                  onClick={() => setSelectedDate(date)}
                  disabled={isPast || isWeekendDay}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'bg-government-dark-blue text-white border-government-dark-blue shadow-lg scale-105'
                      : isPast || isWeekendDay
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : availableSlots.length > 0
                      ? 'bg-green-50 text-green-800 border-green-300 hover:bg-green-100 hover:scale-105 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:scale-105 shadow-sm'
                  }`}
                >
                  <div className="text-xl font-bold mb-2">
                    {format(date, 'd')}
                  </div>
                  {!isPast && !isWeekendDay && (
                    <div className="text-xs font-medium">
                      {availableSlots.length > 0 
                        ? `${availableSlots.length} slots`
                        : 'No slots'
                      }
                    </div>
                  )}
                  {isWeekendDay && (
                    <div className="text-xs font-medium text-gray-400">
                      Closed
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Professional Time Slots Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          Available Times for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h4>
        
        {loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-government-dark-blue mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading available times...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-red-500" />
            </div>
            <h5 className="text-lg font-bold text-red-900 mb-2">Error Loading Times</h5>
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {getAvailableSlots(selectedDate).map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSlotSelect(slot)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-sm font-medium ${
                  selectedSlot?.id === slot.id
                    ? 'bg-government-dark-blue text-white border-government-dark-blue shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="font-bold">
                    {formatTimeSlot(slot.start_time, slot.end_time)}
                  </span>
                </div>
                <div className="text-xs opacity-80">
                  {slot.max_appointments - slot.current_bookings} slots available
                </div>
              </button>
            ))}
          </div>
        )}
        
        {!loading && !error && getAvailableSlots(selectedDate).length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h5 className="text-lg font-bold text-gray-900 mb-2">No Available Times</h5>
            <p className="text-gray-600 mb-1">No available time slots for this date</p>
            <p className="text-sm text-gray-500">Please select a different date</p>
          </div>
        )}
      </div>
    </div>
  )
}