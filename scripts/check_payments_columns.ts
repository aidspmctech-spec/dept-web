
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .rpc('get_columns', { table_name: 'payments' });

  if (error) {
    console.error('Error fetching columns:', error);
    // Fallback: try querying information_schema directly if get_columns RPC doesn't exist
    const { data: infoData, error: infoError } = await supabase
      .rpc('execute_sql', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'payments'" });

    if (infoError) {
      console.error('Fallback error:', infoError);
    } else {
      console.log('Columns found via execute_sql:', infoData);
    }
  } else {
    console.log('Columns found:', data);
  }
}

checkColumns();
