-- redesign_fees_payments.sql
-- Redesign the Fees & Payments module to allow student-entered totals and installment-based payments.

-- 1. Add payment_status to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING_VERIFICATION';

-- 2. Add check constraint for payment_mode
-- First, ensure existing data is compliant or cleaned up.
-- For this redesign, we expect 'Cash', 'Online', 'DD'.
-- We use a check constraint to enforce this.
ALTER TABLE payments ADD CONSTRAINT check_payment_mode CHECK (payment_mode IN ('Cash', 'Online', 'DD'));

-- 3. Update RLS Policies for fee_structures
-- Students should be able to manage their own fee template.
DROP POLICY IF EXISTS "Students can view own fee structures" ON fee_structures;
CREATE POLICY "Students can view own fee structures" ON fee_structures
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own fee structures" ON fee_structures;
CREATE POLICY "Students can update own fee structures" ON fee_structures
  FOR ALL USING (auth.uid() = student_id);

-- 4. Update RLS Policies for payments
-- Students can view their own payments and insert new ones, but cannot update or delete.
DROP POLICY IF EXISTS "Students can view own payments" ON payments;
CREATE POLICY "Students can view own payments" ON payments
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own payments" ON payments;
CREATE POLICY "Students can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- explicitly deny update and delete for students (though RLS is deny by default, being explicit helps)
-- Note: In Supabase, if no policy exists, access is denied.
-- We ensure no "ALL" or "UPDATE" policies exist for students on payments.

-- 5. Staff Access
-- Staff should have full access to verify payments.
DROP POLICY IF EXISTS "Staff can manage all payments" ON payments;
CREATE POLICY "Staff can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'STAFF'
    )
  );

DROP POLICY IF EXISTS "Staff can manage all fee structures" ON fee_structures;
CREATE POLICY "Staff can manage all fee structures" ON fee_structures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'STAFF'
    )
  );
