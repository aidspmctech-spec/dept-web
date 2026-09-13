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

async function test() {
  loadEnv();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: profile } = await supabase.from('profiles').select('id').single();
  if (!profile) {
    console.log('No profiles found to test constraint.');
    return;
  }

  console.log(`Testing role constraint update for profile ${profile.id}...`);
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'ADMIN' })
    .eq('id', profile.id);

  if (error) {
    console.log('SUCCESS: Constraint blocked update to ADMIN: ' + error.message);
  } else {
    console.log('❌ FAILURE: Database allowed update to ADMIN!');
  }
}

test();
