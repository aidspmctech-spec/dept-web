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
-- 2. NEW SIMPLIFIED FEE MODEL (Student-Owned)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.student_fee_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    student_type TEXT CHECK (student_type IN ('HOSTELLER', 'DAY_SCHOLAR')),
    transport_type TEXT CHECK (transport_type IN ('OUTBUS', 'COLLEGE_BUS')),
    tuition_total DECIMAL(12,2) DEFAULT 0 CHECK (tuition_total >= 0),
    tuition_paid DECIMAL(12,2) DEFAULT 0 CHECK (tuition_paid >= 0),
    hostel_total DECIMAL(12,2) DEFAULT 0 CHECK (hostel_total >= 0),
    hostel_paid DECIMAL(12,2) DEFAULT 0 CHECK (hostel_paid >= 0),
    bus_total DECIMAL(12,2) DEFAULT 0 CHECK (bus_total >= 0),
    bus_paid DECIMAL(12,2) DEFAULT 0 CHECK (bus_paid >= 0),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (student_id, academic_year)
);

-- DATA PRESERVATION: Migrate data from old authoritative model
-- 1. Migrate base totals from fee_structures
INSERT INTO public.student_fee_details (student_id, academic_year, tuition_total, hostel_total, bus_total)
SELECT student_id, academic_year, tuition_fee, hostel_fee, transport_fee
FROM public.fee_structures
ON CONFLICT (student_id, academic_year) DO NOTHING;

-- 2. Sum existing payments into 'paid' columns
UPDATE public.student_fee_details sfd
SET tuition_paid = (SELECT COALESCE(SUM(amount), 0) FROM public.payments p WHERE p.student_id = sfd.student_id AND p.academic_year = sfd.academic_year AND p.fee_component = 'TUITION'),
    hostel_paid = (SELECT COALESCE(SUM(amount), 0) FROM public.payments p WHERE p.student_id = sfd.student_id AND p.academic_year = sfd.academic_year AND p.fee_component = 'HOSTEL'),
    bus_paid = (SELECT COALESCE(SUM(amount), 0) FROM public.payments p WHERE p.student_id = sfd.student_id AND p.academic_year = sfd.academic_year AND p.fee_component = 'TRANSPORT');

-- NOTE: Old tables (payments, fee_structures) are NOT dropped here for data safety.

-- =========================================================
-- 3. TABLE PRIVILEGES (Role-Based)
-- =========================================================

-- Reset all broad privileges to start clean
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Student-Managed Tables: Grant full CRUD to authenticated
-- RLS will handle the "Only Own Data" restriction
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.students,
    public.profiles,
    public.academic_records,
    public.student_fee_details,
    public.hostel_details,
    public.transport_details,
    public.achievements,
    public.certifications,
    public.activities
TO authenticated;

-- Reference Tables: Read-only for authenticated
GRANT SELECT ON TABLE
    public.batches,
    public.staff,
    public.settings
TO authenticated;

-- Maintain service_role privileges
GRANT SELECT, INSERT, DELETE ON TABLE public.students TO service_role;
GRANT SELECT, INSERT ON TABLE public.profiles TO service_role;

-- =========================================================
-- 4. UNIFIED OWNERSHIP POLICIES (RLS)
-- =========================================================

-- A. TABLES IDENTIFIED BY student_id
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'academic_records', 'student_fee_details',
        'hostel_details', 'transport_details', 'achievements', 'certifications', 'activities'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Students can manage own records" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Staff can view all records" ON public.%I', t);

        -- Policy: Students CRUD own data
        EXECUTE format('CREATE POLICY "Students can manage own records" ON public.%I FOR ALL TO authenticated
                        USING (student_id = public.get_my_student_id())
                        WITH CHECK (student_id = public.get_my_student_id())', t);

        -- Policy: Staff view all
        EXECUTE format('CREATE POLICY "Staff can view all records" ON public.%I FOR SELECT TO authenticated
                        USING (public.get_my_role() IN (''STAFF'', ''ADMIN''))', t);
    END LOOP;
END $$;

-- B. THE STUDENTS TABLE (Identified by id)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can manage own record" ON public.students;
CREATE POLICY "Students can manage own record" ON public.students FOR ALL TO authenticated
USING (id = public.get_my_student_id())
WITH CHECK (id = public.get_my_student_id());

DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
CREATE POLICY "Staff can view all students" ON public.students FOR SELECT TO authenticated
USING (public.get_my_role() = 'STAFF');

-- C. THE PROFILES TABLE (Identified by user_id)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can manage own profile" ON public.profiles;
CREATE POLICY "Students can manage own profile" ON public.profiles FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.get_my_role() = 'STAFF');

-- D. REFERENCE TABLES (Global Read)
DO $$
DECLARE
    t TEXT;
    readonly_tables TEXT[] := ARRAY['batches', 'staff', 'settings'];
BEGIN
    FOREACH t IN ARRAY readonly_tables LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Authenticated users can view" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    END LOOP;
END $$;

-- =========================================================
-- 5. IDENTITY & SECURITY PROTECTION (Triggers)
-- =========================================================

-- Protection for Students Table (Register Number)
CREATE OR REPLACE FUNCTION public.protect_student_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'STUDENT' THEN
        IF NEW.register_number IS DISTINCT FROM OLD.register_number THEN
            RAISE EXCEPTION 'The register number is immutable and cannot be changed by the student.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_student_identity ON public.students;
CREATE TRIGGER trg_protect_student_identity
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.protect_student_identity();

-- Protection for Profiles Table (Role and Student ID)
CREATE OR REPLACE FUNCTION public.protect_profile_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'STUDENT' THEN
        IF NEW.role IS DISTINCT FROM OLD.role
           OR NEW.student_id IS DISTINCT FROM OLD.student_id
           OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Security fields (role, student_id, user_id) cannot be modified by the student.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_security ON public.profiles;
CREATE TRIGGER trg_protect_profile_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security();

COMMIT;
