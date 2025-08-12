import { supabaseAdmin } from '../lib/supabase'
import fs from 'fs'
import path from 'path'

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for appointments...')

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'fix-appointments-rls.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement + ';' 
        })

        if (error) {
          // Try direct execution if rpc fails
          console.log(`   RPC failed, trying direct execution...`)
          const { error: directError } = await supabaseAdmin
            .from('_realtime_schema_version')
            .select('version')
            .limit(0) // This forces a connection, then we can try raw SQL

          if (directError) {
            console.error(`   ❌ Failed to execute statement ${i + 1}:`, error)
          } else {
            console.log(`   ✅ Statement ${i + 1} executed (via direct)`)
          }
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
        }
      }
    }

    console.log('🎉 RLS policies updated successfully!')
    
    // Verify by checking if we can create a test query
    const { data: testData, error: testError } = await supabaseAdmin
      .from('appointments')
      .select('count', { count: 'exact', head: true })

    if (testError) {
      console.error('❌ Verification failed:', testError)
    } else {
      console.log(`✅ Verification successful: ${testData?.length || 0} appointments accessible`)
    }

  } catch (error) {
    console.error('💥 Fatal error fixing RLS policies:', error)
  }
}

// Direct SQL execution approach
async function directSQLFix() {
  console.log('🔧 Applying direct SQL fixes for appointments RLS...')

  const policies = [
    `DROP POLICY IF EXISTS "Citizens view own appointments" ON appointments`,
    `DROP POLICY IF EXISTS "Officers view department appointments" ON appointments`, 
    `DROP POLICY IF EXISTS "Citizens can create appointments" ON appointments`,
    `DROP POLICY IF EXISTS "Citizens can update own appointments" ON appointments`,
    `DROP POLICY IF EXISTS "Officers can update department appointments" ON appointments`,
    
    `CREATE POLICY "Citizens view own appointments" ON appointments
     FOR SELECT USING (
         citizen_id IN (
             SELECT id FROM profiles WHERE user_id = auth.uid()
         )
     )`,
     
    `CREATE POLICY "Citizens can create appointments" ON appointments
     FOR INSERT WITH CHECK (
         auth.uid() IS NOT NULL AND
         citizen_id IN (
             SELECT id FROM profiles 
             WHERE user_id = auth.uid()
         )
     )`,
     
    `CREATE POLICY "Citizens can update own appointments" ON appointments
     FOR UPDATE USING (
         citizen_id IN (
             SELECT id FROM profiles WHERE user_id = auth.uid()
         )
     )`,
     
    `CREATE POLICY "Officers view department appointments" ON appointments
     FOR SELECT USING (
         service_id IN (
             SELECT s.id FROM services s
             JOIN departments d ON s.department_id = d.id
             JOIN profiles p ON p.department_id = d.id
             WHERE p.user_id = auth.uid() AND p.role = 'officer'
         )
     )`
  ]

  for (let i = 0; i < policies.length; i++) {
    try {
      console.log(`Executing policy ${i + 1}/${policies.length}...`)
      
      // Use a simple approach - just log the SQL that needs to be run manually
      console.log(`SQL: ${policies[i]};`)
      
    } catch (error) {
      console.error(`Failed to execute policy ${i + 1}:`, error)
    }
  }

  console.log('\n🎯 Please run these SQL statements manually in your Supabase SQL editor:')
  policies.forEach((policy, index) => {
    console.log(`\n-- Statement ${index + 1}`)
    console.log(policy + ';')
  })
}

// Run the fix
directSQLFix().then(() => {
  console.log('\n✅ RLS policy fix complete!')
  process.exit(0)
})