'use client'

import dynamic from 'next/dynamic'

// Completely dynamic import to avoid any SSR issues
export const DynamicIssuesMap = dynamic(
  () => import('./IssuesMapClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-2xl border border-gray-200 shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-government-dark-blue mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading interactive map...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we initialize the mapping system</p>
        </div>
      </div>
    )
  }
)