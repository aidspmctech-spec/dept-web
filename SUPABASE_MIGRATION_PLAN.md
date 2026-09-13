# Supabase Migration Plan: IIDS Student Portal

## 1. Current Architecture
The current application is built as a **Google Apps Script (GAS)** Web App.
- **Frontend**: Static HTML, CSS, and JavaScript files. The JS makes `POST` requests to the GAS backend.
- **Backend**: Google Apps Script (`.gs` files) acting as a serverless API.
- **API Layer**: A central `doPost(e)` function in `Code.gs` that dispatches requests to specific modules based on an `action` parameter.
- **Data Store**: **Google Sheets**. The `Utils.gs` helper converts sheet rows into JSON objects for processing.
- **Deployment**: Hosted on Google Apps Script infrastructure.

## 2. Current Data Model
The data is organized into the following Google Sheets (as defined in `docs/database-schema.md`):
- `Students`: Core student profiles (RegisterNo as PK).
- `AccessKeys`: Authentication credentials (SecretKeyHash, Role).
- `Fees`: Fee records linked by RegisterNo.
- `Payments`: Payment transactions linked by FeeID/RegisterNo.
- `Hostel`: Hostel details linked by RegisterNo.
- `Transport`: Transport details linked by RegisterNo.
- `Academics`: Academic records (SGPA, CGPA) linked by RegisterNo.
- `Achievements`: Student achievements linked by RegisterNo.
- `Certifications`: Certifications linked by RegisterNo.
- `Activities`: Student activities linked by RegisterNo.
- `Staff`: Staff member profiles.
- `AuditLog`: Logs of all administrative actions.
- `Settings`: Global application configuration.

## 3. Current APIs & Operations
The system uses a dispatch-based API:
- **Public**: `login` (Auth).
- **Protected (Student)**: `getStudentProfile`, `getStudentFees`, `getStudentPayments`, `submitPayment`, `checkOnboarding`, `completeOnboarding`, `getStudentAchievements`, `submitAchievement`, `getStudentCertifications`, `submitCertification`.
- **Protected (Staff/Admin)**: `getStudents`, `createStudent`, `deleteStudent`, `bulkCreateStudents`, `getVerificationQueue`, `verifyAchievement`, `getCertificationQueue`, `verifyCertification`, `getDashboardStats`, `getPendingFeesReport`, `getAuditLogs`.

## 4. Current Authentication & Authorization
- **Authentication**: Users provide a `secretKey`. The backend hashes this key with a salt (`CONFIG.HASH_SALT`) and compares it against the `SecretKeyHash` in the `AccessKeys` sheet.
- **Session Management**: Handled by `SessionManager.gs` (likely using `PropertiesService`).
- **Authorization**: Role-based access control (RBAC). The `Auth.authorize(role, action)` function determines if a user's role (STUDENT, STAFF) is permitted to execute a specific action.

## 5. Migration Strategy
The goal is to move the application to a **Next.js (Vercel)** + **Supabase (PostgreSQL)** stack.

### Phase 1: Infrastructure Setup
- Create a Supabase project.
- Configure environment variables in Vercel and local development (`.env`).

### Phase 2: Database Engineering
- Implement a normalized PostgreSQL schema based on the current model.
- Use UUIDs for primary keys while maintaining `register_number` as a unique business identifier.
- Implement versioned SQL migrations (`supabase/migrations/`).
- Define and enable Row Level Security (RLS) policies.

### Phase 3: Backend Reconstruction
- Replace GAS modules with Next.js Server Actions and API routes.
- Implement a Repository layer (`lib/repositories/`) to abstract Supabase calls.
- Migrate authentication to Supabase Auth.
- Re-implement the dispatch logic as a structured API/Service layer.

### Phase 4: Frontend Migration
- Convert static HTML files to Next.js pages/components.
- Preserve existing CSS (`modern.css`) and JS logic.
- Replace `api.js` (which calls the GAS backend) with calls to Next.js Server Actions.

### Phase 5: Data Migration
- Export Google Sheets data to JSON/CSV.
- Create a deterministic migration script to import data into PostgreSQL.
- Perform data reconciliation (count and field verification).

### Phase 6: Testing & Audit
- Run unit and integration tests.
- Perform security audits (specifically IDOR and RLS testing).
- Verify staff export/download functionality.

## 6. Proposed Database Design (Supabase)
- **Tables**: `profiles`, `students`, `staff`, `batches`, `academic_records`, `fees`, `payments`, `hostel_details`, `transport_details`, `achievements`, `certifications`, `activities`, `audit_logs`.
- **Constraints**: `NOT NULL`, `UNIQUE` (on `register_number`), `FOREIGN KEY` (linking to `students.id`).
- **Indexes**: `register_number`, `email`, `batch_id`, `created_at`.

## 7. Security Model (RLS)
- **students**:
  - SELECT: Own record (student), all (staff/admin).
  - UPDATE: Own editable fields (student), all (staff/admin).
- **academic_records**:
  - SELECT: Own records (student), all (staff/admin).
- **audit_logs**:
  - SELECT: Staff/Admin only.
- **service-role**: Used only in server-side actions for administrative overrides.

## 8. Data Migration Process
1. **Extract**: Export Google Sheets $\to$ JSON.
2. **Transform**: Map sheet columns $\to$ PostgreSQL columns. Resolve `RegisterNo` $\to$ `UUID`.
3. **Load**: Insert into Supabase via migration script.
4. **Verify**: Compare row counts and sample records.

## 9. Verification & Reconciliation
- **Metric 1**: Row counts for each table must match Google Sheet row counts.
- **Metric 2**: Sample checks for 5% of records to ensure no data corruption during type conversion.
- **Metric 3**: Functional verification of all `doPost` actions in the new system.

## 10. Rollback Strategy
- **Immediate**: Keep the Google Sheets active and read-only.
- **Recovery**: If the Supabase deployment fails, the application can be pointed back to the GAS backend (by reverting the frontend API calls), although writes will be disabled to prevent data divergence.
