# Investigation Plan: Payment History Not Showing

## Goal
Investigate why the Payment History section in the student portal shows "No payment records found" despite payments existing in the database.

## Analysis of Current Findings

### 1. Data Fetching (`app/(protected)/student/fees/page.tsx`)
- **Query**:
  ```typescript
  const { data: payments } = await supabase
    .from('payments')
    .select('*, custom_fee_definitions(fee_name)')
    .eq('student_id', profile.student_id)
    .eq('academic_year', currentYear)
    .order('payment_date', { ascending: false });
  ```
- **Academic Year**: Hardcoded as `const currentYear = '2024-2025';` (Line 11). If the payments in the database are for a different year, they won't be fetched.
- **Silent Errors**: The query result is passed as `payments || []` to the client wrapper. Any Supabase error is ignored, resulting in an empty array.

### 2. Relationship Resolution
- The query joins `custom_fee_definitions` directly: `.select('*, custom_fee_definitions(fee_name)')`.
- If the foreign key in the `payments` table points to `custom_fee_assignments` instead of `custom_fee_definitions`, this join will fail or return null for that field.

### 3. UI Component (`app/(protected)/student/fees/PaymentHistory.tsx`)
- It handles data passed as `payments: Payment[]`.
- It checks `if (payments.length === 0)` to show the "No payment records found" message.
- For `fee_component === 'CUSTOM'`, it attempts to resolve the name from `payment.custom_fee_definitions`.

### 4. Fee Summary vs. History
- `FeeSummary` also receives the same `payments` array. If `FeeSummary` is working (calculating paid amounts), then the `payments` array is NOT empty, and the issue is likely in how `PaymentHistory` filters or renders them (though currently, it just maps over the array).
- *Wait*: If `FeeSummary` works and `PaymentHistory` doesn't, but they share the same `payments` prop, that's a contradiction unless `FeeSummary` does its own fetching or `PaymentHistory` has hidden logic. Looking at `FeesClientWrapper.tsx`, they both use the same `payments` state.

### 5. Payment Status
- `PaymentHistory.tsx` handles `VERIFIED` and `REJECTED` via `getStatusBadge`. It does not filter them out; it displays all fetched payments.

## Next Steps

1. **Verify Database Schema**: Check the `payments` table schema to see:
   - The exact column name for the academic year.
   - The foreign key relationship for custom fees (does it point to `custom_fee_definitions` or `custom_fee_assignments`?).
2. **Check Data**: Verify if there are records for `student_id` and academic year `'2024-2025'`.
3. **Compare Summary Logic**: Read `app/(protected)/student/fees/FeeSummary.tsx` to see how it processes the `payments` array. If it works, I need to see why `PaymentHistory` (which uses the same array) would show "No records".
4. **Test Academic Year**: Check if the `currentYear` should be dynamic.
