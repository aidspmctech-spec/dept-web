'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email/gmail';
import { randomUUID } from 'crypto';

export async function createAccount(formData: FormData) {
  // Re‑verify admin role
  const profile = await requireRole(['STAFF']);
  if (!profile) throw new Error('Unauthorized');

  const role = (formData.get('role') as string || '').trim().toUpperCase(); // STUDENT, STAFF
  const name = (formData.get('name') as string || '').trim();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const batchId = (formData.get('batchId') as string || '').trim();
  const phone = (formData.get('phone') as string || '').trim();
  const jobTitle = (formData.get('jobTitle') as string || '').trim();

  // Basic validation
  if (role !== 'STAFF') {
    return { success: false, error: 'Invalid role selected' };
  }
  if (!name || !email) {
    return { success: false, error: 'Name and email are required' };
  }

  const adminSupabase = createAdminClient();

    // Check if an auth user already exists for this email
    // Supabase admin client does not provide a direct getUserByEmail method, so we attempt to create and handle duplicate error.
    // We'll skip explicit check and rely on the createUser error handling.


  // For students, also ensure register number is unique
  // (Student creation moved to self-registration)

  // Generate a random temporary password – never exposed to the admin UI
  const tempPassword = randomUUID();

  let authUserId: string | null = null;
  let domainId: string | null = null; // student_id or staff_id

  try {
    // 1. Create auth user (no email confirmation – they will set password via recovery link)
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
    });
    if (userError) throw userError;
    authUserId = userData.user.id;

    // 2. Insert domain‑specific record
    // STAFF
    const { data: staffData, error: staffError } = await adminSupabase
      .from('staff')
      .insert({
        name,
        email,
        phone: phone || null,
        role: jobTitle || null,
        department: null,
      })
      .select()
      .single();
    if (staffError) throw staffError;
    domainId = staffData.id;

    // 3. Insert profile linking auth user to role and domain entity
    const profilePayload: any = {
      user_id: authUserId,
      role,
      staff_id: domainId,
    };
    const { error: profileError } = await adminSupabase.from('profiles').insert(profilePayload);
    if (profileError) throw profileError;

    // 4. Generate a recovery link (password‑set) and email it
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
      },
    });
    if (linkError) {
      console.error('[STAFF][ACCOUNT] Recovery link generation failed:', linkError.message);
    } else {
      await sendVerificationEmail(email, name, linkData.properties.action_link);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[STAFF][ACCOUNT] Creation error:', err.message);
    // Rollback any partial writes
    if (authUserId) await adminSupabase.auth.admin.deleteUser(authUserId).catch(() => {});
    if (domainId) {
      await adminSupabase.from('staff').delete().eq('id', domainId);
    }
    return { success: false, error: err.message };
  }
}
