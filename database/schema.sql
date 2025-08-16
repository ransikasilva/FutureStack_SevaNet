-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    nic VARCHAR(12) UNIQUE NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    date_of_birth DATE,
    role user_role DEFAULT 'citizen',
    department_id UUID,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Government Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    contact_phone VARCHAR(15),
    contact_email VARCHAR(255),
    working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services offered by departments
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 30,
    required_documents TEXT[] DEFAULT '{}',
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    prerequisites TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint after departments table is created
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_department FOREIGN KEY (department_id) REFERENCES departments(id);

-- Available time slots
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES profiles(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_appointments INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Appointment bookings
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    time_slot_id UUID REFERENCES time_slots(id),
    booking_reference VARCHAR(8) UNIQUE NOT NULL DEFAULT generate_booking_ref(),
    qr_code TEXT,
    status appointment_status DEFAULT 'pending',
    notes TEXT,
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document uploads
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES profiles(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    document_category TEXT,
    status document_status DEFAULT 'pending',
    officer_comments TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback and ratings
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES profiles(id),
    service_id UUID REFERENCES services(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    categories JSONB DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance optimization indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_nic ON profiles(nic);
CREATE INDEX idx_appointments_citizen_id ON appointments(citizen_id);
CREATE INDEX idx_appointments_service_id ON appointments(service_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);
CREATE INDEX idx_time_slots_service_id ON time_slots(service_id);
CREATE INDEX idx_time_slots_start_time ON time_slots(start_time);
CREATE INDEX idx_documents_appointment_id ON documents(appointment_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_feedback_service_id ON feedback(service_id);

-- Function to update appointment counts
CREATE OR REPLACE FUNCTION update_slot_booking_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE time_slots 
        SET current_bookings = current_bookings + 1
        WHERE id = NEW.time_slot_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE time_slots 
        SET current_bookings = current_bookings - 1
        WHERE id = OLD.time_slot_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking count
CREATE TRIGGER trigger_update_slot_booking_count
    AFTER INSERT OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_slot_booking_count();

-- Function to check slot availability
CREATE OR REPLACE FUNCTION is_slot_available(slot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    slot_record RECORD;
BEGIN
    SELECT max_appointments, current_bookings, is_available
    INTO slot_record
    FROM time_slots
    WHERE id = slot_id;
    
    RETURN slot_record.is_available AND slot_record.current_bookings < slot_record.max_appointments;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Officers can view department profiles" ON profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE role IN ('officer', 'admin')
        )
    );

-- RLS Policies for departments (public read)
CREATE POLICY "Departments are publicly readable" ON departments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify departments" ON departments
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'admin'
        )
    );

-- RLS Policies for services (public read)
CREATE POLICY "Services are publicly readable" ON services
    FOR SELECT USING (is_active = true);

-- RLS Policies for appointments
CREATE POLICY "Citizens view own appointments" ON appointments
    FOR SELECT USING (
        citizen_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Officers view department appointments" ON appointments
    FOR SELECT USING (
        service_id IN (
            SELECT s.id FROM services s
            JOIN departments d ON s.department_id = d.id
            JOIN profiles p ON p.department_id = d.id
            WHERE p.user_id = auth.uid() AND p.role = 'officer'
        )
    );

CREATE POLICY "Citizens can create appointments" ON appointments
    FOR INSERT WITH CHECK (
        citizen_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for documents
CREATE POLICY "Document access control" ON documents
    FOR SELECT USING (
        citizen_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT p.user_id FROM profiles p
            JOIN departments d ON p.department_id = d.id
            JOIN services s ON s.department_id = d.id
            JOIN appointments a ON a.service_id = s.id
            WHERE a.id = appointment_id AND p.role = 'officer'
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Function to generate issue reference
CREATE OR REPLACE FUNCTION generate_issue_reference()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'ISS-';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Issues table for civic issue reporting
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    category VARCHAR(50) NOT NULL CHECK (category IN ('roads', 'electricity', 'water', 'waste', 'safety', 'health', 'environment', 'infrastructure')),
    title VARCHAR(200),
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed')),
    severity_level INTEGER DEFAULT 1 CHECK (severity_level IN (1, 2, 3, 4)),
    assigned_authority_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    booking_reference VARCHAR(12) UNIQUE DEFAULT generate_issue_reference(),
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    priority_level INTEGER DEFAULT 2 CHECK (priority_level IN (1, 2, 3, 4, 5)),
    officer_assigned_id UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    citizen_satisfaction_rating INTEGER CHECK (citizen_satisfaction_rating >= 1 AND citizen_satisfaction_rating <= 5)
);

-- Issue updates tracking table
CREATE TABLE issue_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    updated_by_user_id UUID NOT NULL REFERENCES profiles(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    update_type VARCHAR(20) DEFAULT 'status_change' CHECK (update_type IN ('status_change', 'comment', 'assignment', 'completion', 'escalation')),
    comment TEXT,
    is_public BOOLEAN DEFAULT true,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issue attachments table
CREATE TABLE issue_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID NOT NULL REFERENCES profiles(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER,
    attachment_type VARCHAR(50) DEFAULT 'evidence' CHECK (attachment_type IN ('evidence', 'before_photo', 'after_photo', 'document', 'receipt')),
    description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes for issues
CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_created_at ON issues(created_at);
CREATE INDEX idx_issues_location ON issues(location);
CREATE INDEX idx_issues_coordinates ON issues(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_issues_priority ON issues(priority_level);
CREATE INDEX idx_issues_officer_assigned ON issues(officer_assigned_id);
CREATE INDEX idx_issues_completion_date ON issues(actual_completion_date);

-- Analytics indexes
CREATE INDEX idx_issues_analytics_date ON issues(created_at, category, status);
CREATE INDEX idx_issues_analytics_location ON issues(latitude, longitude, created_at) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_issues_analytics_resolution ON issues(actual_completion_date, estimated_completion_date) WHERE actual_completion_date IS NOT NULL;
CREATE INDEX idx_issues_analytics_satisfaction ON issues(citizen_satisfaction_rating, category) WHERE citizen_satisfaction_rating IS NOT NULL;

-- Issue updates indexes
CREATE INDEX idx_issue_updates_issue_id ON issue_updates(issue_id);
CREATE INDEX idx_issue_updates_created_at ON issue_updates(created_at);

-- Issue attachments indexes
CREATE INDEX idx_issue_attachments_issue_id ON issue_attachments(issue_id);

-- Materialized view for heatmap data
CREATE MATERIALIZED VIEW issue_heatmap_data AS
SELECT 
    ROUND(latitude::numeric, 3) as lat_rounded,
    ROUND(longitude::numeric, 3) as lng_rounded,
    category,
    status,
    COUNT(*) as issue_density,
    AVG(severity_level) as avg_severity,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN severity_level >= 3 THEN 1 END) as critical_count,
    MIN(created_at) as first_reported,
    MAX(created_at) as last_reported
FROM issues 
WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL 
    AND created_at >= (NOW() - INTERVAL '1 year')
GROUP BY ROUND(latitude::numeric, 3), ROUND(longitude::numeric, 3), category, status
HAVING COUNT(*) > 0
ORDER BY COUNT(*) DESC;

-- Comprehensive analytics materialized view
CREATE MATERIALIZED VIEW issue_analytics_comprehensive AS
SELECT 
    DATE_TRUNC('day', i.created_at) as date,
    DATE_TRUNC('week', i.created_at) as week,
    DATE_TRUNC('month', i.created_at) as month,
    EXTRACT(hour FROM i.created_at) as hour_of_day,
    TO_CHAR(i.created_at, 'Day') as day_of_week,
    i.category,
    i.status,
    i.severity_level,
    i.priority_level,
    CASE WHEN i.latitude IS NOT NULL AND i.longitude IS NOT NULL 
         THEN CONCAT(ROUND(i.latitude::numeric, 2), ',', ROUND(i.longitude::numeric, 2))
         ELSE NULL END as location_grid,
    d.name as assigned_department,
    COUNT(*) as issue_count,
    COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN i.severity_level >= 3 THEN 1 END) as critical_high_count,
    AVG(CASE WHEN i.actual_completion_date IS NOT NULL 
             THEN EXTRACT(epoch FROM i.actual_completion_date - i.created_at) / 3600 END) as avg_resolution_time_hours,
    AVG(CASE WHEN i.actual_completion_date IS NOT NULL AND i.estimated_completion_date IS NOT NULL 
             THEN EXTRACT(epoch FROM i.actual_completion_date - i.estimated_completion_date) / 3600 END) as avg_sla_variance_hours,
    AVG(i.citizen_satisfaction_rating) as avg_satisfaction_rating,
    COUNT(CASE WHEN i.citizen_satisfaction_rating >= 4 THEN 1 END) as high_satisfaction_count,
    COUNT(DISTINCT i.officer_assigned_id) as officers_involved,
    AVG(CASE WHEN i.officer_assigned_id IS NOT NULL AND i.actual_completion_date IS NOT NULL 
             THEN EXTRACT(epoch FROM i.actual_completion_date - i.created_at) / 3600 END) as avg_officer_resolution_time
FROM issues i
LEFT JOIN departments d ON i.assigned_authority_id = d.id
WHERE i.created_at >= (NOW() - INTERVAL '2 years')
GROUP BY DATE_TRUNC('day', i.created_at), DATE_TRUNC('week', i.created_at), DATE_TRUNC('month', i.created_at),
         EXTRACT(hour FROM i.created_at), TO_CHAR(i.created_at, 'Day'), i.category, i.status, 
         i.severity_level, i.priority_level, 
         CASE WHEN i.latitude IS NOT NULL AND i.longitude IS NOT NULL 
              THEN CONCAT(ROUND(i.latitude::numeric, 2), ',', ROUND(i.longitude::numeric, 2))
              ELSE NULL END, d.name
ORDER BY DATE_TRUNC('day', i.created_at) DESC;

-- Triggers for issues
CREATE TRIGGER generate_issue_reference_trigger
    BEFORE INSERT ON issues
    FOR EACH ROW EXECUTE FUNCTION generate_issue_reference();

CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for issues
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_attachments ENABLE ROW LEVEL SECURITY;

-- Citizens can view their own issues
CREATE POLICY "Citizens view own issues" ON issues
    FOR SELECT USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Citizens can create issues
CREATE POLICY "Citizens can create issues" ON issues
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Officers can view issues assigned to their department
CREATE POLICY "Officers view department issues" ON issues
    FOR SELECT USING (
        assigned_authority_id IN (
            SELECT p.department_id FROM profiles p 
            WHERE p.user_id = auth.uid() AND p.role = 'officer'
        )
    );

-- Admins can view all issues
CREATE POLICY "Admins view all issues" ON issues
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM profiles WHERE role = 'admin'
        )
    );