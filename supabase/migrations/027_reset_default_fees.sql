-- 027_reset_default_fees.sql
-- Resets default fee templates to 0 and prevents auto-sync from overwriting manual updates.

-- 1. Reset base fee templates in settings to '0'
UPDATE public.settings
SET value = '0'
WHERE key IN ('base_tuition_fee', 'base_hostel_fee', 'base_transport_fee');

-- 2. Reset existing fee structures to 0 only if they match the old defaults
-- This preserves values that were manually updated by admins/users.
UPDATE public.fee_structures
SET 
    tuition_fee = CASE WHEN tuition_fee = 50000 THEN 0 ELSE tuition_fee END,
    hostel_fee = CASE WHEN hostel_fee = 20000 THEN 0 ELSE hostel_fee END,
    transport_fee = CASE WHEN transport_fee = 10000 THEN 0 ELSE transport_fee END,
    updated_at = now();

-- 3. Modify the sync function to prevent overwriting manual updates.
-- Change 'ON CONFLICT ... DO UPDATE' to 'ON CONFLICT ... DO NOTHING'.
CREATE OR REPLACE FUNCTION public.sync_student_fee_structure(
    p_student_id UUID,
    p_academic_year TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tuition_base DECIMAL;
    v_hostel_base DECIMAL;
    v_transport_base DECIMAL;
    v_is_hosteller BOOLEAN;
    v_is_bus_user BOOLEAN;
BEGIN
    -- Fetch base rates from settings
    SELECT value::DECIMAL INTO v_tuition_base FROM public.settings WHERE key = 'base_tuition_fee';
    SELECT value::DECIMAL INTO v_hostel_base FROM public.settings WHERE key = 'base_hostel_fee';
    SELECT value::DECIMAL INTO v_transport_base FROM public.settings WHERE key = 'base_transport_fee';

    -- Check hostel status
    SELECT (accommodation_type = 'Hosteller') INTO v_is_hosteller
    FROM public.hostel_details
    WHERE student_id = p_student_id;

    -- Check transport status
    SELECT (transport_type = 'COLLEGE_BUS') INTO v_is_bus_user
    FROM public.transport_details
    WHERE student_id = p_student_id;

    -- Insert fee structure if it doesn't exist. 
    -- We use DO NOTHING to preserve manual updates.
    INSERT INTO public.fee_structures (
        student_id,
        academic_year,
        tuition_fee,
        hostel_fee,
        transport_fee,
        updated_at
    )
    VALUES (
        p_student_id,
        p_academic_year,
        COALESCE(v_tuition_base, 0),
        CASE WHEN v_is_hosteller THEN COALESCE(v_hostel_base, 0) ELSE 0 END,
        CASE WHEN v_is_bus_user THEN COALESCE(v_transport_base, 0) ELSE 0 END,
        now()
    )
    ON CONFLICT (student_id, academic_year) DO NOTHING;
END;
$$;
