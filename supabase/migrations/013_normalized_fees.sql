-- ============================================================================================
-- MIGRATION: 013_normalized_fees.sql
-- ============================================================================================
-- OBJECTIVE: Transition from a wide fee structure (columns per fee) to a normalized
--            model (one row per fee account) without destroying existing data.
-- ============================================================================================

BEGIN;

-- 1. CREATE THE NORMALIZED TABLE
-- We create a new table to hold the normalized data.
CREATE TABLE public.fee_structures_normalized (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    fee_account TEXT NOT NULL, -- 'TUITION', 'COLLEGE_BUS', 'HOSTEL', 'OTHER'
    fee_name TEXT NOT NULL,
    required_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (required_amount >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, academic_year, fee_account)
);

-- 2. DATA MIGRATION (NON-DESTRUCTIVE)
-- Pivot existing wide columns into rows.
-- We only migrate rows that have a non-zero value or have existing payments.
INSERT INTO public.fee_structures_normalized (student_id, academic_year, fee_account, fee_name, required_amount)
SELECT
    student_id,
    academic_year,
    unnest(ARRAY['TUITION', 'TRANSPORT', 'HOSTEL']),
    unnest(ARRAY['Tuition Fee', 'Transport Fee', 'Hostel Fee']),
    unnest(ARRAY[tuition_fee, transport_fee, hostel_fee])
FROM public.fee_structures;

-- 3. TABLE SWAP
-- Rename the old table to keep it as a backup and rename the new one to the official name.
ALTER TABLE public.fee_structures RENAME TO fee_structures_old;
ALTER TABLE public.fee_structures_normalized RENAME TO fee_structures;

-- 4. UPDATE PAYMENTS VALIDATION
-- Remove the strict CHECK constraint on fee_component to allow 'OTHER' and extensible accounts.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_fee_component_check;

-- 5. RLS POLICIES FOR NORMALIZED TABLE
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own fees"
ON public.fee_structures FOR SELECT TO authenticated
USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

CREATE POLICY "Students can manage own declared fees"
ON public.fee_structures FOR ALL TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

-- 6. INTEGRITY TRIGGER: PREVENT REDUCING REQUIRED BELOW PAID
CREATE OR REPLACE FUNCTION public.protect_fee_reduction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_total_paid DECIMAL(12,2);
BEGIN
    -- Calculate total already paid for this specific component
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.payments
    WHERE student_id = NEW.student_id
      AND academic_year = NEW.academic_year
      AND fee_component = NEW.fee_account;

    IF NEW.required_amount < v_total_paid THEN
        RAISE EXCEPTION 'Cannot reduce required amount below the total already paid (₹%) for this account.', v_total_paid;
    END IF;

    -- Prevent modification of the row identity (immutable keys)
    IF NEW.student_id <> OLD.student_id
       OR NEW.academic_year <> OLD.academic_year
       OR NEW.fee_account <> OLD.fee_account THEN
        RAISE EXCEPTION 'Fee account identity (Student, Year, Account) cannot be modified.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_fee_reduction
BEFORE UPDATE ON public.fee_structures
FOR EACH ROW EXECUTE FUNCTION public.protect_fee_reduction();

-- 7. HARDENED SUBMIT_STUDENT_PAYMENT RPC
CREATE OR REPLACE FUNCTION public.submit_student_payment(
    p_student_id UUID,
    p_academic_year TEXT,
    p_fee_component TEXT,
    p_amount DECIMAL,
    p_payment_date DATE,
    p_payment_mode TEXT,
    p_transaction_reference TEXT
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_auth_student_id UUID;
    v_required_amount DECIMAL(12,2);
    v_total_paid DECIMAL(12,2);
BEGIN
    -- 1. Identity Verification
    SELECT student_id INTO v_auth_student_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
    IF v_auth_student_id IS NULL OR v_auth_student_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized payment submission.';
    END IF;

    -- 2. Validate Required Amount & Lock Row
    SELECT required_amount INTO v_required_amount
    FROM public.fee_structures
    WHERE student_id = p_student_id AND academic_year = p_academic_year AND fee_account = p_fee_component
    FOR UPDATE;

    IF v_required_amount IS NULL THEN
        RAISE EXCEPTION 'No declared requirement found for fee account % in %.', p_fee_component, p_academic_year;
    END IF;

    -- 3. Calculate Current Paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.payments
    WHERE student_id = p_student_id AND academic_year = p_academic_year AND fee_component = p_fee_component;

    -- 4. Payment Lock (Pending = 0)
    IF v_total_paid >= v_required_amount THEN
        RAISE EXCEPTION 'Payment cannot be added because the account % is already fully paid.', p_fee_component;
    END IF;

    -- 5. Overpayment Protection
    IF (v_total_paid + p_amount) > v_required_amount THEN
        RAISE EXCEPTION 'Overpayment detected. Remaining balance: ₹%', (v_required_amount - v_total_paid);
    END IF;

    -- 6. Immutable Transaction Insertion
    INSERT INTO public.payments (student_id, academic_year, fee_component, amount, payment_date, payment_mode, transaction_reference)
    VALUES (p_student_id, p_academic_year, p_fee_component, p_amount, COALESCE(p_payment_date, CURRENT_DATE), p_payment_mode, p_transaction_reference);
END;
$$;

COMMIT;
