BEGIN;

-- Fix for "permission denied for table certifications" error.
-- Ensure the authenticated role has the necessary privileges on the certifications table.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.certifications TO authenticated;

-- Ensure RLS is enabled for the certifications table.
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Re-create the student ownership policy to ensure it is correctly applied.
-- This policy allows authenticated students to manage (SELECT, INSERT, UPDATE, DELETE)
-- their own certifications based on their profile's student_id.
DROP POLICY IF EXISTS "Students can manage own certifications" ON public.certifications;
CREATE POLICY "Students can manage own certifications"
ON public.certifications FOR ALL TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

-- Re-create the staff and admin management policy.
-- This policy allows staff and admins to manage all certifications.
DROP POLICY IF EXISTS "Staff and Admin can manage certifications" ON public.certifications;
CREATE POLICY "Staff and Admin can manage certifications"
ON public.certifications FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

COMMIT;
