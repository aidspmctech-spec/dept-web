'use client';

import React, { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';

interface StudentDetailsClientProps {
  student: any;
  academics: any[];
  feeStructure: any;
  payments: any[];
  achievements: any[];
  certifications: any[];
  activities: any[];
  hostel: any;
  transport: any;
}

export default function StudentDetailsClient({
  student,
  academics,
  feeStructure,
  payments,
  achievements,
  certifications,
  activities,
  hostel,
  transport,
}: StudentDetailsClientProps) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">{student.name}</h1>
          <p className="text-gray-600">Register No: {student.register_number}</p>
        </div >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Change Password
          </button>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            {student.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-[#1a365d] mb-4 border-b pb-2">Contact Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{student.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{student.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium">{student.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Section</span>
                <span className="font-medium">{student.section || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-[#1a365d] mb-4 border-b pb-2">Accommodation & Bus</h3>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-700 mb-1">Hostel</p>
                {hostel ? (
                  <p className="text-gray-600">{hostel.accommodation_type}: {hostel.hostel_name} (Rm {hostel.room_number})</p>
                ) : (
                  <p className="text-gray-400 italic">No details provided</p>
                )}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-700 mb-1">Bus</p>
                {transport ? (
                  <p className="text-gray-600">{transport.transport_type === 'COLLEGE_BUS' ? `Bus Route ${transport.route}` : 'No bus facility'}</p>
                ) : (
                  <p className="text-gray-400 italic">No details provided</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* Academics */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-[#1a365d]">Academic Records</h3>
            </div>
            <div className="overflow-x-auto">
              {academics && academics.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-600 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Year</th>
                      <th className="px-6 py-3 font-semibold">Sem</th>
                      <th className="px-6 py-3 font-semibold">SGPA</th>
                      <th className="px-6 py-3 font-semibold">CGPA</th>
                      <th className="px-6 py-3 font-semibold">Backlogs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {academics.map((rec) => (
                      <tr key={rec.id}>
                        <td className="px-6 py-3">{rec.academic_year}</td>
                        <td className="px-6 py-3">{rec.semester}</td>
                        <td className="px-6 py-3 font-medium">{rec.sgpa || '-'}</td>
                        <td className="px-6 py-3 font-medium">{rec.cgpa || '-'}</td>
                        <td className="px-6 py-3">{rec.backlogs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-400 italic">No academic records found.</div>
              )}
            </div>
          </section>

          {/* Finance */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-[#1a365d]">Financials</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Fee Structure */}
              <div className="grid grid-cols-3 gap-4">
                {feeStructure ? (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-xs text-blue-600 font-medium uppercase">Tuition</p>
                      <p className="text-lg font-bold text-blue-900">₹{feeStructure.tuition_fee}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-xs text-blue-600 font-medium uppercase">Bus Fee</p>
                      <p className="text-lg font-bold text-blue-900">₹{feeStructure.transport_fee}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-xs text-blue-600 font-medium uppercase">Hostel</p>
                      <p className="text-lg font-bold text-blue-900">₹{feeStructure.hostel_fee}</p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 p-4 text-center text-gray-400 italic border border-dashed rounded-lg">
                    No official fee structure assigned.
                  </div>
                )}
              </div>

              {/* Payment Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-600 bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Component</th>
                      <th className="px-4 py-2 font-semibold">Amount</th>
                      <th className="px-4 py-2 font-semibold">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments && payments.length > 0 ? (
                      payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2">{p.payment_date}</td>
                          <td className="px-4 py-2">{p.fee_component}</td>
                          <td className="px-4 py-2 font-medium">₹{p.amount}</td>
                          <td className="px-4 py-2 font-mono text-xs">{p.transaction_reference}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-gray-400 italic">No payments recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Extra-Curriculars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-[#1a365d]">Achievements</h3>
              </div>
              <div className="p-6 space-y-3">
                {achievements && achievements.length > 0 ? (
                  achievements.map((a) => (
                    <div key={a.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="font-bold text-sm text-gray-800">{a.event_name}</p>
                      <p className="text-xs text-gray-500">{a.category} • {a.position}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 italic py-4">No achievements found.</p>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-[#1a365d]">Certifications</h3>
              </div>
              <div className="p-6 space-y-3">
                {certifications && certifications.length > 0 ? (
                  certifications.map((c) => (
                    <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="font-bold text-sm text-gray-800">{c.course_name}</p>
                      <p className="text-xs text-gray-500">{c.platform} • {c.completion_date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 italic py-4">No certifications found.</p>
                )}
              </div>
            </section>
          </div>

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-[#1a365d]">Activities</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities && activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="font-bold text-sm text-gray-800">{act.activity_name}</p>
                    <p className="text-xs text-gray-500">{act.role} • {act.date}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-gray-400 italic py-4">No activities found.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        student={{
          id: student.id,
          name: student.name,
          register_number: student.register_number
        }}
      />
    </div>
  );
}
