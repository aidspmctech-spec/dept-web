-- 024_fix_payment_rls.sql
-- Fixes 42501: new row violates row-level security policy for table "payments"
-- Ensures students can insert their own payment records using the correct student identifier.

-- 1. Enable RLS (idempotent)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Remove the incorrect policy from migration 022 (which used auth.uid() incorrectly)
DROP POLICY IF EXISTS "Students can insert own payments" ON public.payments;

-- 3. Create the correct policy
-- Use the public.get_my_student_id() helper which maps auth.uid() -> profiles -> students.id
CREATE POLICY "Students can insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = public.get_my_student_id()
);

-- 4. Ensure the SELECT policy is also using the helper for consistency
DROP POLICY IF EXISTS "Students can view own payments" ON public.payments;
CREATE POLICY "Students can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  student_id = public.get_my_student_id()
  OR public.get_my_role() = 'STAFF'
);
