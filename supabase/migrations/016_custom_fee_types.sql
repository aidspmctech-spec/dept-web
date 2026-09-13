-- Create custom fee types table
CREATE TABLE public.fee_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                          -- e.g. "Dress Fee", "Book Fee"
    academic_year TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    target_batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,  -- NULL = all batches
    target_section TEXT,                          -- NULL = all sections
    target_gender TEXT,                            -- NULL = all genders; else e.g. 'Male' / 'Female'
    created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relax existing payments.fee_component CHECK constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_fee_component_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_fee_component_check
    CHECK (fee_component IN ('TUITION', 'TRANSPORT', 'HOSTEL', 'CUSTOM'));

-- Link payments to custom fee types
ALTER TABLE public.payments ADD COLUMN fee_type_id UUID REFERENCES public.fee_types(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.fee_types ENABLE ROW LEVEL SECURITY;

-- Policies for fee_types
-- Staff and Admin can do everything
CREATE POLICY "Staff and Admin full access to fee_types"
    ON public.fee_types
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'STAFF'
        )
    );

-- Students can read fees that target them
CREATE POLICY "Students read applicable fee_types"
    ON public.fee_types
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            JOIN public.profiles p ON s.id = p.student_id
            WHERE p.user_id = auth.uid()
            AND (
                (fee_types.target_batch_id IS NULL OR fee_types.target_batch_id = s.batch_id)
                AND (fee_types.target_section IS NULL OR fee_types.target_section = s.section)
                AND (fee_types.target_gender IS NULL OR fee_types.target_gender = s.gender)
            )
        )
    );
