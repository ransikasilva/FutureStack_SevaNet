'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface WalletDocument {
  id: string
  citizen_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  document_category: string
  document_type?: string
  status: 'pending' | 'approved' | 'rejected'
  expiry_date?: string
  is_verified: boolean
  uploaded_at: string
  officer_comments?: string
}

export interface DocumentRequirement {
  document_type: string
  available: boolean
  document_id?: string
}

export function useDocumentWallet(citizenId?: string) {
  const [walletDocuments, setWalletDocuments] = useState<WalletDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWalletDocuments = async () => {
    if (!citizenId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('citizen_id', citizenId)
        .eq('is_wallet_document', true)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setWalletDocuments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (citizenId) {
      fetchWalletDocuments()

      // Subscribe to real-time updates
      const subscription = supabase
        .channel('wallet_documents')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'documents',
            filter: `citizen_id=eq.${citizenId}`
          },
          () => {
            fetchWalletDocuments()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [citizenId])

  return { walletDocuments, loading, error, refetch: fetchWalletDocuments }
}

export async function uploadToWallet(data: {
  citizenId: string
  file: File
  documentCategory: string
  documentType?: string
  expiryDate?: string
}) {
  const { citizenId, file, documentCategory, documentType, expiryDate } = data

  // Generate unique file name
  const fileExt = file.name.split('.').pop()
  const fileName = `wallet_${citizenId}_${documentCategory}_${Date.now()}.${fileExt}`

  try {
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`wallet/${fileName}`, file)

    if (uploadError) throw uploadError

    // Save document metadata to database
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        citizen_id: citizenId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        document_category: documentCategory,
        document_type: documentType,
        is_wallet_document: true,
        expiry_date: expiryDate || null,
        status: 'pending'
      })
      .select()
      .single()

    if (documentError) throw documentError
    return documentData
  } catch (error) {
    console.error('Upload to wallet failed:', error)
    throw error
  }
}

export async function checkDocumentRequirements(
  citizenId: string,
  requiredDocuments: string[]
): Promise<DocumentRequirement[]> {
  try {
    const { data, error } = await supabase.rpc('check_wallet_documents', {
      citizen_id_param: citizenId,
      required_docs: requiredDocuments
    })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to check document requirements:', error)
    return requiredDocuments.map(doc => ({
      document_type: doc,
      available: false
    }))
  }
}

export async function attachWalletDocumentsToAppointment(
  appointmentId: string,
  citizenId: string,
  requiredDocuments: string[]
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('attach_wallet_documents_to_appointment', {
      appointment_id_param: appointmentId,
      citizen_id_param: citizenId,
      required_docs: requiredDocuments
    })

    if (error) throw error
    return data || 0
  } catch (error) {
    console.error('Failed to attach wallet documents:', error)
    return 0
  }
}

export async function removeFromWallet(documentId: string) {
  try {
    // First get the file path to delete from storage
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    if (document?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path])

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) throw deleteError
  } catch (error) {
    console.error('Failed to remove from wallet:', error)
    throw error
  }
}

// Predefined document categories with user-friendly labels
export const DOCUMENT_CATEGORIES = {
  'national_id': 'National ID (NIC)',
  'birth_certificate': 'Birth Certificate',
  'passport': 'Passport',
  'driver_license': 'Driver License',
  'marriage_certificate': 'Marriage Certificate',
  'education_certificate': 'Education Certificate',
  'medical_report': 'Medical Report',
  'police_report': 'Police Report',
  'bank_statement': 'Bank Statement',
  'utility_bill': 'Utility Bill',
  'employment_letter': 'Employment Letter',
  'photo_passport': 'Passport Size Photo',
  'photo_id': 'ID Photo',
  'other': 'Other Document'
}

export const getCategoryLabel = (category: string): string => {
  return DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES] || category
}