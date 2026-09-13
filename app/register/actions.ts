'use server';

import { createClient } from '@/lib/supabase/server';
import { batchRepository } from '@/lib/repositories/batchRepository';
import { studentRepository } from '@/lib/repositories/studentRepository';
import { revalidatePath } from 'next/cache';

export async function registerStudent(formData: FormData) {
  const fullName = (formData.get('fullName') as string || '').trim();
  const registerNumber = (formData.get('registerNumber') as string || '').trim().toUpperCase();
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const password = (formData.get('password') as string || '').trim();
  const confirmPassword = (formData.get('confirmPassword') as string || '').trim();
  const batchId = (formData.get('batchId') as string || '').trim();
  const section = (formData.get('section') as string || '').trim().toUpperCase();

  if (!fullName || !registerNumber || !email || !password || !confirmPassword || !batchId || !section) {
    return { success: false, error: 'All fields are required' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long' };
  }

  const supabase = await createClient();

  // 1. Check if register number is already taken
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('register_number', registerNumber)
    .maybeSingle();

  if (existingStudent) {
    return { success: false, error: 'Register number already in use' };
  }

  try {
    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    const authUserId = authData.user?.id;

    if (!authUserId) {
      throw new Error('Authentication failed: No user ID returned');
    }

    // 3. Create Student Record
    // Using studentRepository if available, otherwise direct supabase
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        register_number: registerNumber,
        name: fullName,
        email,
        batch_id: batchId,
        section,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (studentError) throw studentError;
    const studentId = studentData.id;

    // 4. Create Profile Record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUserId,
        role: 'STUDENT',
        student_id: studentId,
      });

    if (profileError) throw profileError;

    revalidatePath('/login');
    return { success: true };

  } catch (err: any) {
    console.error('[REGISTER] Error:', err.message);
    return { success: false, error: err.message };
  }
}
