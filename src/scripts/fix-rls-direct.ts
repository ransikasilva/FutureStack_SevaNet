import { supabaseAdmin } from '../lib/supabase'

async function fixRLSDirectly() {
  console.log('🔧 Fixing RLS policies directly...')

  // First, let's see what policies exist
  console.log('📋 Checking current policies...')
  
  try {
    const { data, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'appointments')

    if (error) {
      console.error('Error checking policies:', error)
    } else {
      console.log('Current appointment policies:', data)
    }
  } catch (e) {
    console.log('Could not check policies via table query')
  }

  // Try the most direct approach - use SQL functions
  const sqlStatements = [
    // Drop existing policies
    `SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Citizens view own appointments') AND pg_drop_policy('appointments', 'Citizens view own appointments')`,
    `SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Officers view department appointments') AND pg_drop_policy('appointments', 'Officers view department appointments')`,
    `SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Citizens can create appointments') AND pg_drop_policy('appointments', 'Citizens can create appointments')`,
  ]

  // Let's use a simpler approach - create new policies with different names
  const newPolicies = [
    {
      name: 'allow_citizens_read_own_appointments',
      sql: `CREATE POLICY "allow_citizens_read_own_appointments" ON appointments FOR SELECT USING (citizen_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))`
    },
    {
      name: 'allow_citizens_create_appointments', 
      sql: `CREATE POLICY "allow_citizens_create_appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND citizen_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))`
    },
    {
      name: 'allow_citizens_update_own_appointments',
      sql: `CREATE POLICY "allow_citizens_update_own_appointments" ON appointments FOR UPDATE USING (citizen_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))`
    }
  ]

  // Drop all existing policies first using a simple approach
  console.log('🗑️ Dropping existing policies...')
  
  const dropCommands = [
    `DROP POLICY IF EXISTS "Citizens view own appointments" ON appointments`,
    `DROP POLICY IF EXISTS "Officers view department appointments" ON appointments`, 
    `DROP POLICY IF EXISTS "Citizens can create appointments" ON appointments`,
    `DROP POLICY IF EXISTS "Citizens can update own appointments" ON appointments`,
    `DROP POLICY IF EXISTS "Officers can update department appointments" ON appointments`,
  ]

  for (const cmd of dropCommands) {
    try {
      console.log(`Executing: ${cmd}`)
      // We'll need to execute this manually
      console.log('✓ Ready to execute')
    } catch (error) {
      console.log(`Note: ${error}`)
    }
  }

  // Create new policies
  console.log('📝 Creating new policies...')
  
  for (const policy of newPolicies) {
    try {
      console.log(`Creating policy: ${policy.name}`)
      console.log(`SQL: ${policy.sql}`)
      console.log('✓ Ready to execute')
    } catch (error) {
      console.error(`Failed to create ${policy.name}:`, error)
    }
  }

  console.log('\n🎯 Execute these SQL commands in Supabase SQL Editor:')
  console.log('\n-- 1. Drop existing policies')
  dropCommands.forEach(cmd => console.log(cmd + ';'))
  
  console.log('\n-- 2. Create new policies') 
  newPolicies.forEach(policy => console.log(policy.sql + ';'))
}

fixRLSDirectly()