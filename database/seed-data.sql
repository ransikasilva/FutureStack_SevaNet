-- Insert sample departments
INSERT INTO departments (id, name, description, address, contact_phone, contact_email) VALUES
(uuid_generate_v4(), 'Department of Motor Traffic', 'Vehicle registration, driving licenses, and traffic-related services', 'No. 28, D.R. Wijewardene Mawatha, Colombo 10', '+94112691231', 'info@dmt.gov.lk'),
(uuid_generate_v4(), 'Department of Immigration & Emigration', 'Passport and visa services for Sri Lankan citizens', 'No. 41, Ananda Rajakaruna Mawatha, Colombo 10', '+94112329900', 'info@immigration.gov.lk'),
(uuid_generate_v4(), 'Registrar General Department', 'Birth, death, marriage certificates and civil registrations', 'No. 356, Galle Road, Colombo 03', '+94112573373', 'info@rgd.gov.lk'),
(uuid_generate_v4(), 'Divisional Secretariat - Colombo', 'Local government services and certifications', 'Town Hall, Colombo 07', '+94112691515', 'ds.colombo@gov.lk'),
(uuid_generate_v4(), 'Department of Inland Revenue', 'Tax payments, clearance certificates, and revenue services', 'No. 5, Echelon Square, Colombo 01', '+94112145145', 'info@ird.gov.lk');

-- Get department IDs for services
DO $$
DECLARE
    dmt_id UUID;
    immigration_id UUID;
    rgd_id UUID;
    ds_id UUID;
    ir_id UUID;
BEGIN
    SELECT id INTO dmt_id FROM departments WHERE name = 'Department of Motor Traffic';
    SELECT id INTO immigration_id FROM departments WHERE name = 'Department of Immigration & Emigration';
    SELECT id INTO rgd_id FROM departments WHERE name = 'Registrar General Department';
    SELECT id INTO ds_id FROM departments WHERE name = 'Divisional Secretariat - Colombo';
    SELECT id INTO ir_id FROM departments WHERE name = 'Department of Inland Revenue';

    -- Insert services for Department of Motor Traffic
    INSERT INTO services (department_id, name, description, duration_minutes, required_documents, service_fee) VALUES
    (dmt_id, 'Driving License Application', 'Apply for a new driving license', 45, ARRAY['National ID Copy', 'Medical Certificate', 'Vision Test Report', 'Passport Photo'], 500.00),
    (dmt_id, 'Vehicle Registration', 'Register a new vehicle', 30, ARRAY['Vehicle Invoice', 'Insurance Certificate', 'National ID Copy', 'Import Permit'], 2500.00),
    (dmt_id, 'License Renewal', 'Renew existing driving license', 20, ARRAY['Current License', 'National ID Copy', 'Passport Photo'], 200.00),
    (dmt_id, 'Duplicate License', 'Issue duplicate driving license', 25, ARRAY['Police Report', 'National ID Copy', 'Affidavit', 'Passport Photo'], 300.00);

    -- Insert services for Immigration & Emigration
    INSERT INTO services (department_id, name, description, duration_minutes, required_documents, service_fee) VALUES
    (immigration_id, 'Passport Application', 'Apply for a new passport', 60, ARRAY['Birth Certificate', 'National ID Copy', 'Passport Photos', 'Application Form'], 3500.00),
    (immigration_id, 'Passport Renewal', 'Renew existing passport', 45, ARRAY['Current Passport', 'National ID Copy', 'Passport Photos', 'Application Form'], 3500.00),
    (immigration_id, 'Visa Application', 'Apply for travel visa', 30, ARRAY['Passport Copy', 'Travel Itinerary', 'Bank Statement', 'Sponsor Letter'], 1500.00);

    -- Insert services for Registrar General Department
    INSERT INTO services (department_id, name, description, duration_minutes, required_documents, service_fee) VALUES
    (rgd_id, 'Birth Certificate', 'Obtain certified birth certificate', 15, ARRAY['Birth Registration Form', 'Parent ID Copies', 'Hospital Certificate'], 100.00),
    (rgd_id, 'Marriage Certificate', 'Obtain certified marriage certificate', 20, ARRAY['Marriage Registration', 'Couple ID Copies', 'Marriage Photos'], 150.00),
    (rgd_id, 'Death Certificate', 'Obtain certified death certificate', 15, ARRAY['Death Registration', 'Medical Certificate', 'Next of Kin ID'], 100.00);

    -- Insert services for Divisional Secretariat
    INSERT INTO services (department_id, name, description, duration_minutes, required_documents, service_fee) VALUES
    (ds_id, 'Income Certificate', 'Certificate of income for official purposes', 25, ARRAY['National ID Copy', 'Employment Letter', 'Salary Slips', 'Bank Statement'], 50.00),
    (ds_id, 'Residence Certificate', 'Certificate of residence', 20, ARRAY['National ID Copy', 'Utility Bill', 'Lease Agreement'], 25.00),
    (ds_id, 'Character Certificate', 'Certificate of good character', 30, ARRAY['National ID Copy', 'Passport Photo', 'Reference Letters'], 75.00);

    -- Insert services for Inland Revenue
    INSERT INTO services (department_id, name, description, duration_minutes, required_documents, service_fee) VALUES
    (ir_id, 'Tax Clearance Certificate', 'Certificate for tax compliance', 40, ARRAY['National ID Copy', 'Tax Returns', 'Bank Statement', 'Employment Certificate'], 200.00),
    (ir_id, 'TIN Registration', 'Register for Taxpayer Identification Number', 25, ARRAY['National ID Copy', 'Business Registration', 'Address Proof'], 0.00),
    (ir_id, 'Tax Payment', 'Make tax payments and get receipt', 15, ARRAY['National ID Copy', 'Assessment Notice', 'Bank Draft'], 0.00);
END $$;

-- Insert sample time slots for next 30 days
DO $$
DECLARE
    service_record RECORD;
    slot_date DATE;
    slot_time TIME;
    start_datetime TIMESTAMP WITH TIME ZONE;
    end_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Loop through all services
    FOR service_record IN SELECT id, duration_minutes FROM services WHERE is_active = true LOOP
        -- Create slots for next 30 days
        FOR i IN 0..29 LOOP
            slot_date := CURRENT_DATE + i;
            
            -- Skip weekends
            IF EXTRACT(DOW FROM slot_date) NOT IN (0, 6) THEN
                -- Create slots from 9 AM to 4 PM
                FOR hour_offset IN 0..6 LOOP
                    slot_time := '09:00:00'::TIME + (hour_offset || ' hours')::INTERVAL;
                    start_datetime := slot_date + slot_time;
                    end_datetime := start_datetime + (service_record.duration_minutes || ' minutes')::INTERVAL;
                    
                    -- Only create slots if end time is before 5 PM
                    IF EXTRACT(HOUR FROM end_datetime) < 17 THEN
                        INSERT INTO time_slots (service_id, start_time, end_time, max_appointments, is_available)
                        VALUES (service_record.id, start_datetime, end_datetime, 3, true);
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Create sample admin user (this will be linked when they sign up)
-- Note: The actual user needs to sign up through Supabase Auth first
-- This is just a placeholder for the admin profile structure

-- Insert sample feedback categories configuration
-- This would typically be in a separate configuration table, but for simplicity, we'll use JSONB
COMMENT ON COLUMN feedback.categories IS 'JSON object containing ratings for different aspects like: {"staff_helpfulness": 5, "wait_time": 4, "process_clarity": 5, "facility_cleanliness": 4, "overall_experience": 5}';

-- Create function to automatically create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, nic, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'nic', ''),
        'citizen'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;