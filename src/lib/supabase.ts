import { createClient } from '@supabase/supabase-js'

// Hardcode the values temporarily to fix the issue
const supabaseUrl = 'https://ileyyewqhyfclcfdlisg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZXl5ZXdxaHlmY2xjZmRsaXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NzAzODUsImV4cCI6MjA3MDU0NjM4NX0.P3ytuf_q8Ua2ah7QA6U6QkV3RLOie6Q4x4dfTh6Zvs4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    fetch: (url, options = {}) => {
      console.log('Supabase fetch request:', url)
      return fetch(url, {
        ...options,
        // Add timeout to requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Admin client for server-side operations  
export const supabaseAdmin = createClient(
  supabaseUrl,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZXl5ZXdxaHlmY2xjZmRsaXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk3MDM4NSwiZXhwIjoyMDcwNTQ2Mzg1fQ.d4eCiLSLugJ7oo3RHPpqsInfp2sZ95p3ZURo-p0qorA',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          nic: string
          phone?: string
          address?: string
          date_of_birth?: string
          role: 'citizen' | 'officer' | 'admin'
          department_id?: string
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          nic: string
          phone?: string
          address?: string
          date_of_birth?: string
          role?: 'citizen' | 'officer' | 'admin'
          department_id?: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          nic?: string
          phone?: string
          address?: string
          date_of_birth?: string
          role?: 'citizen' | 'officer' | 'admin'
          department_id?: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description?: string
          address?: string
          contact_phone?: string
          contact_email?: string
          working_hours?: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          address?: string
          contact_phone?: string
          contact_email?: string
          working_hours?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          address?: string
          contact_phone?: string
          contact_email?: string
          working_hours?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          department_id: string
          name: string
          description?: string
          duration_minutes: number
          required_documents?: string[]
          service_fee: number
          prerequisites?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      appointments: {
        Row: {
          id: string
          citizen_id: string
          service_id: string
          time_slot_id: string
          booking_reference: string
          qr_code?: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string
          officer_notes?: string
          created_at: string
          updated_at: string
        }
      }
      time_slots: {
        Row: {
          id: string
          service_id: string
          officer_id?: string
          start_time: string
          end_time: string
          max_appointments: number
          current_bookings: number
          is_available: boolean
          created_at: string
        }
      }
      documents: {
        Row: {
          id: string
          appointment_id: string
          citizen_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          document_category?: string
          status: 'pending' | 'approved' | 'rejected'
          officer_comments?: string
          uploaded_at: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          appointment_id?: string
          type: 'email' | 'sms' | 'in_app'
          title: string
          message: string
          status: 'pending' | 'sent' | 'delivered' | 'failed'
          sent_at?: string
          created_at: string
        }
      }
      feedback: {
        Row: {
          id: string
          appointment_id: string
          citizen_id: string
          service_id: string
          rating: number
          comment?: string
          categories?: any
          is_anonymous: boolean
          created_at: string
        }
      }
    }
  }
}