'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Verifies that the authenticated user is a student and owns the provided studentId.
 * Returns the profile if authorized.
 */
async function verifyStudentOwnership(studentId: string | null) {
  if (!studentId) throw new Error('Student ID is required.');
  const profile = await getCurrentProfile();
  if (!profile || profile.student_id !== studentId) {
    throw new Error('Unauthorized: You can only manage your own data.');
  }
  return profile;
}

/**
 * Submits a fee payment using the secure submit_student_payment RPC.
 */
export async function submitPayment(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.student_id) throw new Error('Profile not found');

  const studentId = profile.student_id;
  const supabase = await createClient();

  const academicYear = formData.get('academicYear') as string;
  const feeComponent = formData.get('feeComponent') as string;
  const amount = parseFloat(formData.get('amount') as string) || 0;
  const paymentDate = formData.get('paymentDate') as string;
  const paymentMode = formData.get('paymentMode') as string;
  const transactionReference = formData.get('transactionReference') as string;

  if (!academicYear) throw new Error('Academic year is required');
  if (!feeComponent) throw new Error('Fee component is required');
  if (amount <= 0) throw new Error('Payment amount must be greater than zero');
  if (!paymentDate) throw new Error('Payment date is required');
  if (!paymentMode) throw new Error('Payment mode is required');

  if (paymentMode !== 'CASH' && !transactionReference) {
    throw new Error(`Transaction reference is required for ${paymentMode} payments`);
  }

  const { error } = await supabase.rpc('submit_student_payment', {
    p_student_id: studentId,
    p_academic_year: academicYear,
    p_fee_component: feeComponent,
    p_amount: amount,
    p_payment_date: paymentDate,
    p_payment_mode: paymentMode,
    p_transaction_reference: transactionReference,
  });

  if (error) throw error;

  revalidatePath('/student/fees');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Updates the student's personal profile, hostel details, and transport details.
 * Uses the authenticated client to enforce RLS.
 */
export async function updateStudentProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.student_id) throw new Error('Profile not found');

  const studentId = profile.student_id;
  const supabase = await createClient();

  // 1. Update basic student info
  const studentUpdates: any = {};
  if (formData.get('phone')) studentUpdates.phone = formData.get('phone');
  if (formData.get('gender')) studentUpdates.gender = formData.get('gender');
  if (formData.get('section')) studentUpdates.section = formData.get('section');
  if (formData.get('father_name')) studentUpdates.father_name = formData.get('father_name');
  if (formData.get('address')) studentUpdates.address = formData.get('address');
  if (formData.get('batch_id')) studentUpdates.batch_id = formData.get('batch_id');
  if (formData.get('semester')) studentUpdates.semester = parseInt(formData.get('semester') as string);

  if (Object.keys(studentUpdates).length > 0) {
    const { error } = await supabase.from('students').update(studentUpdates).eq('id', studentId);
    if (error) throw error;
  }

  // 2. Update Hostel Details
  const hostelData: any = {};
  if (formData.get('accommodation_type')) hostelData.accommodation_type = formData.get('accommodation_type');
  if (formData.get('hostel_name')) hostelData.hostel_name = formData.get('hostel_name');
  if (formData.get('room_number')) hostelData.room_number = formData.get('room_number');

  if (Object.keys(hostelData).length > 0) {
    const { error } = await supabase.from('hostel_details').upsert(
      { ...hostelData, student_id: studentId },
      { onConflict: 'student_id' }
    );
    if (error) throw error;
  }

  // 3. Update Transport Details
  const transportData: any = {};
  const transportType = formData.get('transport_type');
  if (transportType !== null) transportData.transport_type = transportType;
  if (formData.get('route')) transportData.route = formData.get('route');
  if (formData.get('bus_number')) transportData.bus_number = formData.get('bus_number');

  if (Object.keys(transportData).length > 0) {
    const { error } = await supabase.from('transport_details').upsert(
      { ...transportData, student_id: studentId },
      { onConflict: 'student_id' }
    );
    if (error) throw error;
  }

  revalidatePath('/student/profile');
  revalidatePath('/dashboard');
}

/**
 * Adds a new achievement record for the student.
 */
export async function addAchievement(formData: FormData) {
  const profile = await verifyStudentOwnership(formData.get('studentId') as string);
  const supabase = await createClient();

  const achievement = {
    student_id: profile.student_id,
    category: formData.get('category'),
    event_name: formData.get('eventName'),
    organizer: formData.get('organizer'),
    event_date: formData.get('eventDate'),
    level: formData.get('level'),
    position: formData.get('position'),
    description: formData.get('description'),
  };

  const { error } = await supabase.from('achievements').insert(achievement);
  if (error) throw error;

  revalidatePath('/student/achievements');
  revalidatePath('/dashboard');
}

/**
 * Adds a new certification record for the student.
 */
export async function addCertification(formData: FormData) {
  const profile = await verifyStudentOwnership(formData.get('studentId') as string);
  const supabase = await createClient();

  const cert = {
    student_id: profile.student_id,
    course_name: formData.get('courseName'),
    platform: formData.get('platform'),
    completion_date: formData.get('completionDate'),
    score: formData.get('score'),
    certificate_url: formData.get('certificateUrl'),
    description: formData.get('description'),
  };

  const { error } = await supabase.from('certifications').insert(cert);
  if (error) throw error;

  revalidatePath('/student/certifications');
  revalidatePath('/dashboard');
}

/**
 * Adds a new activity record for the student.
 */
export async function addActivity(formData: FormData) {
  const profile = await verifyStudentOwnership(formData.get('studentId') as string);
  const supabase = await createClient();

  const activity = {
    student_id: profile.student_id,
    activity_name: formData.get('activityName'),
    date: formData.get('date'),
    role: formData.get('role'),
    description: formData.get('description'),
  };

  const { error } = await supabase.from('activities').insert(activity);
  if (error) throw error;

  revalidatePath('/student/activities');
  revalidatePath('/dashboard');
}

/**
 * Placeholder for fee details update – not part of current task.
 */
export async function updateFeeDetails(formData: FormData) {
  return { success: true };
}
