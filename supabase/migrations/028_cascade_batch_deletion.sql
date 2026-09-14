-- 028_cascade_batch_deletion.sql
-- Implements cascading deletion for batches and all related student data.

-- 1. Update foreign keys to use ON DELETE CASCADE
-- This ensures that when a student is deleted, all their dependent records are automatically removed.

-- Note: We must drop existing constraints first to redefine them with CASCADE.

-- Academic Records
ALTER TABLE public.academic_records 
DROP CONSTRAINT IF EXISTS academic_records_student_id_fkey;
ALTER TABLE public.academic_records 
ADD CONSTRAINT academic_records_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Fee Structures
ALTER TABLE public.fee_structures 
DROP CONSTRAINT IF EXISTS fee_structures_student_id_fkey;
ALTER TABLE public.fee_structures 
ADD CONSTRAINT fee_structures_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Payments
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_student_id_fkey;
ALTER TABLE public.payments 
ADD CONSTRAINT payments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Hostel Details
ALTER TABLE public.hostel_details 
DROP CONSTRAINT IF EXISTS hostel_details_student_id_fkey;
ALTER TABLE public.hostel_details 
ADD CONSTRAINT hostel_details_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Transport Details
ALTER TABLE public.transport_details 
DROP CONSTRAINT IF EXISTS transport_details_student_id_fkey;
ALTER TABLE public.transport_details 
ADD CONSTRAINT transport_details_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Achievements
ALTER TABLE public.achievements 
DROP CONSTRAINT IF EXISTS achievements_student_id_fkey;
ALTER TABLE public.achievements 
ADD CONSTRAINT achievements_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Certifications
ALTER TABLE public.certifications 
DROP CONSTRAINT IF EXISTS certifications_student_id_fkey;
ALTER TABLE public.certifications 
ADD CONSTRAINT certifications_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Activities
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_student_id_fkey;
ALTER TABLE public.activities 
ADD CONSTRAINT activities_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Profiles
-- Profiles link to both users (auth) and students.
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_student_id_fkey;
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Finally, update the Students table to cascade from Batches
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_batch_id_fkey;
ALTER TABLE public.students 
ADD CONSTRAINT students_batch_id_fkey 
FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;

COMMIT;
