'use client'

import { useAuthContext } from '@/components/auth/AuthProvider'
import { DocumentReviewInterface } from '@/components/documents/DocumentReviewInterface'

export default function OfficerDocumentsPage() {
  const { user } = useAuthContext()

  if (user?.profile?.role !== 'officer') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">This page is only accessible to government officers.</p>
      </div>
    )
  }

  return (
    <DocumentReviewInterface 
      departmentId={user.profile.department_id} 
      officerId={user.profile.id}
    />
  )
}