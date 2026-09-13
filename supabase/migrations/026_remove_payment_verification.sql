-- 026_remove_payment_verification.sql
-- Removes the payment verification system and treats all payments as final.

-- 1. Mark all existing pending payments as verified
UPDATE public.payments
SET payment_status = 'VERIFIED'
WHERE payment_status = 'PENDING_VERIFICATION';

-- 2. Update the check constraint to remove PENDING_VERIFICATION
-- We keep VERIFIED as the "Paid" state and REJECTED for any historical corrections.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments
ADD CONSTRAINT payments_status_check
CHECK (
  payment_status IN (
    'VERIFIED',
    'REJECTED'
  )
);
