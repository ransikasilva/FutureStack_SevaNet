-- Document Wallet System Extension

-- Create document types enum for better organization
DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'national_id',
        'birth_certificate', 
        'passport',
        'driver_license',
        'marriage_certificate',
        'education_certificate',
        'medical_report',
        'police_report',
        'bank_statement',
        'utility_bill',
        'employment_letter',
        'photo_passport',
        'photo_id',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update documents table to support wallet functionality
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type document_type;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_wallet_document BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS wallet_category TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Create wallet documents view for easy querying
CREATE OR REPLACE VIEW wallet_documents AS
SELECT 
    d.*,
    p.full_name as citizen_name,
    p.phone as citizen_phone
FROM documents d
JOIN profiles p ON d.citizen_id = p.id
WHERE d.is_wallet_document = TRUE;

-- Function to check if citizen has required documents in wallet
CREATE OR REPLACE FUNCTION check_wallet_documents(
    citizen_id_param UUID,
    required_docs TEXT[]
) RETURNS TABLE (
    document_type TEXT,
    available BOOLEAN,
    document_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(required_docs) as document_type,
        EXISTS(
            SELECT 1 FROM documents d 
            WHERE d.citizen_id = citizen_id_param 
            AND d.is_wallet_document = TRUE
            AND d.document_category = unnest(required_docs)
            AND d.status = 'approved'
        ) as available,
        (
            SELECT d.id FROM documents d 
            WHERE d.citizen_id = citizen_id_param 
            AND d.is_wallet_document = TRUE
            AND d.document_category = unnest(required_docs)
            AND d.status = 'approved'
            LIMIT 1
        ) as document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-attach wallet documents to appointment
CREATE OR REPLACE FUNCTION attach_wallet_documents_to_appointment(
    appointment_id_param UUID,
    citizen_id_param UUID,
    required_docs TEXT[]
) RETURNS INTEGER AS $$
DECLARE
    doc_count INTEGER := 0;
    doc_type TEXT;
    wallet_doc_id UUID;
BEGIN
    -- Loop through required documents
    FOREACH doc_type IN ARRAY required_docs
    LOOP
        -- Find matching wallet document
        SELECT id INTO wallet_doc_id
        FROM documents
        WHERE citizen_id = citizen_id_param
        AND is_wallet_document = TRUE
        AND document_category = doc_type
        AND status = 'approved'
        LIMIT 1;
        
        -- If found, create a copy linked to appointment
        IF wallet_doc_id IS NOT NULL THEN
            INSERT INTO documents (
                citizen_id,
                appointment_id,
                file_name,
                file_path,
                file_type,
                file_size,
                document_category,
                status,
                is_wallet_document
            )
            SELECT 
                citizen_id,
                appointment_id_param,
                file_name,
                file_path,
                file_type,
                file_size,
                document_category,
                'approved',
                FALSE
            FROM documents 
            WHERE id = wallet_doc_id;
            
            doc_count := doc_count + 1;
        END IF;
    END LOOP;
    
    RETURN doc_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_wallet ON documents(citizen_id, is_wallet_document, document_category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Grant permissions
GRANT SELECT ON wallet_documents TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_wallet_documents TO anon, authenticated;
GRANT EXECUTE ON FUNCTION attach_wallet_documents_to_appointment TO anon, authenticated;