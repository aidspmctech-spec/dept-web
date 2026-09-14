-- 030_custom_fees_system.sql
-- Implements a robust custom fee system with definitions and explicit student assignments.

-- 1. Custom Fee Definitions
-- Stores the "template" for a fee.
CREATE TABLE public.custom_fee_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_name TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE, -- NULL = all batches
    section TEXT,                                                 -- NULL = all sections ('A', 'B')
    gender TEXT,                                                   -- NULL = all genders ('Male', 'Female')
    created_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date DATE
);

-- 2. Custom Fee Assignments
-- Stores the actual assignment of a fee to a student.
-- This separates the assigned amount from the definition.
CREATE TABLE public.custom_fee_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_fee_id UUID REFERENCES public.custom_fee_definitions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    assigned_amount DECIMAL(12,2) NOT NULL CHECK (assigned_amount >= 0),
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    payment_status TEXT DEFAULT 'PENDING',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_fee UNIQUE (custom_fee_id, student_id)
);

-- 3. RLS Policies

ALTER TABLE public.custom_fee_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fee_assignments ENABLE ROW LEVEL SECURITY;

-- Definitions: Staff full access, Students read-only (if applicable to them)
CREATE POLICY "Staff full access to custom_fee_definitions"
    ON public.custom_fee_definitions FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'STAFF'));

CREATE POLICY "Students read applicable custom_fee_definitions"
    ON public.custom_fee_definitions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            JOIN public.profiles p ON s.id = p.student_id
            WHERE p.user_id = auth.uid()
            AND (
                (custom_fee_definitions.batch_id IS NULL OR custom_fee_definitions.batch_id = s.batch_id)
                AND (custom_fee_definitions.section IS NULL OR custom_fee_definitions.section = s.section)
                AND (custom_fee_definitions.gender IS NULL OR custom_fee_definitions.gender = s.gender)
            )
        )
    );

-- Assignments: Staff full access, Students read their own
CREATE POLICY "Staff full access to custom_fee_assignments"
    ON public.custom_fee_assignments FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'STAFF'));

CREATE POLICY "Students read own custom_fee_assignments"
    ON public.custom_fee_assignments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            JOIN public.profiles p ON s.id = p.student_id
            WHERE p.user_id = auth.uid()
            AND s.id = custom_fee_assignments.student_id
        )
    );
