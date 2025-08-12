'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Document {
  id: string
  appointment_id: string
  citizen_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  document_category: string
  status: 'pending' | 'approved' | 'rejected'
  officer_comments: string
  uploaded_at: string
}

export function useDocuments(appointmentId?: string, citizenId?: string) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        let query = supabase.from('documents').select('*')

        if (appointmentId) {
          query = query.eq('appointment_id', appointmentId)
        } else if (citizenId) {
          query = query.eq('citizen_id', citizenId)
        }

        const { data, error } = await query.order('uploaded_at', { ascending: false })

        if (error) throw error
        setDocuments(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (appointmentId || citizenId) {
      fetchDocuments()
    } else {
      setLoading(false)
    }
  }, [appointmentId, citizenId])

  const refetch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase.from('documents').select('*')

      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId)
      } else if (citizenId) {
        query = query.eq('citizen_id', citizenId)
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { documents, loading, error, refetch }
}

export async function uploadDocument(
  file: File,
  appointmentId: string,
  citizenId: string,
  category: string
): Promise<Document> {
  // Validate file
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB')
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not supported. Please upload PDF, DOC, DOCX, or image files.')
  }

  // Generate unique filename
  const timestamp = Date.now()
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const fileName = `${appointmentId}/${category}/${timestamp}_${cleanFileName}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Save metadata to database
  const { data: documentData, error: dbError } = await supabase
    .from('documents')
    .insert({
      appointment_id: appointmentId,
      citizen_id: citizenId,
      file_name: file.name,
      file_path: uploadData.path,
      file_type: file.type,
      file_size: file.size,
      document_category: category,
      status: 'pending'
    })
    .select()
    .single()

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await supabase.storage.from('documents').remove([uploadData.path])
    throw new Error(`Database error: ${dbError.message}`)
  }

  return documentData
}

export async function deleteDocument(documentId: string): Promise<void> {
  // Get document info first
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch document: ${fetchError.message}`)
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path])

  if (storageError) {
    console.warn('Failed to delete file from storage:', storageError.message)
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbError) {
    throw new Error(`Failed to delete document: ${dbError.message}`)
  }
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600) // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`)
  }

  return data.signedUrl
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.includes('word')) return '📝'
  return '📎'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}