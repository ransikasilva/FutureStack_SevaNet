'use client'

import { useState } from 'react'
import { useDepartments, useServices } from '@/hooks/useAppointments'
import { Search, Building2, Clock, DollarSign, FileText } from 'lucide-react'

interface ServiceBrowserProps {
  onServiceSelect: (service: any) => void
  selectedService?: any
}

export function ServiceBrowser({ onServiceSelect, selectedService }: ServiceBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  
  const { departments, loading: departmentsLoading } = useDepartments()
  const { services, loading: servicesLoading } = useServices(selectedDepartment || undefined)

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (departmentsLoading) {
    return <div className="text-center py-8">Loading departments...</div>
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Department
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {servicesLoading ? (
          <div className="text-center py-8">Loading services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No services found matching your criteria.
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className={`card cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedService?.id === service.id
                  ? 'ring-2 ring-primary-500 border-primary-500'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => onServiceSelect(service)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Building2 className="h-5 w-5 text-primary-600 mr-2" />
                    <span className="text-sm text-gray-600">
                      {service.department?.name}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{service.duration_minutes} minutes</span>
                    </div>
                    
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span>
                        {service.service_fee === 0 
                          ? 'Free' 
                          : `LKR ${service.service_fee.toLocaleString()}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{service.required_documents?.length || 0} documents</span>
                    </div>
                  </div>

                  {service.required_documents && service.required_documents.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Required Documents:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {service.required_documents.map((doc, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedService?.id === service.id && (
                  <div className="ml-4">
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}