-- 031_fix_custom_fees_permissions.sql
-- Fixes 42501 permission denied errors and refines RLS for custom fees.

-- 1. Basic Table Privileges
-- Required for the 'authenticated' role to perform any operation on these tables.
GRANT SELECT ON public.custom_fee_definitions TO authenticated;
GRANT SELECT, UPDATE ON public.custom_fee_assignments TO authenticated;

-- 2. custom_fee_assignments RLS
-- Students can only read and update their own assignments.
DROP POLICY IF EXISTS "Students read own custom_fee_assignments" ON public.custom_fee_assignments;
CREATE POLICY "Students read own custom_fee_assignments"
ON public.custom_fee_assignments
FOR SELECT
TO authenticated
USING (student_id = public.get_my_student_id());

DROP POLICY IF EXISTS "Students update own custom_fee_assignments" ON public.custom_fee_assignments;
CREATE POLICY "Students update own custom_fee_assignments"
ON public.custom_fee_assignments
FOR UPDATE
TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

-- 3. custom_fee_definitions RLS
-- Students can only read definitions if they have been explicitly assigned that fee.
DROP POLICY IF EXISTS "Students read applicable custom_fee_definitions" ON public.custom_fee_definitions;
CREATE POLICY "Students read applicable custom_fee_definitions"
ON public.custom_fee_definitions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.custom_fee_assignments
    WHERE custom_fee_assignments.custom_fee_id = custom_fee_definitions.id
    AND custom_fee_assignments.student_id = public.get_my_student_id()
  )
);