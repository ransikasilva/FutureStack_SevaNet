import { supabaseAdmin } from '../lib/supabase'

// Create time slots using admin client (bypasses RLS)
export async function createTimeSlotsAsAdmin() {
  console.log('🚀 Creating time slots using admin client...')

  try {
    // 1. Get all existing services
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('id, name, duration_minutes')

    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError)
      return
    }

    console.log(`📋 Found ${services.length} services:`)
    services.forEach(service => {
      console.log(`   - ${service.name} (${service.duration_minutes} min)`)
    })

    // 2. Check if time slots already exist
    const { data: existingSlots, error: checkError } = await supabaseAdmin
      .from('time_slots')
      .select('id')
      .limit(1)

    if (checkError) {
      console.error('❌ Error checking existing slots:', checkError)
      return
    }

    if (existingSlots && existingSlots.length > 0) {
      console.log('⚠️  Time slots already exist. Skipping creation.')
      
      // Show count of existing slots
      const { data: count } = await supabaseAdmin
        .from('time_slots')
        .select('*', { count: 'exact', head: true })
      
      console.log(`📊 Found ${count?.count || 0} existing time slots`)
      return
    }

    // 3. Create time slots for the next 30 days
    console.log('📅 Creating time slots for next 30 days...')
    
    const timeSlots = []
    const today = new Date()
    
    for (let day = 1; day <= 30; day++) {
      const date = new Date(today)
      date.setDate(today.getDate() + day)
      
      // Skip Sundays (day 0)
      if (date.getDay() === 0) {
        console.log(`   ⏭️  Skipping Sunday: ${date.toDateString()}`)
        continue
      }
      
      // Create slots from 9:00 AM to 4:00 PM (working hours)
      for (let hour = 9; hour <= 15; hour++) {
        for (const service of services) {
          // Create 2 time slots per hour per service
          for (let slot = 0; slot < 2; slot++) {
            const startTime = new Date(date)
            startTime.setHours(hour, slot * 30, 0, 0) // 30-minute intervals
            
            const endTime = new Date(startTime)
            endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)
            
            // Make sure we don't go past 4:30 PM
            if (endTime.getHours() > 16 || (endTime.getHours() === 16 && endTime.getMinutes() > 30)) {
              continue
            }

            timeSlots.push({
              service_id: service.id,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              max_appointments: 1,
              current_bookings: 0,
              is_available: true,
              created_at: new Date().toISOString()
            })
          }
        }
      }
    }

    console.log(`📊 Generated ${timeSlots.length} time slots`)

    // 4. Insert time slots in batches using admin client
    console.log('💾 Inserting time slots into database using admin privileges...')
    const batchSize = 50 // Smaller batches for better reliability
    let insertedCount = 0
    
    for (let i = 0; i < timeSlots.length; i += batchSize) {
      const batch = timeSlots.slice(i, i + batchSize)
      
      const { error: insertError } = await supabaseAdmin
        .from('time_slots')
        .insert(batch)

      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError)
        break
      } else {
        insertedCount += batch.length
        console.log(`   ✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(timeSlots.length/batchSize)} (${batch.length} slots)`)
      }
    }

    console.log(`🎉 Successfully created ${insertedCount} time slots!`)

    // 5. Verify the data
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from('time_slots')
      .select('*', { count: 'exact', head: true })

    if (verifyError) {
      console.error('❌ Error verifying time slots:', verifyError)
    } else {
      console.log(`✅ Verified: ${verification.count} time slots in database`)
    }

    // 6. Show summary by service
    console.log('\n📈 Summary by service:')
    for (const service of services) {
      const serviceSlots = timeSlots.filter(slot => slot.service_id === service.id)
      console.log(`   ${service.name}: ${serviceSlots.length} slots created`)
    }

    console.log('\n🎯 Next steps:')
    console.log('   1. Visit http://localhost:3000/dashboard/book to test booking')
    console.log('   2. Register as a citizen and try booking an appointment')
    console.log('   3. Check http://localhost:3000/debug for system status')
    console.log('   4. Time slots are now available for the next 30 days!')

  } catch (error) {
    console.error('💥 Fatal error creating time slots:', error)
  }
}

// Execute the function
createTimeSlotsAsAdmin()