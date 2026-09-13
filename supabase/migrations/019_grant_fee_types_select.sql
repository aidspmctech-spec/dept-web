-- Grant table-level SELECT permission to authenticated users for custom fee types.
-- This allows the existing RLS policy "Students read applicable fee_types" to be evaluated.

GRANT SELECT ON public.fee_types TO authenticated;
