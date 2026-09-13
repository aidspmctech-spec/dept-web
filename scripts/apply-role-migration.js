const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = '.env.local';
  if (!fs.existsSync(envPath)) process.exit(1);
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > -1) {
      const key = trimmed.substring(0, eq).trim();
      const val = trimmed.substring(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

async function apply() {
  loadEnv();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('--- Migrating ADMIN to STAFF ---');
  const { data: admins, error: adminErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'ADMIN');
  
  if (adminErr) {
    console.error('Error fetching admins:', adminErr.message);
    process.exit(1);
  }

  if (admins.length === 0) {
    console.log('No ADMIN roles found to migrate.');
  } else {
    console.log(`Migrating ${admins.length} ADMIN roles...`);
    const ids = admins.map(a => a.id);
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ role: 'STAFF' })
      .in('id', ids);
    
    if (updateErr) {
      console.error('Migration failed:', updateErr.message);
      process.exit(1);
    }
    console.log('Successfully converted ADMIN roles to STAFF.');
  }
}

apply();
