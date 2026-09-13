BEGIN;

-- IIDS STUDENT PORTAL — PERFECT FINAL MASTER DATABASE SCHEMA
-- Consolidated from the actual sequence:
--   iids_master_schema(2).sql
--   012_fees_payments_redesign(1).sql
--   013_schema_reconciliation.sql
--   014_rls_updates.sql
--   015_payment_security.sql
--   016_database_reconciliation.sql
--   017_harden_payment_rpc.sql
--
-- This is a clean final-state schema, NOT a concatenation of migrations.
-- Run only when intentionally replacing the application's public schema.
-- Supabase Auth (auth.users) is NOT deleted.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 0. CLEAN APPLICATION OBJECTS
-- =========================================================

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.transport_details CASCADE;
DROP TABLE IF EXISTS public.hostel_details CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.fee_structures CASCADE;
DROP TABLE IF EXISTS public.fees CASCADE;
DROP TABLE IF EXISTS public.academic_records CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.get_my_student_id();
DROP FUNCTION IF EXISTS public.submit_student_payment(UUID, TEXT, TEXT, DECIMAL, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.protect_student_owned_fields();
DROP FUNCTION IF EXISTS public.set_updated_at();

-- =========================================================
-- 1. TABLES
-- =========================================================

CREATE TABLE public.batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    address TEXT,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    section TEXT,
    email TEXT,
    phone TEXT,
    gender TEXT,
    department TEXT,
    semester INTEGER CHECK (semester IS NULL OR semester > 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT,
    department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'STAFF')),
    student_id UUID UNIQUE REFERENCES public.students(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.academic_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester > 0),
    sgpa DECIMAL(4,2) CHECK (sgpa IS NULL OR (sgpa >= 0 AND sgpa <= 10)),
    cgpa DECIMAL(4,2) CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 10)),
    backlogs INTEGER NOT NULL DEFAULT 0 CHECK (backlogs >= 0),
    remarks TEXT,
    status TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, academic_year, semester)
);

-- Final state after migration 012 + 013:
-- one official fee structure per student per academic year.
-- The obsolete legacy fee model is gone.
CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    tuition_fee DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tuition_fee >= 0),
    transport_fee DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (transport_fee >= 0),
    hostel_fee DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (hostel_fee >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, academic_year)
);

-- Individual payment transactions.
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    fee_component TEXT NOT NULL
        CHECK (fee_component IN ('TUITION', 'TRANSPORT', 'HOSTEL')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode TEXT NOT NULL
        CHECK (payment_mode IN ('CASH', 'ONLINE', 'DD')),
    transaction_reference TEXT,
    recorded_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.hostel_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    accommodation_type TEXT
        CHECK (accommodation_type IN ('Hosteller', 'Day Scholar')),
    hostel_name TEXT,
    room_number TEXT,
    hostel_fee DECIMAL(12,2) CHECK (hostel_fee IS NULL OR hostel_fee >= 0),
    mess_fee DECIMAL(12,2) CHECK (mess_fee IS NULL OR mess_fee >= 0),
    status TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transport_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    transport_type TEXT
        CHECK (transport_type IN ('OUTBUS', 'COLLEGE_BUS')),
    route TEXT,
    bus_number TEXT,
    transport_fee DECIMAL(12,2) CHECK (transport_fee IS NULL OR transport_fee >= 0),
    status TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    category TEXT,
    event_name TEXT NOT NULL,
    organizer TEXT,
    event_date DATE,
    level TEXT,
    position TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    platform TEXT,
    completion_date DATE,
    certificate_id TEXT,
    score TEXT,
    certificate_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    date DATE,
    role TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role TEXT,
    action TEXT NOT NULL,
    module TEXT,
    record_id UUID,
    register_number TEXT,
    old_value JSONB,
    new_value JSONB,
    result TEXT,
    remarks TEXT
);

CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
);

-- =========================================================
-- 2. INDEXES
-- =========================================================

CREATE INDEX idx_students_name ON public.students(name);
CREATE INDEX idx_students_batch_id ON public.students(batch_id);
CREATE INDEX idx_students_email ON public.students(email);
CREATE INDEX idx_students_status ON public.students(status);

-- Unique(student_id, academic_year, semester) already indexes this prefix,
-- so no redundant academic_records index is created.

-- Unique(student_id, academic_year) already indexes fee structures.

CREATE INDEX idx_payments_student_year_component
    ON public.payments(student_id, academic_year, fee_component);
CREATE INDEX idx_payments_academic_year
    ON public.payments(academic_year);

CREATE INDEX idx_audit_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_register_no ON public.audit_logs(register_number);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);

-- =========================================================
-- 3. UPDATED_AT HELPER
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_academic_records_updated_at
BEFORE UPDATE ON public.academic_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_fee_structures_updated_at
BEFORE UPDATE ON public.fee_structures
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_hostel_details_updated_at
BEFORE UPDATE ON public.hostel_details
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_transport_details_updated_at
BEFORE UPDATE ON public.transport_details
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 4. IDENTITY HELPERS
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
-- 5. STUDENT OWNED-FIELD PROTECTION
-- =========================================================
-- RLS protects rows. These triggers additionally protect official fields
-- from being modified by a student through a direct REST/API update.

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

CREATE TRIGGER trg_protect_student_owned_fields
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.protect_student_owned_fields();

-- Protect official hostel/transport values while allowing students to
-- maintain the personal/logistical details they are expected to provide.
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
            -- Students may provide their own logistical details, but not
            -- official fee/status values maintained by staff/admin.
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

CREATE TRIGGER trg_protect_hostel_fields
BEFORE INSERT OR UPDATE ON public.hostel_details
FOR EACH ROW EXECUTE FUNCTION public.protect_hostel_transport_fields();

CREATE TRIGGER trg_protect_transport_fields
BEFORE INSERT OR UPDATE ON public.transport_details
FOR EACH ROW EXECUTE FUNCTION public.protect_hostel_transport_fields();

-- =========================================================
-- 6. HARDENED PAYMENT RPC
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
-- 7. RLS
-- =========================================================

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 8. TABLE PRIVILEGES
-- =========================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
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
    public.audit_logs,
    public.settings
TO authenticated;

-- Server-side registration uses service_role.
GRANT SELECT, INSERT, DELETE ON TABLE public.students TO service_role;
GRANT SELECT, INSERT ON TABLE public.profiles TO service_role;

-- =========================================================
-- 9. RLS POLICIES
-- =========================================================

-- BATCHES
CREATE POLICY "Authenticated users can view batches"
ON public.batches FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Staff and Admin can manage batches"
ON public.batches FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- STUDENTS
CREATE POLICY "Students can view own student record"
ON public.students FOR SELECT TO authenticated
USING (
    id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Students can update own student record"
ON public.students FOR UPDATE TO authenticated
USING (id = public.get_my_student_id())
WITH CHECK (id = public.get_my_student_id());

CREATE POLICY "Staff and Admin can manage students"
ON public.students FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- STAFF
CREATE POLICY "Authenticated users can view staff"
ON public.staff FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only Admin can manage staff"
ON public.staff FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- PROFILES
CREATE POLICY "Users can view own or staff/admin profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Only Admin can manage profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- ACADEMIC RECORDS
CREATE POLICY "Students can view own academic records"
ON public.academic_records FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Staff and Admin can manage academic records"
ON public.academic_records FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- FEE STRUCTURES
CREATE POLICY "Students can view own fees"
ON public.fee_structures FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Staff and Admin can manage fees"
ON public.fee_structures FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- PAYMENTS
CREATE POLICY "Students can view own payments"
ON public.payments FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

-- IMPORTANT: students have NO direct INSERT/UPDATE/DELETE policy.
-- Payment creation must go through submit_student_payment().
CREATE POLICY "Staff and Admin can manage payments"
ON public.payments FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- HOSTEL
CREATE POLICY "Students can view own hostel details"
ON public.hostel_details FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Students can manage own hostel details"
ON public.hostel_details FOR ALL TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

CREATE POLICY "Staff and Admin can manage hostel details"
ON public.hostel_details FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- TRANSPORT
CREATE POLICY "Students can view own transport details"
ON public.transport_details FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Students can manage own transport details"
ON public.transport_details FOR ALL TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

CREATE POLICY "Staff and Admin can manage transport details"
ON public.transport_details FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- ACHIEVEMENTS
CREATE POLICY "Students can view own achievements"
ON public.achievements FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Students can manage own achievements"
ON public.achievements FOR ALL TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

CREATE POLICY "Staff and Admin can manage achievements"
ON public.achievements FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- CERTIFICATIONS
CREATE POLICY "Students can view own certifications"
ON public.certifications FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Students can manage own certifications"
ON public.certifications FOR ALL TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

CREATE POLICY "Staff and Admin can manage certifications"
ON public.certifications FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- ACTIVITIES
CREATE POLICY "Students can view own activities"
ON public.activities FOR SELECT TO authenticated
USING (
    student_id = public.get_my_student_id()
    OR public.get_my_role() = 'STAFF'
);

CREATE POLICY "Students can manage own activities"
ON public.activities FOR ALL TO authenticated
USING (student_id = public.get_my_student_id())
WITH CHECK (student_id = public.get_my_student_id());

CREATE POLICY "Staff and Admin can manage activities"
ON public.activities FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- AUDIT LOGS
CREATE POLICY "Staff and Admin can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.get_my_role() = 'STAFF');

CREATE POLICY "Staff and Admin can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (public.get_my_role() = 'STAFF');

-- SETTINGS
CREATE POLICY "Authenticated users can view settings"
ON public.settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only Admin can manage settings"
ON public.settings FOR ALL TO authenticated
USING (public.get_my_role() = 'STAFF')
WITH CHECK (public.get_my_role() = 'STAFF');

-- =========================================================
-- 10. FUNCTION PRIVILEGES
-- =========================================================

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_student_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_student_payment(
    UUID, TEXT, TEXT, DECIMAL, DATE, TEXT, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_student_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_student_payment(
    UUID, TEXT, TEXT, DECIMAL, DATE, TEXT, TEXT
) TO authenticated;

-- Trigger functions are not API operations and are not granted to clients.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_student_owned_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_hostel_transport_fields() FROM PUBLIC;

COMMIT;
