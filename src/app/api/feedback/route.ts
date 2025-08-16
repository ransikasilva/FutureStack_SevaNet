import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, rating, comment, categories, isAnonymous } = body

    // Validate required fields
    if (!appointmentId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid appointment ID and rating (1-5) are required' },
        { status: 400 }
      )
    }

    // Get appointment details to verify ownership and completion
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        citizen_id,
        service_id,
        status,
        services (
          id,
          name,
          department_id
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Get user profile to verify ownership
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!profile || profile.id !== appointment.citizen_id) {
      return NextResponse.json(
        { error: 'You can only provide feedback for your own appointments' },
        { status: 403 }
      )
    }

    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Feedback can only be provided for completed appointments' },
        { status: 400 }
      )
    }

    // Check if feedback already exists
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single()

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback has already been provided for this appointment' },
        { status: 400 }
      )
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        appointment_id: appointmentId,
        citizen_id: profile.id,
        service_id: appointment.service_id,
        rating,
        comment: comment?.trim() || null,
        categories: categories || null,
        is_anonymous: isAnonymous || false
      })
      .select()
      .single()

    if (feedbackError) {
      throw feedbackError
    }

    return NextResponse.json({
      success: true,
      feedback,
      message: 'Thank you for your feedback!'
    })

  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const departmentId = searchParams.get('departmentId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Check user role for access control
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, department_id')
      .eq('user_id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let query = supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        categories,
        is_anonymous,
        created_at,
        services (
          id,
          name,
          departments (
            id,
            name
          )
        ),
        citizens:citizen_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters based on user role and query params
    if (profile.role === 'officer' && profile.department_id) {
      // Officers can only see feedback for their department
      query = query.eq('services.department_id', profile.department_id)
    } else if (profile.role === 'citizen') {
      // Citizens can only see their own feedback
      query = query.eq('citizen_id', profile.id)
    }
    // Admins can see all feedback

    if (serviceId) {
      query = query.eq('service_id', serviceId)
    }

    if (departmentId && profile.role === 'admin') {
      query = query.eq('services.department_id', departmentId)
    }

    const { data: feedbackList, error } = await query

    if (error) {
      throw error
    }

    // Calculate summary statistics
    const totalFeedback = feedbackList?.length || 0
    const averageRating = totalFeedback > 0 
      ? feedbackList.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback 
      : 0

    const ratingDistribution = {
      5: feedbackList?.filter(fb => fb.rating === 5).length || 0,
      4: feedbackList?.filter(fb => fb.rating === 4).length || 0,
      3: feedbackList?.filter(fb => fb.rating === 3).length || 0,
      2: feedbackList?.filter(fb => fb.rating === 2).length || 0,
      1: feedbackList?.filter(fb => fb.rating === 1).length || 0,
    }

    return NextResponse.json({
      success: true,
      feedback: feedbackList?.map(fb => ({
        ...fb,
        citizens: fb.is_anonymous ? { full_name: 'Anonymous' } : fb.citizens
      })) || [],
      summary: {
        totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    })

  } catch (error) {
    console.error('Feedback fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}