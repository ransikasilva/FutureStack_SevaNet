'use client'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ReportIssueWizard } from '@/components/issues/ReportIssueWizard'
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

      <ReportIssueWizard />
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