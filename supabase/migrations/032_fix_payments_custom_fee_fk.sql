ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS custom_fee_assignment_id UUID
        REFERENCES public.custom_fee_assignments(id) ON DELETE SET NULL;
