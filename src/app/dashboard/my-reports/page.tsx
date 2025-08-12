'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MyReports } from '@/components/issues/MyReports'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

function MyReportsContent() {
  const { user } = useAuthContext()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        <Link
          href="/dashboard/report-issue"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Report New Issue
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">My Reported Issues</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track the status of your reported civic issues
          </p>
        </div>

        <div className="p-6">
          <MyReports userId={user?.profile?.id || ''} />
        </div>
      </div>
    </div>
  )
}

export default function MyReportsPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <MyReportsContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}