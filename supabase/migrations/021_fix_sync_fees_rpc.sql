-- Fix sync_student_fee_structure to validate auth.uid() and prevent cross-student modification
BEGIN;

CREATE OR REPLACE FUNCTION public.sync_student_fee_structure(
    p_student_id UUID,
    p_academic_year TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_student_id UUID;
    v_tuition_base DECIMAL;
    v_hostel_base DECIMAL;
    v_transport_base DECIMAL;
    v_is_hosteller BOOLEAN;
    v_is_bus_user BOOLEAN;
BEGIN
    -- 1. SECURITY: Validate that the authenticated user is the student being updated
    -- This prevents any student from triggering a sync for another student's ID.
    SELECT student_id INTO v_auth_student_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_auth_student_id IS NULL OR v_auth_student_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: You cannot synchronize fee structures for another student.';
    END IF;

    -- 2. Fetch base rates from settings
    SELECT value::DECIMAL INTO v_tuition_base FROM public.settings WHERE key = 'base_tuition_fee';
    SELECT value::DECIMAL INTO v_hostel_base FROM public.settings WHERE key = 'base_hostel_fee';
    SELECT value::DECIMAL INTO v_transport_base FROM public.settings WHERE key = 'base_transport_fee';

    -- 3. Check hostel status
    SELECT (accommodation_type = 'Hosteller') INTO v_is_hosteller
    FROM public.hostel_details
    WHERE student_id = p_student_id;

    -- 4. Check transport status
    SELECT (transport_type = 'COLLEGE_BUS') INTO v_is_bus_user
    FROM public.transport_details
    WHERE student_id = p_student_id;

    -- 5. Upsert into fee_structures (Template Generation)
    -- This provides a draft/template. The student can still update the total via the UI.
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
    ON CONFLICT (student_id, academic_year) DO UPDATE SET
        tuition_fee = EXCLUDED.tuition_fee,
        hostel_fee = EXCLUDED.hostel_fee,
        transport_fee = EXCLUDED.transport_fee,
        updated_at = EXCLUDED.updated_at;
END;
$$;

COMMIT;
