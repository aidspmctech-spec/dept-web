-- 025_fix_payment_mode_constraint.sql
-- Fixes 23514: new row for relation "payments" violates check constraint "payments_payment_mode_check"
-- Ensures a consistent uppercase constraint for payment modes across the system.

-- 1. Drop any potentially conflicting constraints
-- migration 022 used 'check_payment_mode'
-- Master schema uses 'payments_payment_mode_check'
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS check_payment_mode;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_mode_check;

-- 2. Re-create the constraint with uppercase values as per the Master Schema
-- This ensures consistency between the application (sending uppercase) and the DB.
ALTER TABLE public.payments
ADD CONSTRAINT payments_payment_mode_check
CHECK (payment_mode IN ('CASH', 'ONLINE', 'DD'));
