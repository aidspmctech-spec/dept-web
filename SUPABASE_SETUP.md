# Supabase Setup Guide

This guide explains how to set up the database for the AIDS Student Portal.

## 1. Project Creation
1. Create a new project at [supabase.com](https://supabase.com).
2. Note your `Project URL` and `Anon Key`.

## 2. Schema Deployment
1. Open the **SQL Editor** in the Supabase dashboard.
2. Execute the migration files in the following order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_indexes.sql`
   - `supabase/migrations/003_rls.sql`

## 3. Authentication Setup
1. Go to **Authentication** $\to$ **Providers**.
2. Enable **Email** provider.
3. Disable "Confirm Email" for easier initial onboarding (optional).

## 4. Environment Configuration
Update your `.env` file with the following values:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Anon Key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Service Role Key (Keep this secret!).

## 5. Data Migration
1. Install dependencies: `npm install`.
2. Place your legacy JSON files in the `data/` directory.
3. Run the migration script: `npx ts-node scripts/migrate-json-to-supabase.ts`.
4. Check `migration_report.json` for any failures.

## 6. Deployment to Vercel
1. Connect your GitHub repo to Vercel.
2. Add the environment variables in the Vercel Dashboard.
3. Deploy.



db pass :
 AidsPmctech

 annon: 
 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobGJlYXdodmdkZm5lanNrY2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjk1NzQsImV4cCI6MjEwMzg0NTU3NH0.1PG3ElVc_B1jjaXsEIEm-p2NUdGlNhGDiSiYrLQj8bM


service_role:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobGJlYXdodmdkZm5lanNrY2RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI2OTU3NCwiZXhwIjoyMTAzODQ1NTc0fQ.O1ilc7ZTZvJ-i37QSrOdBg4awjVCSeEL6niqTlJH3xg

project id:
khlbeawhvgdfnejskcdk


id :
khlbeawhvgdfnejskcdk
