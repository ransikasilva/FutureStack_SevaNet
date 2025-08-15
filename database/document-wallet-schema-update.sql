-- Update check_wallet_documents function to include pending status documents
-- This allows newly uploaded documents to be recognized immediately

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
            AND d.status IN ('approved', 'pending') -- Include pending documents
        ) as available,
        (
            SELECT d.id FROM documents d 
            WHERE d.citizen_id = citizen_id_param 
            AND d.is_wallet_document = TRUE
            AND d.document_category = unnest(required_docs)
            AND d.status IN ('approved', 'pending') -- Include pending documents
            ORDER BY d.uploaded_at DESC -- Get the most recent one
            LIMIT 1
        ) as document_id;
END;
$$ LANGUAGE plpgsql;