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

async function verify() {
  loadEnv();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.log('--- Checking for ADMIN roles ---');
  const { data: admins, error: adminErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('role', 'ADMIN');
  
  if (adminErr) {
    console.error('Error checking admins:', adminErr.message);
  } else {
    console.log(`Found ${admins.length} ADMIN roles.`);
    admins.forEach(a => console.log(`ID: ${a.id}`));
  }

  console.log('\n--- Testing ADMIN constraint ---');
  // Attempt to create a dummy profile with role 'ADMIN'
  // Note: needs a valid user_id, so we'll just use a random UUID
  const { error: constraintErr } = await supabase
    .from('profiles')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // dummy
      role: 'ADMIN'
    });

  if (constraintErr) {
    console.log('Constraint successfully blocked ADMIN role: ' + constraintErr.message);
  } else {
    console.log('❌ FAILURE: Database accepted ADMIN role!');
  }
}

verify();
