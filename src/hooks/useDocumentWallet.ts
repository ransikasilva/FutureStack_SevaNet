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
    console.log('Inserting document with data:', {
      citizen_id: citizenId,
      file_name: file.name,
      file_path: uploadData.path,
      file_type: file.type,
      document_category: documentCategory,
      document_type: documentType || null,
      is_wallet_document: true,
      wallet_category: documentCategory,
      expiry_date: expiryDate || null,
      status: 'pending'
    })

    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        citizen_id: citizenId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        document_category: documentCategory,
        document_type: documentType || null,
        is_wallet_document: true,
        wallet_category: documentCategory,
        expiry_date: expiryDate || null,
        status: 'pending',
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single()

    console.log('Database insert result:', { documentData, documentError })
    console.log('Inserted document details:', {
      document_category: documentCategory,
      document_type: documentType,
      is_wallet_document: true,
      status: 'pending'
    })

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
    console.log('Checking requirements for:', { citizenId, requiredDocuments })
    
    // Query documents directly from the database with more flexible matching
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, document_category, document_type, status')
      .eq('citizen_id', citizenId)
      .eq('is_wallet_document', true)
      .in('status', ['approved', 'pending']) // Include both approved and pending

    if (error) throw error

    console.log('Available wallet documents:', documents)

    // Map required documents to availability
    const requirements = requiredDocuments.map(requiredDoc => {
      // Look for exact match first
      let matchingDoc = documents?.find(doc => 
        doc.document_category === requiredDoc || 
        doc.document_type === getCategoryKey(requiredDoc)
      )

      // If no exact match, try partial matching
      if (!matchingDoc) {
        matchingDoc = documents?.find(doc => {
          const docCategoryKey = getCategoryKey(doc.document_category || '')
          const requiredDocKey = getCategoryKey(requiredDoc)
          return docCategoryKey === requiredDocKey
        })
      }

      console.log(`Checking "${requiredDoc}":`, {
        found: !!matchingDoc,
        matchingDoc: matchingDoc?.document_category,
        mappedRequired: getCategoryKey(requiredDoc)
      })

      return {
        document_type: requiredDoc,
        available: !!matchingDoc,
        document_id: matchingDoc?.id
      }
    })

    console.log('Final requirements result:', requirements)
    return requirements
    
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
  'medical_report': 'Medical Report / Hospital Certificate',
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

export const getCategoryKey = (label: string): string => {
  // Find the key that matches the label exactly
  for (const [key, value] of Object.entries(DOCUMENT_CATEGORIES)) {
    if (value === label) {
      return key
    }
  }
  
  // Try case-insensitive match
  const lowerLabel = label.toLowerCase()
  for (const [key, value] of Object.entries(DOCUMENT_CATEGORIES)) {
    if (value.toLowerCase() === lowerLabel) {
      return key
    }
  }
  
  // Try partial matches for common variations
  if (lowerLabel.includes('birth certificate') || lowerLabel === 'birth certificate') {
    return 'birth_certificate'
  }
  if (lowerLabel.includes('national id') || lowerLabel.includes('nic')) {
    return 'national_id'
  }
  if (lowerLabel.includes('passport')) {
    return 'passport'
  }
  if (lowerLabel.includes('driver') || lowerLabel.includes('license')) {
    return 'driver_license'
  }
  if (lowerLabel.includes('marriage')) {
    return 'marriage_certificate'
  }
  if (lowerLabel.includes('education') || lowerLabel.includes('certificate')) {
    return 'education_certificate'
  }
  if (lowerLabel.includes('medical') || lowerLabel.includes('hospital')) {
    return 'medical_report'
  }
  if (lowerLabel.includes('police')) {
    return 'police_report'
  }
  if (lowerLabel.includes('bank')) {
    return 'bank_statement'
  }
  if (lowerLabel.includes('utility') || lowerLabel.includes('bill')) {
    return 'utility_bill'
  }
  if (lowerLabel.includes('employment') || lowerLabel.includes('work')) {
    return 'employment_letter'
  }
  if (lowerLabel.includes('passport') && lowerLabel.includes('photo')) {
    return 'photo_passport'
  }
  if (lowerLabel.includes('photo') || lowerLabel.includes('id photo')) {
    return 'photo_id'
  }
  
  // Fallback: normalize to snake_case
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return normalizedLabel
}