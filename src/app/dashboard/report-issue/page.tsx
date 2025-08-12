'use client'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ReportIssueForm } from '@/components/issues/ReportIssueForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function ReportIssueContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Report Civic Issue</h1>
          <p className="mt-1 text-sm text-gray-600">
            Help us improve your community by reporting issues that need attention
          </p>
        </div>

        <div className="p-6">
          <ReportIssueForm />
        </div>
      </div>
    </div>
  )
}

export default function ReportIssuePage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <DashboardLayout>
        <ReportIssueContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}