import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Check if user is admin or officer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, department_id')
      .eq('user_id', session.user.id)
      .single()

    if (!profile || !['admin', 'officer'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const dateRange = searchParams.get('dateRange') || '30' // Default last 30 days

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(dateRange))

    const whereClause = profile.role === 'officer' && profile.department_id 
      ? `AND s.department_id = '${profile.department_id}'`
      : departmentId 
        ? `AND s.department_id = '${departmentId}'`
        : ''

    // 1. Peak Booking Hours
    // Try to get peak hours from RPC function, with error handling
    let peakHours = []
    try {
      const { data } = await supabase.rpc('get_peak_hours', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        dept_filter: whereClause
      })
      peakHours = data || []
    } catch (error) {
      console.warn('RPC get_peak_hours failed, using fallback:', error)
      peakHours = []
    }

    // Fallback query for peak hours if RPC doesn't exist
    let peakHoursData = peakHours || []
    if (!peakHours || peakHours.length === 0) {
      const { data: appointmentsByHour } = await supabase
        .from('appointments')
        .select(`
          created_at,
          services!inner (
            department_id,
            departments (name)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      // Process data to get hourly distribution
      const hourCounts: { [key: number]: number } = {}
      appointmentsByHour?.forEach(apt => {
        const hour = new Date(apt.created_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      })

      peakHoursData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        bookings: hourCounts[hour] || 0
      }))
    }

    // 2. Departmental Load
    const { data: departmentalLoad } = await supabase
      .from('appointments')
      .select(`
        id,
        services!inner (
          department_id,
          departments!inner (
            id,
            name
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const deptCounts: { [key: string]: { name: string, count: number } } = {}
    departmentalLoad?.forEach(apt => {
      // Handle the nested departments structure from Supabase
      const serviceData = apt.services as any
      const dept = serviceData?.departments
      if (dept && !deptCounts[dept.id]) {
        deptCounts[dept.id] = { name: dept.name, count: 0 }
      }
      if (dept) {
        deptCounts[dept.id].count++
      }
    })

    const departmentalData = Object.values(deptCounts)

    // 3. Appointment Status Distribution
    const { data: statusData } = await supabase
      .from('appointments')
      .select(`
        status,
        services!inner (
          department_id
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const statusCounts: { [key: string]: number } = {}
    statusData?.forEach(apt => {
      statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1
    })

    // 4. No-show Rate Calculation
    const totalAppointments = statusData?.length || 0
    const noShows = statusCounts['no_show'] || 0
    const noShowRate = totalAppointments > 0 ? (noShows / totalAppointments) * 100 : 0

    // 5. Average Processing Time (mock calculation)
    const { data: completedAppointments } = await supabase
      .from('appointments')
      .select('created_at, updated_at')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    let averageProcessingTime = 0
    if (completedAppointments && completedAppointments.length > 0) {
      const totalTime = completedAppointments.reduce((sum, apt) => {
        const created = new Date(apt.created_at)
        const completed = new Date(apt.updated_at)
        return sum + (completed.getTime() - created.getTime())
      }, 0)
      averageProcessingTime = totalTime / completedAppointments.length / (1000 * 60 * 60) // Convert to hours
    }

    // 6. Recent Activity
    const { data: recentActivity } = await supabase
      .from('appointments')
      .select(`
        id,
        booking_reference,
        status,
        created_at,
        services (
          name,
          departments (name)
        ),
        citizens:citizen_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // 7. Summary Statistics
    const { data: summaryStats } = await supabase
      .from('appointments')
      .select('id, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayAppointments = summaryStats?.filter(apt => 
      new Date(apt.created_at) >= todayStart
    ).length || 0

    return NextResponse.json({
      success: true,
      data: {
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: parseInt(dateRange)
        },
        peakHours: peakHoursData,
        departmentalLoad: departmentalData,
        statusDistribution: statusCounts,
        noShowRate: Math.round(noShowRate * 100) / 100,
        averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
        recentActivity: recentActivity || [],
        summary: {
          totalAppointments: totalAppointments,
          todayAppointments: todayAppointments,
          completedAppointments: statusCounts['completed'] || 0,
          pendingAppointments: statusCounts['pending'] || 0,
          confirmedAppointments: statusCounts['confirmed'] || 0
        }
      }
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}