-- Absolute Role Simplification: Remove ADMIN role and consolidate to STAFF
BEGIN;

-- 1. Migrate any existing ADMIN roles to STAFF
UPDATE public.profiles
SET role = 'STAFF'
WHERE role = 'ADMIN';

-- 2. Since the CHECK constraint on profiles(role) might already be ('STUDENT', 'STAFF')
-- in some versions but ('STUDENT', 'STAFF', 'ADMIN') in others, we ensure it's strict.
-- In PostgreSQL, we must drop and recreate the constraint to change the check.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check CHECK (role IN ('STUDENT', 'STAFF'));

-- 3. Update RLS policies that explicitly check for 'ADMIN'
-- We'll drop and recreate the policies that mentioned ADMIN.

-- Audit Logs Policies
DROP POLICY IF EXISTS "Staff and Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff and Admin can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Staff and Admin can insert audit logs" ON public.audit_logs;
CREATE POLICY "Staff and Admin can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (public.get_my_role() = 'STAFF');

-- Note: Other policies in iids_perfect_master_schema_FINAL.sql already use public.get_my_role() = 'STAFF'.
-- We verify them here just in case of discrepancies.

COMMIT;
