-- 023_fix_payment_status.sql
-- Fixes PGRST204 by ensuring payment_status column exists and is backfilled.

-- 1. Add the column if it doesn't exist
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_status TEXT
DEFAULT 'PENDING_VERIFICATION';

-- 2. Backfill existing rows that might be NULL (if the default didn't apply)
UPDATE public.payments
SET payment_status = 'PENDING_VERIFICATION'
WHERE payment_status IS NULL;

-- 3. Now make it NOT NULL (since we've backfilled)
ALTER TABLE public.payments
ALTER COLUMN payment_status SET NOT NULL;

-- 4. Add the check constraint
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments
ADD CONSTRAINT payments_status_check
CHECK (
  payment_status IN (
    'PENDING_VERIFICATION',
    'VERIFIED',
    'REJECTED'
  )
);
