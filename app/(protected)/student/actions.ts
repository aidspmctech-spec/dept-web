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
 * Updates the student's reported fee totals for the current academic year.
 */
export async function updateFeeTotals(formData: FormData) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'STUDENT' || !profile.student_id) {
    throw new Error('Unauthorized');
  }

  const studentId = profile.student_id;
  const supabase = await createClient();

  const tuitionTotal = parseFloat(formData.get('tuitionTotal') as string || '0');
  const hostelTotal = parseFloat(formData.get('hostelTotal') as string || '0');
  const busTotal = parseFloat(formData.get('busTotal') as string || '0');

  const currentYear = '2024-2025';

  const { error } = await supabase
    .from('fee_structures')
    .upsert({
      student_id: studentId,
      academic_year: currentYear,
      tuition_fee: tuitionTotal,
      hostel_fee: hostelTotal,
      transport_fee: busTotal,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id,academic_year' });

  if (error) throw error;

  revalidatePath('/student/fees');
}

/**
 * Submits a new fee payment installment.
 */
export async function submitPayment(formData: FormData) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'STUDENT' || !profile.student_id) {
    throw new Error('Unauthorized');
  }

  const studentId = profile.student_id;
  const supabase = await createClient();

  const amount = parseFloat(formData.get('amount') as string || '0');
  const rawMode = formData.get('mode') as string;
  const component = formData.get('component') as string;

  // Normalize payment mode to uppercase to match database constraint
  const paymentModeMap: Record<string, string> = {
    'Cash': 'CASH',
    'Online': 'ONLINE',
    'DD': 'DD',
    'CASH': 'CASH',
    'ONLINE': 'ONLINE',
    'ONLINE_MODE': 'ONLINE', // safety for any variations
  };

  const mode = paymentModeMap[rawMode] || (rawMode?.toUpperCase() === 'CASH' || rawMode?.toUpperCase() === 'ONLINE' || rawMode?.toUpperCase() === 'DD' ? rawMode.toUpperCase() : null);

  if (!mode) {
    throw new Error(`Invalid payment mode: ${rawMode}`);
  }

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  const { error } = await supabase
    .from('payments')
    .insert({
      student_id: studentId,
      academic_year: '2024-2025',
      fee_component: component,
      amount: amount,
      payment_mode: mode,
      payment_status: 'PENDING_VERIFICATION',
      payment_date: new Date().toISOString(),
    });

  if (error) throw error;

  revalidatePath('/student/fees');
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
  const accommodationType = formData.get('accommodation_type');
  const hostelData: any = {};
  if (accommodationType !== null) {
    hostelData.accommodation_type = accommodationType;
    if (accommodationType === 'Day Scholar') {
      hostelData.hostel_name = '';
      hostelData.room_number = '';
    } else {
      if (formData.get('hostel_name')) hostelData.hostel_name = formData.get('hostel_name');
      if (formData.get('room_number')) hostelData.room_number = formData.get('room_number');
    }
  }

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
  if (transportType !== null) {
    transportData.transport_type = transportType;
    if (transportType === 'COLLEGE_BUS') {
      if (formData.get('route')) transportData.route = formData.get('route');
      if (formData.get('bus_number')) transportData.bus_number = formData.get('bus_number');
    } else {
      transportData.route = '';
      transportData.bus_number = '';
    }
  }

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
