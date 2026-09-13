# Security Audit: IIDS Student Portal

## 1. Authentication
- **Mechanism**: Migrated to Supabase Auth (JWT-based).
- **Role Mapping**: A separate `profiles` table maps `auth.users` to `STUDENT` or `STAFF`.
- **Verdict**: SECURE.

## 2. Authorization (RLS)
- **Student Isolation**: Policies on `students`, `academic_records`, `fees`, etc., use `auth.uid()` to ensure students cannot access other students' data.
- **Staff Access**: Staff roles are verified via a server-side function `get_my_role()`.
- **Staff Access**: Global administrative privileges are restricted to the `STAFF` role.
- **Verdict**: SECURE.

## 3. Secret Management
- **Service Role Key**: Used strictly in `lib/repositories/*.ts` (server-side). Never exposed to the client.
- **Anon Key**: Used for client-side read-only operations governed by RLS.
- **Verdict**: SECURE.

## 4. Vulnerability Analysis
- **IDOR**: Prevented by RLS. Changing a URL parameter from `/student/123` to `/student/124` will return an empty set or 403 if the user is a student.
- **SQL Injection**: Prevented by using the Supabase JS client (which uses parameterized queries/PostgREST).
- **XSS**: Mitigated by Next.js automatic escaping of content.
- **Verdict**: SECURE.

## 5. Audit Logging
- **Implementation**: All administrative actions (CREATE, UPDATE, DELETE) are logged in the `audit_logs` table.
- **Verdict**: IMPLEMENTED.
