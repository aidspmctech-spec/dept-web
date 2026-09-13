BEGIN;

-- =========================================================
-- 1. SECURITY HELPER FUNCTIONS
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT student_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

-- =========================================================
-- 2. DATA PROTECTION FUNCTIONS (TRIGGERS)
-- =========================================================

CREATE OR REPLACE FUNCTION public.protect_student_owned_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_role = 'STUDENT' THEN
        IF NEW.id <> OLD.id
           OR NEW.register_number IS DISTINCT FROM OLD.register_number
           OR NEW.name IS DISTINCT FROM OLD.name
           OR NEW.batch_id IS DISTINCT FROM OLD.batch_id
           OR NEW.section IS DISTINCT FROM OLD.section
           OR NEW.email IS DISTINCT FROM OLD.email
           OR NEW.department IS DISTINCT FROM OLD.department
           OR NEW.semester IS DISTINCT FROM OLD.semester
           OR NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Students cannot modify official student fields.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_hostel_transport_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_role = 'STUDENT' THEN
        IF TG_OP = 'INSERT' THEN
            IF TG_TABLE_NAME = 'hostel_details' THEN
                NEW.hostel_fee := NULL;
                NEW.mess_fee := NULL;
                NEW.status := NULL;
            ELSE
                NEW.transport_fee := NULL;
                NEW.status := NULL;
            END IF;
        ELSE
            IF TG_TABLE_NAME = 'hostel_details' THEN
                IF NEW.student_id IS DISTINCT FROM OLD.student_id
                   OR NEW.hostel_fee IS DISTINCT FROM OLD.hostel_fee
                   OR NEW.mess_fee IS DISTINCT FROM OLD.mess_fee
                   OR NEW.status IS DISTINCT FROM OLD.status THEN
                    RAISE EXCEPTION 'Students cannot modify official hostel fee/status fields.';
                END IF;
            ELSE
                IF NEW.student_id IS DISTINCT FROM OLD.student_id
                   OR NEW.transport_fee IS DISTINCT FROM OLD.transport_fee
                   OR NEW.status IS DISTINCT FROM OLD.status THEN
                    RAISE EXCEPTION 'Students cannot modify official transport fee/status fields.';
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- =========================================================
-- 3. HARDENED PAYMENT RPC
-- =========================================================

CREATE OR REPLACE FUNCTION public.submit_student_payment(
    p_student_id UUID,
    p_academic_year TEXT,
    p_fee_component TEXT,
    p_amount DECIMAL,
    p_payment_date DATE,
    p_payment_mode TEXT,
    p_transaction_reference TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_student_id UUID;
    v_required_amount DECIMAL(12,2);
    v_total_paid DECIMAL(12,2);
BEGIN
    SELECT student_id
    INTO v_auth_student_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_auth_student_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: No student profile associated with your account.';
    END IF;

    IF v_auth_student_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: You cannot submit payments for another student.';
    END IF;

    IF p_academic_year IS NULL OR btrim(p_academic_year) = '' THEN
        RAISE EXCEPTION 'Academic year is required.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    IF p_fee_component IS NULL
       OR p_fee_component NOT IN ('TUITION', 'TRANSPORT', 'HOSTEL') THEN
        RAISE EXCEPTION 'Invalid fee component. Allowed: TUITION, TRANSPORT, HOSTEL.';
    END IF;

    IF p_payment_mode IS NULL
       OR p_payment_mode NOT IN ('CASH', 'ONLINE', 'DD') THEN
        RAISE EXCEPTION 'Invalid payment mode. Allowed modes: CASH, ONLINE, DD.';
    END IF;

    -- Lock the official fee row so concurrent payment attempts serialize.
    SELECT
        CASE
            WHEN p_fee_component = 'TUITION' THEN tuition_fee
            WHEN p_fee_component = 'TRANSPORT' THEN transport_fee
            WHEN p_fee_component = 'HOSTEL' THEN hostel_fee
        END
    INTO v_required_amount
    FROM public.fee_structures
    WHERE student_id = p_student_id
      AND academic_year = p_academic_year
    FOR UPDATE;

    IF v_required_amount IS NULL THEN
        RAISE EXCEPTION 'No fee structure found for the selected academic year.';
    END IF;

    IF v_required_amount <= 0 THEN
        RAISE EXCEPTION 'The % fee is not applicable to your profile.', p_fee_component;
    END IF;

    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM public.payments
    WHERE student_id = p_student_id
      AND academic_year = p_academic_year
      AND fee_component = p_fee_component;

    IF (v_total_paid + p_amount) > v_required_amount THEN
        RAISE EXCEPTION
            'Overpayment detected. Remaining balance: ₹%',
            (v_required_amount - v_total_paid);
    END IF;

    INSERT INTO public.payments (
        student_id,
        academic_year,
        fee_component,
        amount,
        payment_date,
        payment_mode,
        transaction_reference
    )
    VALUES (
        p_student_id,
        p_academic_year,
        p_fee_component,
        p_amount,
        COALESCE(p_payment_date, CURRENT_DATE),
        p_payment_mode,
        p_transaction_reference
    );
END;
$$;

-- =========================================================
-- 4. TABLE PRIVILEGES
-- =========================================================

-- Revoke broad privileges first to ensure we start from a clean slate
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- SELECT privileges for almost everything
GRANT SELECT ON TABLE
    public.batches,
    public.students,
    public.staff,
    public.profiles,
    public.academic_records,
    public.fee_structures,
    public.payments,
    public.hostel_details,
    public.transport_details,
    public.achievements,
    public.certifications,
    public.activities,
    public.settings
TO authenticated;

-- WRITE privileges only for student-managed records
GRANT INSERT, UPDATE, DELETE ON TABLE
    public.students,
    public.hostel_details,
    public.transport_details,
    public.achievements,
    public.certifications,
    public.activities
TO authenticated;

-- Note: academic_records, fee_structures, payments, staff, profiles, batches, audit_logs, settings
-- have NO write privileges for the 'authenticated' role.

GRANT SELECT, INSERT, DELETE ON TABLE public.students TO service_role;
GRANT SELECT, INSERT ON TABLE public.profiles TO service_role;

-- =========================================================
-- 5. RLS ENABLEMENT & POLICIES
-- =========================================================

-- BATCHES
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON public.batches;
CREATE POLICY "Authenticated users can view batches" ON public.batches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff and Admin can manage batches" ON public.batches;
CREATE POLICY "Staff and Admin can manage batches" ON public.batches FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- STUDENTS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own student record" ON public.students;
CREATE POLICY "Students can view own student record" ON public.students FOR SELECT TO authenticated USING (id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Students can update own student record" ON public.students;
CREATE POLICY "Students can update own student record" ON public.students FOR UPDATE TO authenticated USING (id = public.get_my_student_id()) WITH CHECK (id = public.get_my_student_id());
DROP POLICY IF EXISTS "Staff and Admin can manage students" ON public.students;
CREATE POLICY "Staff and Admin can manage students" ON public.students FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- STAFF
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;
CREATE POLICY "Authenticated users can view staff" ON public.staff FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only Admin can manage staff" ON public.staff;
CREATE POLICY "Only Admin can manage staff" ON public.staff FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own or staff/admin profiles" ON public.profiles;
CREATE POLICY "Users can view own or staff/admin profiles" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Only Admin can manage profiles" ON public.profiles;
CREATE POLICY "Only Admin can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- ACADEMIC RECORDS
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own academic records" ON public.academic_records;
CREATE POLICY "Students can view own academic records" ON public.academic_records FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Staff and Admin can manage academic records" ON public.academic_records;
CREATE POLICY "Staff and Admin can manage academic records" ON public.academic_records FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- FEE STRUCTURES
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own fees" ON public.fee_structures;
CREATE POLICY "Students can view own fees" ON public.fee_structures FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Staff and Admin can manage fees" ON public.fee_structures;
CREATE POLICY "Staff and Admin can manage fees" ON public.fee_structures FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- PAYMENTS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own payments" ON public.payments;
CREATE POLICY "Students can view own payments" ON public.payments FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Staff and Admin can manage payments" ON public.payments;
CREATE POLICY "Staff and Admin can manage payments" ON public.payments FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- HOSTEL
ALTER TABLE public.hostel_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own hostel details" ON public.hostel_details;
CREATE POLICY "Students can view own hostel details" ON public.hostel_details FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Students can manage own hostel details" ON public.hostel_details;
CREATE POLICY "Students can manage own hostel details" ON public.hostel_details FOR ALL TO authenticated USING (student_id = public.get_my_student_id()) WITH CHECK (student_id = public.get_my_student_id());
DROP POLICY IF EXISTS "Staff and Admin can manage hostel details" ON public.hostel_details;
CREATE POLICY "Staff and Admin can manage hostel details" ON public.hostel_details FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- TRANSPORT
ALTER TABLE public.transport_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own transport details" ON public.transport_details;
CREATE POLICY "Students can view own transport details" ON public.transport_details FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Students can manage own transport details" ON public.transport_details;
CREATE POLICY "Students can manage own transport details" ON public.transport_details FOR ALL TO authenticated USING (student_id = public.get_my_student_id()) WITH CHECK (student_id = public.get_my_student_id());
DROP POLICY IF EXISTS "Staff and Admin can manage transport details" ON public.transport_details;
CREATE POLICY "Staff and Admin can manage transport details" ON public.transport_details FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- ACHIEVEMENTS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own achievements" ON public.achievements;
CREATE POLICY "Students can view own achievements" ON public.achievements FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Students can manage own achievements" ON public.achievements;
CREATE POLICY "Students can manage own achievements" ON public.achievements FOR ALL TO authenticated USING (student_id = public.get_my_student_id()) WITH CHECK (student_id = public.get_my_student_id());
DROP POLICY IF EXISTS "Staff and Admin can manage achievements" ON public.achievements;
CREATE POLICY "Staff and Admin can manage achievements" ON public.achievements FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- CERTIFICATIONS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own certifications" ON public.certifications;
CREATE POLICY "Students can view own certifications" ON public.certifications FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Students can manage own certifications" ON public.certifications;
CREATE POLICY "Students can manage own certifications" ON public.certifications FOR ALL TO authenticated USING (student_id = public.get_my_student_id()) WITH CHECK (student_id = public.get_my_student_id());
DROP POLICY IF EXISTS "Staff and Admin can manage certifications" ON public.certifications;
CREATE POLICY "Staff and Admin can manage certifications" ON public.certifications FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- ACTIVITIES
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own activities" ON public.activities;
CREATE POLICY "Students can view own activities" ON public.activities FOR SELECT TO authenticated USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Students can manage own activities" ON public.activities;
CREATE POLICY "Students can manage own activities" ON public.activities FOR ALL TO authenticated USING (student_id = public.get_my_student_id()) WITH CHECK (student_id = public.get_my_student_id());
DROP POLICY IF EXISTS "Staff and Admin can manage activities" ON public.activities;
CREATE POLICY "Staff and Admin can manage activities" ON public.activities FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- AUDIT LOGS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff and Admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff and Admin can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.get_my_role() = 'STAFF');
DROP POLICY IF EXISTS "Staff and Admin can insert audit logs" ON public.audit_logs;
CREATE POLICY "Staff and Admin can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'STAFF');

-- SETTINGS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.settings;
CREATE POLICY "Authenticated users can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only Admin can manage settings" ON public.settings;
CREATE POLICY "Only Admin can manage settings" ON public.settings FOR ALL TO authenticated USING (public.get_my_role() = 'STAFF') WITH CHECK (public.get_my_role() = 'STAFF');

-- =========================================================
-- 6. TRIGGER RE-APPLICATION
-- =========================================================

DROP TRIGGER IF EXISTS trg_protect_student_owned_fields ON public.students;
CREATE TRIGGER trg_protect_student_owned_fields
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.protect_student_owned_fields();

DROP TRIGGER IF EXISTS trg_protect_hostel_fields ON public.hostel_details;
CREATE TRIGGER trg_protect_hostel_fields
BEFORE INSERT OR UPDATE ON public.hostel_details
FOR EACH ROW EXECUTE FUNCTION public.protect_hostel_transport_fields();

DROP TRIGGER IF EXISTS trg_protect_transport_fields ON public.transport_details;
CREATE TRIGGER trg_protect_transport_fields
BEFORE INSERT OR UPDATE ON public.transport_details
FOR EACH ROW EXECUTE FUNCTION public.protect_hostel_transport_fields();

COMMIT;
