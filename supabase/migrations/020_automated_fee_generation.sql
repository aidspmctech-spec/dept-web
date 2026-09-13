-- Automated Fee Generation: Base Fee Templates and Auto-Sync
BEGIN;

-- 1. Define Base Fee Templates in settings
INSERT INTO public.settings (key, value, description)
VALUES
    ('base_tuition_fee', '50000', 'Default tuition fee for all students'),
    ('base_hostel_fee', '20000', 'Default fee for hostellers'),
    ('base_transport_fee', '10000', 'Default fee for college bus users')
ON CONFLICT (key) DO NOTHING;

-- 2. Function to synchronize fee structure based on student details
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

    -- Upsert into fee_structures
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

-- 3. Triggers to auto-sync when personal details change

-- Trigger for hostel_details
CREATE OR REPLACE FUNCTION public.trg_sync_fees_on_hostel_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- We use a fixed academic year or determine it from context.
    -- Since academic_year is required for fee_structures, we'll target the current active year.
    -- In a real app, this might be a setting. For now, we use '2024-2025'.
    PERFORM public.sync_student_fee_structure(NEW.student_id, '2024-2025');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_fees_hostel
AFTER INSERT OR UPDATE ON public.hostel_details
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_fees_on_hostel_change();

-- Trigger for transport_details
CREATE OR REPLACE FUNCTION public.trg_sync_fees_on_transport_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM public.sync_student_fee_structure(NEW.student_id, '2024-2025');
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_fees_transport
AFTER INSERT OR UPDATE ON public.transport_details
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_fees_on_transport_change();

COMMIT;
