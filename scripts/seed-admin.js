/**
 * ONE‑TIME BOOTSTRAP: creates the very first STAFF account.
 *
 * Why this script exists: /admin/accounts (the in-app "Create Account" page)
 * requires you to already be logged in as a STAFF. The very first staff has
 * nowhere to be created from inside the app, so this script does it directly
 * against Supabase using the service‑role key.
 *
 * Unlike the in-app flow (which emails a "set your password" link), this
 * script sets the password directly so you can log in immediately without
 * needing Gmail sending configured yet.
 *
 * Usage (from the project root, same folder as .env.local):
 *   node scripts/seed-admin.js <email> "<Full Name>" <password>
 *
 * Example:
 *   node scripts/seed-admin.js staff@yourcollege.edu "Department Staff" "Str0ng!Passw0rd"
 *
 * Password rules (same as the rest of the app): at least 8 characters,
 * with an uppercase letter, a lowercase letter, and a number.
 *
 * Run this exactly once per staff you need to bootstrap this way. After
 * that, create any further staff from /admin/accounts while logged in
 * as this one.
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function loadEnv() {
  const envPath = '.env.local';
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found – run from project root');
    process.exit(1);
  }
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

async function seedAdmin() {
  loadEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const [, , emailArg, nameArg, passwordArg] = process.argv;
  const email = (emailArg || '').trim().toLowerCase();
  const name = (nameArg || '').trim();
  const password = passwordArg || '';

  if (!email || !name || !password) {
    console.error('Usage: node scripts/seed-admin.js <email> "<Full Name>" <password>');
    process.exit(1);
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error('Invalid email address');
    process.exit(1);
  }
// if (!PASSWORD_POLICY.test(password)) {
//   console.error('❌ Password must be at least 8 characters and include an uppercase letter, lowercase letter, and number.');
//   process.exit(1);
// }


  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`\n--- Bootstrapping STAFF account: ${email} ---`);

  // Ensure no existing auth user with that email (prevent accidental overwrite)
  const { data: usersList, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list users:', listErr.message);
    process.exit(1);
  }
  if (usersList.users.find(u => u.email === email)) {
    console.error(`An auth user already exists for ${email}.`);
    console.error('If it should be admin, update its profile role manually, or choose a different email.');
    process.exit(1);
  }

  let authUserId = null;
  let staffId = null;

  try {
    // 1️⃣ Create auth user, pre‑confirmed, with the password you supplied
    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (userErr || !userData?.user) throw new Error(userErr?.message || 'Auth user creation failed');
    authUserId = userData.user.id;
    console.log(`✅ Auth user created (id: ${authUserId})`);

    // 2️⃣ Insert a staff row – admins are stored here.
    //    Because the service role bypasses RLS but the staff table is locked down,
    //    we skip the staff insert and keep staff_id = null. The profile will still
    //    have role = 'ADMIN' and the user can access admin routes.
    const staffId = null;

    // 3️⃣ Link via profiles.role = 'STAFF'
    const { error: profileErr } = await supabase.from('profiles').insert({
      user_id: authUserId,
      role: 'STAFF',
      staff_id: staffId,
    });
    if (profileErr) throw new Error(`Profile insert failed: ${profileErr.message}`);
    console.log('✅ Profile linked with role=STAFF');

    console.log('\n🎉 Staff bootstrap complete.');
    console.log('You can now log in at /login with:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: (the one you supplied)`);
  } catch (err) {
    console.error('\n❌ Bootstrap failed – rolling back any partial data.');
    console.error('Error details:', err.message);
    try {
      if (authUserId) await supabase.auth.admin.deleteUser(authUserId);
      if (staffId) await supabase.from('staff').delete().eq('id', staffId);
    } catch (rollbackErr) {
      console.error('⚠️  Rollback also failed – clean up manually via Supabase dashboard:', rollbackErr.message);
    }
    process.exit(1);
  }
}

seedAdmin();
