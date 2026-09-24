/**
 * Students.gs
 * Student Management Logic (Version 2.0)
 */

const Students = {
  /**
   * Retrieves all students for the staff view
   */
  getStudents: function(payload) {
    const students = Utils.getSheetData('Students');

    // Apply basic filtering if provided
    let filtered = students;
    if (payload.batch) {
      filtered = filtered.filter(s => s.Batch == payload.batch);
    }
    if (payload.section) {
      filtered = filtered.filter(s => s.Section == payload.section);
    }
    if (payload.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.Name.toLowerCase().includes(search) ||
        s.RegisterNo.toLowerCase().includes(search)
      );
    }

    return {
      status: 'success',
      data: filtered
    };
  },

  /**
   * Creates a new student manually
   */
  createStudent: function(payload) {
    const { regNo, name, batch, section, email, phone, gender, dept, sem, secretKey } = payload;

    if (!regNo || !name || !batch || !section || !secretKey) {
      return { status: 'error', error: 'Missing required fields' };
    }

    // Check if student already exists
    if (Utils.getRowByKey('Students', 'RegisterNo', regNo)) {
      return { status: 'error', error: 'Student with this Register Number already exists' };
    }

    // 1. Add to Students sheet
    Utils.appendRow('Students', {
      RegisterNo: regNo,
      Name: name,
      Batch: batch,
      Section: section,
      Email: email,
      Phone: phone,
      Gender: gender,
      Department: dept,
      Semester: sem,
      Status: 'ACTIVE',
      CreatedAt: Utils.now(),
      UpdatedAt: Utils.now()
    });

    // 2. Add to AccessKeys sheet (Hashed)
    Utils.appendRow('AccessKeys', {
      RegisterNo: regNo,
      SecretKeyHash: Utils.hashKey(secretKey),
      Role: 'STUDENT',
      Status: 'ACTIVE',
      CreatedAt: Utils.now(),
      UpdatedAt: Utils.now()
    });

    Audit.log('AIDS-STAFF', 'STAFF', 'CREATE_STUDENT', 'STUDENTS', 'SUCCESS', `Created student ${regNo}`);

    return {
      status: 'success',
      message: 'Student created successfully'
    };
  },

  /**
   * Deletes a student and their access key
   */
  deleteStudent: function(payload) {
    const { regNo } = payload;
    if (!regNo) return { status: 'error', error: 'Register Number required' };

    // Note: Utils.updateRow doesn't delete.
    // In a real GAS app, we'd use sheet.deleteRow().
    // For this implementation, we'll mark them as INACTIVE.
    const success = Utils.updateRow('Students', 'RegisterNo', regNo, { Status: 'INACTIVE' });
    Utils.updateRow('AccessKeys', 'RegisterNo', regNo, { Status: 'BLOCKED' });

    if (success) {
      Audit.log('AIDS-STAFF', 'STAFF', 'DELETE_STUDENT', 'STUDENTS', 'SUCCESS', `Disabled student ${regNo}`);
      return { status: 'success', message: 'Student account disabled' };
    }

    return { status: 'error', error: 'Student not found' };
  },

  /**
   * Bulk create students from a provided array (from CSV/Excel)
   * Returns an array of RegisterNo and SecretKey for the excel output
   */
  bulkCreateStudents: function(payload) {
    const studentList = payload.students; // Array of student objects
    const createdKeys = [];

    if (!studentList || !Array.isArray(studentList)) {
      return { status: 'error', error: 'Invalid student list provided' };
    }

    studentList.forEach(s => {
      // Generate a unique key for each student if not provided
      const secretKey = s.secretKey || 'AIDS-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      Utils.appendRow('Students', {
        RegisterNo: s.RegisterNo,
        Name: s.Name,
        Batch: s.Batch,
        Section: s.Section,
        Email: s.Email,
        Phone: s.Phone,
        Gender: s.Gender,
        Department: s.Department,
        Semester: s.Semester,
        Status: 'ACTIVE',
        CreatedAt: Utils.now(),
        UpdatedAt: Utils.now()
      });

      Utils.appendRow('AccessKeys', {
        RegisterNo: s.RegisterNo,
        SecretKeyHash: Utils.hashKey(secretKey),
        Role: 'STUDENT',
        Status: 'ACTIVE',
        CreatedAt: Utils.now(),
        UpdatedAt: Utils.now()
      });

      createdKeys.push({
        RegisterNo: s.RegisterNo,
        Name: s.Name,
        SecretKey: secretKey
      });
    });

    Audit.log('AIDS-STAFF', 'STAFF', 'BULK_CREATE_STUDENTS', 'STUDENTS', 'SUCCESS', `Imported ${studentList.length} students`);

    return {
      status: 'success',
      data: createdKeys,
      message: 'Bulk import completed successfully'
    };
  },

  /**
   * Retrieves the profile of an authenticated student
   */
  getProfile: function(registerNo, payload) {
    const student = Utils.getRowByKey('Students', 'RegisterNo', registerNo);
    if (!student) return { status: 'error', error: 'Student not found' };
    return { status: 'success', data: student };
  }
};
