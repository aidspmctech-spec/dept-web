# Database Architecture: IIDS Student Portal

## Overview
The IIDS Student Portal has been migrated from a Google Sheets backend to a normalized PostgreSQL database hosted on Supabase. This transition provides strong typing, relational integrity, and fine-grained security.

## Entity Relationship Diagram (Conceptual)
- `batches` (1) $\to$ `students` (N)
- `students` (1) $\to$ `academic_records` (N)
- `students` (1) $\to$ `fees` (N)
- `students` (1) $\to$ `payments` (N)
- `students` (1) $\to$ `hostel_details` (1)
- `students` (1) $\to$ `transport_details` (1)
- `students` (1) $\to$ `achievements` (N)
- `students` (1) $\to$ `certifications` (N)
- `students` (1) $\to$ `activities` (N)
- `profiles` (1) $\to$ `students` (0..1)
- `profiles` (1) $\to$ `staff` (0..1)

## Table Details
- **students**: Core identity table. Uses `register_number` as the unique business key.
- **profiles**: Maps Supabase Auth users to internal roles (`STUDENT`, `STAFF`).
- **audit_logs**: Captures all critical system changes for compliance and security.
- **academic_records**: Stores longitudinal GPA and semester data.

## Performance Optimization
- Indexes on `register_number`, `email`, and `batch_id` to ensure $O(1)$ or $O(\log n)$ lookups for search and filtering.
- Foreign key constraints ensure no orphaned records (e.g., academic records must belong to a student).

## Security Model
- **Row Level Security (RLS)**: Enabled on all tables.
- **Isolation**: Students can only read their own rows via `get_my_student_id()` function.
- **Privilege**: Staff have elevated access governed by the `profiles.role` check.
