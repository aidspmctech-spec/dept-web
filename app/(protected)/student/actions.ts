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
  const paymentDate = formData.get('date') as string;

  console.log('[CUSTOM FEE DIAGNOSTICS] submitPayment:', {
    studentId,
    component,
    amount,
  });

  const paymentModeMap: Record<string, string> = {
    'Cash': 'CASH',
    'Online': 'ONLINE',
    'DD': 'DD',
    'CASH': 'CASH',
    'ONLINE': 'ONLINE',
  };

  const mode = paymentModeMap[rawMode] || (rawMode?.toUpperCase() === 'CASH' || rawMode?.toUpperCase() === 'ONLINE' || rawMode?.toUpperCase() === 'DD' ? rawMode.toUpperCase() : null);

  if (!mode) {
    throw new Error(`Invalid payment mode: ${rawMode}`);
  }

  if (!paymentDate) {
    throw new Error('Please enter the fee payment date.');
  }

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  if (component.startsWith('custom:')) {
    const assignmentId = component.split(':')[1];

    // 1. Verify the assignment exists and belongs to the student
    const { data: assignment, error: assignError } = await supabase
      .from('custom_fee_assignments')
      .select('custom_fee_id, assigned_amount, paid_amount')
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (assignError || !assignment) {
      throw new Error('Invalid custom fee assignment.');
    }

    const pendingAmount = assignment.assigned_amount - assignment.paid_amount;
    if (amount > pendingAmount) {
      throw new Error(`Payment exceeds pending amount. Maximum allowed: ₹${pendingAmount}`);
    }

    // 2. Record the payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        academic_year: '2024-2025',
        fee_component: 'CUSTOM',
        fee_type_id: assignment.custom_fee_id,
        amount: amount,
        payment_mode: mode,
        payment_status: 'VERIFIED',
        payment_date: paymentDate,
      });

    if (paymentError) throw paymentError;

    // 3. Update the assignment record
    const newPaidAmount = assignment.paid_amount + amount;
    const newStatus = newPaidAmount >= assignment.assigned_amount ? 'PAID' : 'PENDING';

    const { error: updateError } = await supabase
      .from('custom_fee_assignments')
      .update({
        paid_amount: newPaidAmount,
        payment_status: newStatus,
        paid_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (updateError) throw updateError;

  } else {
    // Standard payment logic for TUITION, TRANSPORT, HOSTEL
    const paymentData = {
      student_id: studentId,
      academic_year: '2024-2025',
      fee_component: component,
      amount: amount,
      payment_mode: mode,
      payment_status: 'VERIFIED',
      payment_date: paymentDate,
    };

    const { error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData);

    if (paymentError) throw paymentError;
  }

  revalidatePath('/student/fees');
}

export async function makeImmediatePayment(paymentData: { component: string }) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'STUDENT' || !profile.student_id) {
    throw new Error('Unauthorized');
  }

  const studentId = profile.student_id;
  const supabase = await createClient();
  const currentYear = '2024-2025';
  const component = paymentData.component;

  if (component.startsWith('custom:')) {
    const assignmentId = component.split(':')[1];

    // 1. Verify the assignment exists and belongs to the student
    const { data: assignment, error: assignError } = await supabase
      .from('custom_fee_assignments')
      .select('custom_fee_id, assigned_amount, paid_amount')
      .eq('id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (assignError || !assignment) {
      throw new Error('Invalid custom fee assignment.');
    }

    const pendingAmount = assignment.assigned_amount - assignment.paid_amount;
    if (pendingAmount <= 0) {
      throw new Error('This fee is already fully paid.');
    }

    // 2. Record the payment for the full pending amount
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        academic_year: currentYear,
        fee_component: 'CUSTOM',
        fee_type_id: assignment.custom_fee_id,
        amount: pendingAmount,
        payment_mode: 'ONLINE',
        payment_status: 'VERIFIED',
        payment_date: new Date().toISOString(),
      });

    if (paymentError) throw paymentError;

    // 3. Update the assignment record
    const { error: updateError } = await supabase
      .from('custom_fee_assignments')
      .update({
        paid_amount: assignment.assigned_amount,
        payment_status: 'PAID',
        paid_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (updateError) throw updateError;

  } else {
    // Standard payment for TUITION, TRANSPORT, HOSTEL
    // 1. Get the total from fee_structures
    const { data: structure, error: structError } = await supabase
      .from('fee_structures')
      .select('tuition_fee, hostel_fee, transport_fee')
      .eq('student_id', studentId)
      .eq('academic_year', currentYear)
      .maybeSingle();

    if (structError) throw structError;
    if (!structure) throw new Error('Fee structure not found. Please update your totals first.');

    const totalMap: Record<string, number> = {
      TUITION: structure.tuition_fee,
      HOSTEL: structure.hostel_fee,
      TRANSPORT: structure.transport_fee,
    };

    const total = totalMap[component] || 0;
    if (total <= 0) throw new Error('No fee amount specified for this component.');

    // 2. Calculate current paid amount
    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('amount')
      .eq('student_id', studentId)
      .eq('academic_year', currentYear)
      .eq('fee_component', component);

    if (payError) throw payError;

    const paid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const balance = total - paid;

    if (balance <= 0) {
      throw new Error('This fee is already fully paid.');
    }

    // 3. Record payment for the balance
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        academic_year: currentYear,
        fee_component: component,
        amount: balance,
        payment_mode: 'ONLINE',
        payment_status: 'VERIFIED',
        payment_date: new Date().toISOString(),
      });

    if (insertError) throw insertError;
  }

  revalidatePath('/student/fees');
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
  const rawAccommodationType = formData.get('accommodation_type') as string;

  const accommodationTypeMap: Record<string, string | null> = {
    '': null,
    'Hosteller': 'Hosteller',
    'Day Scholar': 'Day Scholar',
  };

  const accommodationType = rawAccommodationType ? (accommodationTypeMap[rawAccommodationType] ?? null) : null;
  const hostelData: any = {};

  if (accommodationType !== undefined) {
    hostelData.accommodation_type = accommodationType;
    if (accommodationType === 'Day Scholar') {
      hostelData.hostel_name = '';
      hostelData.room_number = '';
    } else if (accommodationType === 'Hosteller') {
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
  const rawTransportType = formData.get('transport_type') as string;

  const transportTypeMap: Record<string, string | null> = {
    '': null,
    'OUTBUS': 'OUTBUS',
    'COLLEGE_BUS': 'COLLEGE_BUS',
    'Outbus': 'OUTBUS',
    'College Bus': 'COLLEGE_BUS',
  };

  const transportType = rawTransportType ? (transportTypeMap[rawTransportType] ?? null) : null;
  const transportData: any = {};

  if (transportType !== undefined) {
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
