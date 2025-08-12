-- Create the generate_booking_ref function
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

-- Create function to increment slot bookings
CREATE OR REPLACE FUNCTION increment_slot_bookings(slot_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE time_slots 
    SET current_bookings = current_bookings + 1 
    WHERE id = slot_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement slot bookings (for cancellations)
CREATE OR REPLACE FUNCTION decrement_slot_bookings(slot_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE time_slots 
    SET current_bookings = GREATEST(0, current_bookings - 1) 
    WHERE id = slot_id;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT generate_booking_ref() as test_booking_ref;

-- Show current schema version for verification
SELECT version();