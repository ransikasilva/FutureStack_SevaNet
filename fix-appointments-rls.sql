-- Fix RLS policies for appointments table
-- Drop existing policies
DROP POLICY IF EXISTS "Citizens view own appointments" ON appointments;
DROP POLICY IF EXISTS "Officers view department appointments" ON appointments;
DROP POLICY IF EXISTS "Citizens can create appointments" ON appointments;

-- Create comprehensive RLS policies for appointments

-- Allow citizens to view their own appointments
CREATE POLICY "Citizens view own appointments" ON appointments
    FOR SELECT USING (
        citizen_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'citizen'
        )
    );

-- Allow officers to view appointments in their department
CREATE POLICY "Officers view department appointments" ON appointments
    FOR SELECT USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN departments d ON s.department_id = d.id
            JOIN profiles p ON p.department_id = d.id
            WHERE p.user_id = auth.uid() AND p.role = 'officer'
        )
    );

-- Allow admins to view all appointments
CREATE POLICY "Admins view all appointments" ON appointments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'admin'
        )
    );

-- Allow citizens to create appointments (INSERT)
CREATE POLICY "Citizens can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        -- Check that the user is authenticated and has a citizen profile
        auth.uid() IS NOT NULL AND
        citizen_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'citizen'
        )
    );

-- Allow citizens to update their own appointments (for status changes, notes)
CREATE POLICY "Citizens can update own appointments" ON appointments
    FOR UPDATE USING (
        citizen_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'citizen'
        )
    );

-- Allow officers to update appointments in their department
CREATE POLICY "Officers can update department appointments" ON appointments
    FOR UPDATE USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN departments d ON s.department_id = d.id
            JOIN profiles p ON p.department_id = d.id
            WHERE p.user_id = auth.uid() AND p.role = 'officer'
        )
    );

-- Allow admins to update all appointments
CREATE POLICY "Admins can update all appointments" ON appointments
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'admin'
        )
    );

-- Refresh the schema
NOTIFY pgrst, 'reload schema';