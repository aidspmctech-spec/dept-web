-- 033_auto_assign_custom_fees.sql
-- Implements automatic inheritance of custom fees based on targeting rules
-- whenever a student is created or their targeting attributes change.

CREATE OR REPLACE FUNCTION public.handle_custom_fee_inheritance()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Identify and insert matching custom fee assignments
    -- We use 'INSERT INTO ... SELECT' to handle bulk assignment of all matching active fees.
    -- The targeting logic follows the "NULL as wildcard" pattern:
    -- - batch_id is NULL OR matches student's batch_id
    -- - section is NULL OR matches student's section
    -- - gender is NULL OR matches student's gender

    INSERT INTO public.custom_fee_assignments (
        custom_fee_id,
        student_id,
        assigned_amount,
        payment_status,
        assigned_at
    )
    SELECT
        d.id,
        NEW.id,
        d.amount,
        'PENDING',
        now()
    FROM public.custom_fee_definitions d
    WHERE
        (d.batch_id IS NULL OR d.batch_id = NEW.batch_id)
        AND (d.section IS NULL OR d.section = NEW.section)
        AND (d.gender IS NULL OR d.gender = NEW.gender)
        -- We only assign active fees.
        -- (Note: Based on the schema, there isn't an 'is_active' boolean,
        -- but usually, the existence of the definition in this table implies it's active
        -- unless a status column exists. If a status column was added later, we'd filter here.)
    ON CONFLICT (custom_fee_id, student_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the students table
-- It fires AFTER INSERT (new students) and AFTER UPDATE (when batch/section/gender changes)
DROP TRIGGER IF EXISTS tr_students_custom_fee_inheritance ON public.students;
CREATE TRIGGER tr_students_custom_fee_inheritance
    AFTER INSERT OR UPDATE OF batch_id, section, gender
    ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_custom_fee_inheritance();
