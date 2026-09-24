/**
 * Setup.gs
 * Administrative tools for DB initialization
 */

function initializeDatabase() {
  const sheets = [
    { name: 'Students', headers: ['RegisterNo', 'Name', 'Batch', 'Section', 'Email', 'Phone', 'Gender', 'Department', 'Semester', 'Status', 'CreatedAt', 'UpdatedAt'] },
    { name: 'AccessKeys', headers: ['RegisterNo', 'SecretKeyHash', 'Role', 'Status', 'LastLogin', 'CreatedAt', 'UpdatedAt'] },
    { name: 'Fees', headers: ['FeeID', 'RegisterNo', 'AcademicYear', 'Semester', 'FeeType', 'TotalAmount', 'DueDate', 'Status', 'CreatedAt', 'UpdatedAt'] },
    { name: 'Payments', headers: ['PaymentID', 'FeeID', 'RegisterNo', 'Amount', 'PaymentDate', 'PaymentMode', 'TransactionReference', 'RecordedBy', 'CreatedAt'] },
    { name: 'Hostel', headers: ['RegisterNo', 'AccommodationType', 'HostelName', 'RoomNumber', 'HostelFee', 'MessFee', 'Status', 'UpdatedAt'] },
    { name: 'Transport', headers: ['RegisterNo', 'UsesCollegeBus', 'Route', 'BusNumber', 'TransportFee', 'Status', 'UpdatedAt'] },
    { name: 'Academics', headers: ['AcademicID', 'RegisterNo', 'AcademicYear', 'Semester', 'SGPA', 'CGPA', 'Backlogs', 'AcademicRemarks', 'AcademicStatus', 'UpdatedAt'] },
    { name: 'Achievements', headers: ['AchievementID', 'RegisterNo', 'Category', 'EventName', 'Organizer', 'EventDate', 'Level', 'Position', 'Description', 'ProofReference', 'VerificationStatus', 'VerifiedBy', 'VerifiedAt', 'CreatedAt', 'UpdatedAt'] },
    { name: 'Certifications', headers: ['CertificationID', 'RegisterNo', 'CourseName', 'Platform', 'CompletionDate', 'Score', 'CertificateURL', 'ProofReference', 'VerificationStatus', 'VerifiedBy', 'VerifiedAt', 'CreatedAt'] },
    { name: 'Activities', headers: ['ActivityID', 'RegisterNo', 'ActivityName', 'Date', 'Role', 'Description'] },
    { name: 'Staff', headers: ['StaffID', 'Name', 'Email', 'Phone', 'Role', 'Department'] },
    { name: 'AuditLog', headers: ['LogID', 'Timestamp', 'UserID', 'Role', 'Action', 'Module', 'RecordID', 'RegisterNo', 'OldValue', 'NewValue', 'Result', 'Remarks'] },
    { name: 'Settings', headers: ['SettingKey', 'SettingValue', 'Description'] },
    { name: 'Sessions', headers: ['Token', 'RegisterNo', 'Role', 'CreatedAt', 'ExpiresAt'] }
  ];

  const ss = getSS();

  sheets.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
    }
    sheet.clear();
    sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers]);
    sheet.setFrozenRows(1);
  });

  return "Database initialized successfully!";
}

function seedDemoData() {
  // 1. Seed Settings
  Utils.appendRow('Settings', { SettingKey: 'DeptName', SettingValue: 'Artificial Intelligence and Data Science', Description: 'Department Name' });
  Utils.appendRow('Settings', { SettingKey: 'AcademicYear', SettingValue: '2026-2027', Description: 'Current Academic Year' });

  // 2. Seed a Student
  const regNo = '23AD101';
  Utils.appendRow('Students', {
    RegisterNo: regNo,
    Name: 'John Doe',
    Batch: '2023',
    Section: 'A',
    Email: 'john.doe@college.edu',
    Phone: '9876543210',
    Gender: 'Male',
    Department: 'AI&DS',
    Semester: 5,
    Status: 'ACTIVE',
    CreatedAt: Utils.now(),
    UpdatedAt: Utils.now()
  });

  // 3. Seed Access Key for Student
  // Secret key for demo: AIDS-DEMO-123
  Utils.appendRow('AccessKeys', {
    RegisterNo: regNo,
    SecretKeyHash: Utils.hashKey('AIDS-DEMO-123'),
    Role: 'STUDENT',
    Status: 'ACTIVE',
    CreatedAt: Utils.now(),
    UpdatedAt: Utils.now()
  });

  // 4. Seed Demo Fees for Student
  const tuitionFeeId = 'FEE-001';
  Utils.appendRow('Fees', {
    FeeID: tuitionFeeId,
    RegisterNo: regNo,
    AcademicYear: '2026-2027',
    Semester: 5,
    FeeType: 'Tuition',
    TotalAmount: 45000,
    DueDate: '2026-09-30',
    Status: 'PENDING',
    CreatedAt: Utils.now(),
    UpdatedAt: Utils.now()
  });

  Utils.appendRow('Fees', {
    FeeID: 'FEE-002',
    RegisterNo: regNo,
    AcademicYear: '2026-2027',
    Semester: 5,
    FeeType: 'Transport',
    TotalAmount: 12000,
    DueDate: '2026-09-30',
    Status: 'PENDING',
    CreatedAt: Utils.now(),
    UpdatedAt: Utils.now()
  });

  // 5. Seed Demo Payments for Student
  Utils.appendRow('Payments', {
    PaymentID: 'PAY-001',
    FeeID: tuitionFeeId,
    RegisterNo: regNo,
    Amount: 20000,
    PaymentDate: '2026-08-15',
    PaymentMode: 'Online',
    TransactionReference: 'TXN123456789',
    RecordedBy: 'SYSTEM',
    CreatedAt: Utils.now()
  });

  Utils.appendRow('Payments', {
    PaymentID: 'PAY-002',
    FeeID: tuitionFeeId,
    RegisterNo: regNo,
    Amount: 10000,
    PaymentDate: '2026-08-20',
    PaymentMode: 'Bank Transfer',
    TransactionReference: 'TXN987654321',
    RecordedBy: 'STAFF-001',
    CreatedAt: Utils.now()
  });

  // 6. Seed Hostel Data for Student
  Utils.appendRow('Hostel', {
    RegisterNo: regNo,
    AccommodationType: 'Hosteller',
    HostelName: 'Nilgiri Hostel',
    RoomNumber: 'B-204',
    HostelFee: 60000,
    MessFee: 30000,
    Status: 'ACTIVE',
    UpdatedAt: Utils.now()
  });

  // 7. Seed Transport Data for Student
  Utils.appendRow('Transport', {
    RegisterNo: regNo,
    UsesCollegeBus: true,
    Route: 'Route 12 - Central City',
    BusNumber: 'KA-01-F-1234',
    TransportFee: 12000,
    Status: 'ACTIVE',
    UpdatedAt: Utils.now()
  });

  // 8. Seed Demo Academic Records for Student
  Utils.appendRow('Academics', {
    AcademicID: 'ACAD-001',
    RegisterNo: regNo,
    AcademicYear: '2024-2025',
    Semester: 3,
    SGPA: 8.4,
    CGPA: 8.2,
    Backlogs: 0,
    AcademicRemarks: 'Consistent performer',
    AcademicStatus: 'PROMOTED',
    UpdatedAt: Utils.now()
  });

  Utils.appendRow('Academics', {
    AcademicID: 'ACAD-002',
    RegisterNo: regNo,
    AcademicYear: '2025-2026',
    Semester: 4,
    SGPA: 7.8,
    CGPA: 8.0,
    Backlogs: 1,
    AcademicRemarks: 'Needs improvement in Mathematics',
    AcademicStatus: 'PROMOTED',
    UpdatedAt: Utils.now()
  });

  // 9. Seed Demo Achievements for Student
  Utils.appendRow('Achievements', {
    AchievementID: 'ACH-001',
    RegisterNo: regNo,
    Category: 'Hackathon',
    EventName: 'Smart India Hackathon',
    Organizer: 'Govt of India',
    EventDate: '2025-10-12',
    Level: 'National',
    Position: 'Winner',
    Description: 'Built an AI-powered waste management system',
    ProofReference: 'URL_TO_CERT',
    VerificationStatus: 'VERIFIED',
    VerifiedBy: 'STF-001',
    VerifiedAt: Utils.now(),
    CreatedAt: Utils.now(),
    UpdatedAt: Utils.now()
  });

  Utils.appendRow('Achievements', {
    AchievementID: 'ACH-002',
    RegisterNo: regNo,
    Category: 'Coding Competition',
    EventName: 'LeetCode Weekly',
    Organizer: 'LeetCode',
    EventDate: '2026-01-05',
    Level: 'International',
    Position: 'Participant',
    Description: 'Ranked top 5% in contest',
    ProofReference: 'PROFILE_URL',
    VerificationStatus: 'PENDING',
    CreatedAt: Utils.now(),
    UpdatedAt: Utils.now()
  });

  // 10. Seed Demo Certifications for Student
  Utils.appendRow('Certifications', {
    CertificationID: 'CERT-001',
    RegisterNo: regNo,
    CourseName: 'Deep Learning Specialization',
    Platform: 'Coursera',
    CompletionDate: '2025-12-20',
    Score: '98%',
    CertificateURL: 'URL_TO_CERT',
    ProofReference: 'REF-123',
    VerificationStatus: 'VERIFIED',
    VerifiedBy: 'STF-001',
    VerifiedAt: Utils.now(),
    CreatedAt: Utils.now()
  });

  // 11. Seed a Staff member
  Utils.appendRow('Staff', {
    StaffID: 'STF-001',
    Name: 'Dr. Smith',
    Email: 'smith@college.edu',
    Phone: '1234567890',
    Role: 'STAFF',
    Department: 'AI&DS'
  });

  Utils.appendRow('AccessKeys', {
    RegisterNo: 'STF-001',
    SecretKeyHash: Utils.hashKey('STAFF-DEMO-456'),
    Role: 'STAFF',
    Status: 'ACTIVE',
    CreatedAt: Utils.now(),
    UpdatedAt: Utils.now()
  });

  return "Demo data seeded successfully!";
}
