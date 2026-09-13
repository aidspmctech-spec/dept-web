'use client';

import React, { useState } from 'react';
import { updateStudentProfile } from '../actions';

interface ProfileFormProps {
  student: {
    phone: string | null;
    gender: string | null;
    section: string | null;
    father_name: string | null;
    address: string | null;
    batch_id: string | null;
    semester: number | null;
  };
  hostel: {
    accommodation_type: string | null;
    hostel_name: string | null;
    room_number: string | null;
  } | null;
  transport: {
    transport_type: string | null;
    route: string | null;
    bus_number: string | null;
  } | null;
  batches: { id: string; name: string }[];
}

export default function ProfileForm({ student, hostel, transport, batches }: ProfileFormProps) {
  const [studentType, setStudentType] = useState(hostel?.accommodation_type || '');
  const [transportType, setTransportType] = useState(transport?.transport_type || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    // Map UI "Student Type" to DB "accommodation_type"
    formData.set('accommodation_type', studentType);
    formData.set('transport_type', transportType);

    // Business Rule: Clear contradicting state in DB
    if (studentType === 'Day Scholar') {
      formData.set('hostel_name', '');
      formData.set('room_number', '');
    } else if (studentType === 'Hosteller') {
      formData.set('transport_type', '');
    }

    try {
      await updateStudentProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while updating profile.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Basic Identity */}
      <div className="space-y-6">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Basic Identity</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input type="text" name="phone" defaultValue={student.phone || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" defaultValue={student.gender || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Father&apos;s Name</label>
            <input type="text" name="father_name" defaultValue={student.father_name || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input type="text" name="address" defaultValue={student.address || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      {/* Section 2: Academic Context */}
      <div className="space-y-6">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Academic Context</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Batch</label>
            <select name="batch_id" defaultValue={student.batch_id || ''} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed outline-none">
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Semester</label>
            <input type="number" name="semester" defaultValue={student.semester || ''} disabled min="1" max="8" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Section</label>
            <select name="section" defaultValue={student.section || ''} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed outline-none">
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Student Type & Details */}
      <div className="space-y-6">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Student Type & Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Student Type</label>
              <select
                value={studentType}
                onChange={(e) => setStudentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Type</option>
                <option value="Day Scholar">Day Scholar</option>
                <option value="Hosteller">Hosteller</option>
              </select>
            </div>

            {studentType === 'Hosteller' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Hostel Name</label>
                  <input type="text" name="hostel_name" defaultValue={hostel?.hostel_name || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Room Number</label>
                  <input type="text" name="room_number" defaultValue={hostel?.room_number || ''} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            {studentType === 'Day Scholar' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Transport Type</label>
                  <select
                    value={transportType}
                    onChange={(e) => setTransportType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="OUTBUS">Outbus</option>
                    <option value="COLLEGE_BUS">College Bus</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500 italic">
                  {transportType === 'COLLEGE_BUS' ? 'College Bus fees will be applicable.' : 'Only tuition fees applicable.'}
                </div>
              </>
            )}
            {studentType !== 'Day Scholar' && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                Transport details not applicable for {studentType || 'selected type'}
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-[#1a365d] text-white rounded-lg font-bold hover:bg-blue-800 transition-all shadow-sm disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </form>
  );
}
