
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  const sql = `
    ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payment_status TEXT
    DEFAULT 'PENDING_VERIFICATION';

    UPDATE public.payments
    SET payment_status = 'PENDING_VERIFICATION'
    WHERE payment_status IS NULL;

    ALTER TABLE public.payments
    ALTER COLUMN payment_status SET NOT NULL;

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
  `;

  console.log('Attempting to run migration via execute_sql RPC...');
  const { data, error } = await supabase.rpc('execute_sql', { sql });

  if (error) {
    console.error('Error executing SQL:', error);
  } else {
    console.log('Migration successful:', data);
  }
}

runMigration();
