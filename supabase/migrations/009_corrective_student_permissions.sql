-- ============================================================================================
-- MIGRATION: 009_corrective_student_permissions.sql
-- ============================================================================================
-- OBJECTIVE: Fix "permission denied for table hostel_details" and establish a consistent,
--            secure ownership model for all student-managed tables.
--
-- TARGET ARCHITECTURE:
-- 1. Students: CRUD only on their own records (identified by student_id).
-- 2. Staff/Admin: Read-only access (SELECT) to all student data.
-- 3. Security: Explicit separation of Student CRUD and Staff READ to prevent accidental
--    staff modifications.
-- ============================================================================================

BEGIN;

-- --------------------------------------------------------------------------------------------
-- 1. TABLE-LEVEL GRANTS
-- --------------------------------------------------------------------------------------------
-- We grant basic privileges to the 'authenticated' role so the API can reach the tables.
-- RLS policies then refine exactly which rows and operations are allowed.

-- Student-owned tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.academic_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.student_fee_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hostel_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transport_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.activities TO authenticated;

-- Identity tables (Limited to SELECT and UPDATE)
GRANT SELECT, UPDATE ON TABLE public.students TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Explicitly ensure students cannot DELETE or INSERT their own identity records
REVOKE DELETE ON TABLE public.students FROM authenticated;
REVOKE DELETE ON TABLE public.profiles FROM authenticated;
REVOKE INSERT ON TABLE public.students FROM authenticated;
REVOKE INSERT ON TABLE public.profiles FROM authenticated;

-- --------------------------------------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY (RLS) - OWNERSHIP POLICIES
-- --------------------------------------------------------------------------------------------

-- Helper logic used in policies:
-- - public.get_my_student_id() -> Returns the UUID of the logged-in student.
-- - public.get_my_role()       -> Returns 'STUDENT', 'STAFF', or 'ADMIN'.

-- Macro for Student Ownership: (student_id = public.get_my_student_id())
-- Macro for Staff Access: (public.get_my_role() = 'STAFF')

-- ============================================================================================
-- TABLE: academic_records
-- ============================================================================================
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own academic records" ON public.academic_records;
CREATE POLICY "Students can view own academic records" ON public.academic_records
    FOR SELECT TO authenticated
    USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can manage own academic records" ON public.academic_records;
CREATE POLICY "Students can manage own academic records" ON public.academic_records
    FOR ALL TO authenticated
    USING (student_id = public.get_my_student_id())
    WITH CHECK (student_id = public.get_my_student_id());

-- ============================================================================================
-- TABLE: student_fee_details
-- ============================================================================================
ALTER TABLE public.student_fee_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own fees" ON public.student_fee_details;
CREATE POLICY "Students can view own fees" ON public.student_fee_details
    FOR SELECT TO authenticated
    USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can manage own fees" ON public.student_fee_details;
CREATE POLICY "Students can manage own fees" ON public.student_fee_details
    FOR ALL TO authenticated
    USING (student_id = public.get_my_student_id())
    WITH CHECK (student_id = public.get_my_student_id());

-- ============================================================================================
-- TABLE: hostel_details
-- ============================================================================================
ALTER TABLE public.hostel_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own hostel details" ON public.hostel_details;
CREATE POLICY "Students can view own hostel details" ON public.hostel_details
    FOR SELECT TO authenticated
    USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can manage own hostel details" ON public.hostel_details;
CREATE POLICY "Students can manage own hostel details" ON public.hostel_details
    FOR ALL TO authenticated
    USING (student_id = public.get_my_student_id())
    WITH CHECK (student_id = public.get_my_student_id());

-- ============================================================================================
-- TABLE: transport_details
-- ============================================================================================
ALTER TABLE public.transport_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own transport details" ON public.transport_details;
CREATE POLICY "Students can view own transport details" ON public.transport_details
    FOR SELECT TO authenticated
    USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can manage own transport details" ON public.transport_details;
CREATE POLICY "Students can manage own transport details" ON public.transport_details
    FOR ALL TO authenticated
    USING (student_id = public.get_my_student_id())
    WITH CHECK (student_id = public.get_my_student_id());

-- ============================================================================================
-- TABLE: achievements
-- ============================================================================================
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own achievements" ON public.achievements;
CREATE POLICY "Students can view own achievements" ON public.achievements
    FOR SELECT TO authenticated
    USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can manage own achievements" ON public.achievements;
CREATE POLICY "Students can manage own achievements" ON public.achievements
    FOR ALL TO authenticated
    USING (student_id = public.get_my_student_id())
    WITH CHECK (student_id = public.get_my_student_id());

-- ============================================================================================
-- TABLE: certifications
-- ============================================================================================
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own certifications" ON public.certifications;
CREATE POLICY "Students can view own certifications" ON public.certifications
    FOR SELECT TO authenticated
    USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can manage own certifications" ON public.certifications;
CREATE POLICY "Students can manage own certifications" ON public.certifications
    FOR ALL TO authenticated
    USING (student_id = public.get_my_student_id())
    WITH CHECK (student_id = public.get_my_student_id());

-- ============================================================================================
-- TABLE: activities
-- ============================================================================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own activities" ON public.activities;
CREATE POLICY "Students can view own activities" ON public.activities
    FOR SELECT TO authenticated
    USING (student_id = public.get_my_student_id() OR public.get_my_role() = 'STAFF');

DROP POLICY IF EXISTS "Students can manage own activities" ON public.activities;
CREATE POLICY "Students can manage own activities" ON public.activities
    FOR ALL TO authenticated
    USING (student_id = public.get_my_student_id())
    WITH CHECK (student_id = public.get_my_student_id());

COMMIT;
