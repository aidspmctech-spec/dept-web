-- 017_reassert_fee_payment_grants.sql
-- Idempotently re-asserts the grants + RLS policies fee_structures/payments
-- depend on, in case the live project never received the full FINAL schema.

BEGIN;

-- Table-level grants (safe to re-run; GRANT is additive/idempotent)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_structures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;

-- Re-create helper functions defensively, in case they were never created
-- or were dropped by an earlier migration without being recreated.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT student_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1; $$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_student_id() TO authenticated, service_role;

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own fees" ON public.fee_structures;
CREATE POLICY "Students can view own fees" ON public.fee_structures
  FOR SELECT TO authenticated
  USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Staff and Admin can manage fees" ON public.fee_structures;
CREATE POLICY "Staff and Admin can manage fees" ON public.fee_structures
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'STAFF')
  WITH CHECK (public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can view own payments" ON public.payments;
CREATE POLICY "Students can view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Staff and Admin can manage payments" ON public.payments;
CREATE POLICY "Staff and Admin can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'STAFF')
  WITH CHECK (public.get_my_role() = 'STAFF');

-- Add policies for students to manage their own fee totals (self-reporting)
DROP POLICY IF EXISTS "Students can manage own fee totals" ON public.fee_structures;
CREATE POLICY "Students can manage own fee totals" ON public.fee_structures
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.get_my_student_id());

DROP POLICY IF EXISTS "Students can update own fee totals" ON public.fee_structures;
CREATE POLICY "Students can update own fee totals" ON public.fee_structures
  FOR UPDATE TO authenticated
  USING (student_id = public.get_my_student_id())
  WITH CHECK (student_id = public.get_my_student_id());

COMMIT;
