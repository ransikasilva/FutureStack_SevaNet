-- Database Migration Script for Issue Reporting Feature
-- This script adds new tables to the existing SevaNet database

-- ==========================================
-- CREATE ISSUES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- References existing profiles table
    category VARCHAR(50) NOT NULL CHECK (category IN ('roads', 'electricity', 'water', 'waste', 'safety', 'health', 'environment', 'infrastructure')),
    title VARCHAR(200),
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed')),
    severity_level INTEGER DEFAULT 1 CHECK (severity_level IN (1, 2, 3, 4)),
    assigned_authority_id UUID REFERENCES authorities(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CREATE AUTHORITIES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    emergency_contact VARCHAR(20),
    is_emergency_service BOOLEAN DEFAULT FALSE,
    coverage_area VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues(location);
CREATE INDEX IF NOT EXISTS idx_authorities_category ON authorities(category);
CREATE INDEX IF NOT EXISTS idx_authorities_emergency ON authorities(is_emergency_service);

-- ==========================================
-- INSERT SAMPLE AUTHORITIES DATA
-- ==========================================

INSERT INTO authorities (name, department, category, contact_phone, contact_email, emergency_contact, is_emergency_service, coverage_area) VALUES
-- Roads and Infrastructure
('Road Development Authority', 'Infrastructure', 'roads', '+94-11-2691211', 'info@rda.gov.lk', '+94-11-2691999', false, 'National'),
('Municipal Council Colombo - Roads', 'Local Government', 'roads', '+94-11-2323232', 'roads@colombo.mc.gov.lk', '+94-11-2323999', false, 'Colombo'),

-- Electricity
('Ceylon Electricity Board', 'Utilities', 'electricity', '+94-11-2445678', 'complaints@ceb.lk', '+94-11-2445999', true, 'National'),
('Lanka Electricity Company (LECO)', 'Utilities', 'electricity', '+94-11-2177177', 'info@leco.lk', '+94-11-2177999', true, 'Western Province'),

-- Water Supply
('National Water Supply & Drainage Board', 'Utilities', 'water', '+94-11-2446622', 'info@nwsdb.lk', '+94-11-2446999', false, 'National'),
('Colombo Municipal Council - Water', 'Local Government', 'water', '+94-11-2323232', 'water@colombo.mc.gov.lk', '+94-11-2323999', false, 'Colombo'),

-- Safety and Security
('Sri Lanka Police', 'Safety & Security', 'safety', '+94-11-2421111', 'complaints@police.lk', '119', true, 'National'),
('Traffic Police', 'Safety & Security', 'roads', '+94-11-2422222', 'traffic@police.lk', '119', true, 'National'),

-- Waste Management
('Municipal Council Colombo - Waste', 'Local Government', 'waste', '+94-11-2323232', 'waste@colombo.mc.gov.lk', '+94-11-2323999', false, 'Colombo'),
('Western Province Waste Management Authority', 'Provincial', 'waste', '+94-11-2555555', 'info@wpwma.gov.lk', '+94-11-2555999', false, 'Western Province'),

-- Health
('Ministry of Health', 'Health', 'health', '+94-11-2694033', 'info@health.gov.lk', '+94-11-2694999', false, 'National'),
('Colombo Municipal Medical Officer of Health', 'Local Government', 'health', '+94-11-2323232', 'health@colombo.mc.gov.lk', '+94-11-2323999', false, 'Colombo'),

-- Environment
('Central Environmental Authority', 'Environment', 'environment', '+94-11-2872278', 'info@cea.lk', '+94-11-2872999', false, 'National'),
('Urban Development Authority', 'Urban Development', 'infrastructure', '+94-11-2581581', 'info@uda.gov.lk', '+94-11-2581999', false, 'National')
ON CONFLICT DO NOTHING;

-- ==========================================
-- CREATE SAMPLE ISSUES DATA (FOR TESTING)
-- ==========================================

-- NOTE: Replace 'sample-user-id' with actual user IDs from your profiles table
-- This is just for demonstration purposes

-- INSERT INTO issues (user_id, category, title, description, location, severity_level, status) VALUES
-- ('sample-user-id-1', 'roads', 'Large pothole on Main Street', 'There is a large pothole on Main Street that is causing traffic issues and could damage vehicles', 'Main Street, Colombo 03', 2, 'pending'),
-- ('sample-user-id-2', 'electricity', 'Street light not working', 'Street light near the bus stop has not been working for 3 days', 'Bus Stop, Galle Road', 1, 'pending'),
-- ('sample-user-id-3', 'waste', 'Garbage not collected', 'Garbage collection has been missed for 2 weeks in our area', 'Residential Area, Mount Lavinia', 2, 'under_review');

-- ==========================================
-- CREATE ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on issues table
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Citizens can view their own issues
CREATE POLICY "Citizens can view own issues" ON issues
    FOR SELECT USING (user_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ));

-- Citizens can insert their own issues
CREATE POLICY "Citizens can create issues" ON issues
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ));

-- Citizens can update their own issues (limited fields)
CREATE POLICY "Citizens can update own issues" ON issues
    FOR UPDATE USING (user_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ));

-- Officers can view issues in their category/area (this would need to be refined based on your officer structure)
-- CREATE POLICY "Officers can view relevant issues" ON issues
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM profiles p 
--             WHERE p.user_id = auth.uid() 
--             AND p.role = 'officer'
--             -- Add additional conditions based on officer's department/area
--         )
--     );

-- Admins can view all issues
-- CREATE POLICY "Admins can view all issues" ON issues
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM profiles p 
--             WHERE p.user_id = auth.uid() 
--             AND p.role = 'admin'
--         )
--     );

-- Enable RLS on authorities table (read-only for most users)
ALTER TABLE authorities ENABLE ROW LEVEL SECURITY;

-- Anyone can view authorities (public information)
CREATE POLICY "Public can view authorities" ON authorities
    FOR SELECT USING (true);

-- ==========================================
-- CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- ==========================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for issues table
DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- CREATE VIEW FOR ISSUE STATISTICS
-- ==========================================

CREATE OR REPLACE VIEW issue_statistics AS
SELECT 
    category,
    COUNT(*) as total_issues,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_issues,
    COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_issues,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_issues,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_issues,
    AVG(severity_level) as avg_severity,
    DATE_TRUNC('month', created_at) as month_year
FROM issues 
GROUP BY category, DATE_TRUNC('month', created_at)
ORDER BY month_year DESC, category;

-- ==========================================
-- GRANT NECESSARY PERMISSIONS
-- ==========================================

-- Grant permissions for authenticated users to access these tables
-- (Adjust according to your Supabase setup)

-- For issues table
GRANT SELECT, INSERT, UPDATE ON issues TO authenticated;
GRANT SELECT ON authorities TO authenticated;

-- For sequences (if using serial IDs instead of UUIDs)
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Use these queries to verify the migration was successful:

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('issues', 'authorities');

-- Check if indexes exist  
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('issues', 'authorities');

-- Check if authorities data was inserted
-- SELECT COUNT(*) FROM authorities;

-- Check if RLS is enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('issues', 'authorities');

-- ==========================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- ==========================================

-- Uncomment and run these commands if you need to rollback the migration:

-- DROP VIEW IF EXISTS issue_statistics;
-- DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS issues;
-- DROP TABLE IF EXISTS authorities;