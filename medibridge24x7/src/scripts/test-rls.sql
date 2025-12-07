-- =====================================================
-- RLS (Row Level Security) Testing Script
-- =====================================================
-- This script helps verify that RLS policies are working correctly
-- Run these queries as different users to ensure proper access control

-- =====================================================
-- 1. Verify RLS is enabled on all tables
-- =====================================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'organizations', 'org_settings', 'org_staff',
    'patients', 'consultations', 'prescriptions', 'lab_tests',
    'lab_orders', 'lab_results', 'knowledge_articles',
    'escalations', 'chat_sessions', 'chat_messages'
  )
ORDER BY tablename;

-- Expected: All tables should have rowsecurity = true

-- =====================================================
-- 2. List all RLS policies
-- =====================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 3. Test Super Admin Access
-- =====================================================
-- Super admins should be able to see all organizations

-- As super_admin user:
-- Should return all organizations
SELECT id, name FROM organizations;

-- Should return all users
SELECT id, email, role FROM users;

-- =====================================================
-- 4. Test Clinic User Access - Valid Organization
-- =====================================================
-- Clinic users should only see their own organization's data

-- As clinic_admin/doctor/staff user:
-- Should return only their organization
SELECT id, name FROM organizations;

-- Should return only staff from their organization
SELECT os.id, u.email, u.role
FROM org_staff os
JOIN users u ON u.id = os.user_id;

-- Should return only patients from their organization
SELECT id, full_name, organization_id
FROM patients;

-- =====================================================
-- 5. Test Cross-Organization Access (Should Fail/Return Empty)
-- =====================================================
-- Try to access data from another organization
-- This should return empty results or fail with RLS

-- As clinic user from org A, try to get patients from org B:
-- Replace 'other-org-id' with an actual organization ID you don't belong to
SELECT id, full_name, organization_id
FROM patients
WHERE organization_id = 'other-org-id';
-- Expected: Empty result set (RLS should filter this out)

-- Try to insert patient with wrong organization_id
-- This should fail with RLS policy violation
INSERT INTO patients (organization_id, full_name, phone)
VALUES ('other-org-id', 'Test Patient', '1234567890');
-- Expected: Error - RLS policy violation

-- =====================================================
-- 6. Test Escalation Access Control
-- =====================================================
-- Staff should only see escalations they can handle or are assigned to

-- As staff WITH can_handle_escalations = true:
SELECT id, status, priority, created_at
FROM escalations
WHERE status IN ('open', 'in_progress');
-- Expected: All open/in_progress escalations in their org

-- As staff WITH can_handle_escalations = false:
SELECT id, status, priority, created_at
FROM escalations
WHERE status = 'in_progress';
-- Expected: Only escalations assigned to them

-- =====================================================
-- 7. Test Lab System Access
-- =====================================================
-- Verify lab orders are properly scoped to organization

-- Should only see lab orders from own organization
SELECT lo.id, lo.status, p.full_name
FROM lab_orders lo
JOIN patients p ON p.id = lo.patient_id;

-- =====================================================
-- 8. Test Chat Access
-- =====================================================
-- Users should only see chat sessions they're part of

-- Should only see own chat sessions
SELECT cs.id, cs.status, cs.created_at
FROM chat_sessions cs
WHERE cs.user_id = auth.uid()
   OR cs.clinic_staff_id IN (
     SELECT id FROM org_staff WHERE user_id = auth.uid()
   );

-- =====================================================
-- 9. Test Anonymous Access (Should All Fail)
-- =====================================================
-- Without authentication, these should all return empty or fail

-- These should return no results when not authenticated:
SELECT * FROM organizations;
SELECT * FROM patients;
SELECT * FROM consultations;

-- =====================================================
-- 10. Test Token Expiry Handling
-- =====================================================
-- Use an expired token to verify proper error handling
-- Expected: 401 Unauthorized or JWT expired error

-- =====================================================
-- SUMMARY OF EXPECTED BEHAVIORS
-- =====================================================
/*
✓ Super Admin:
  - Can see ALL organizations
  - Can see ALL users
  - Can manage global resources (knowledge base, lab tests)
  - Can see ALL escalations

✓ Clinic Admin/Doctor/Staff:
  - Can ONLY see their organization
  - Can ONLY see users in their organization
  - Can ONLY see patients in their organization
  - Can ONLY see consultations for their organization's patients
  - Can ONLY see lab orders for their organization's patients
  - Escalation access depends on can_handle_escalations flag

✗ Unauthorized Access:
  - Cannot see other organizations' data
  - Cannot insert data with other organization_id
  - Cannot update data they don't own
  - Cannot delete data they don't own

✗ Unauthenticated Access:
  - Cannot access any protected resources
  - All queries return empty or fail
*/

-- =====================================================
-- TESTING CHECKLIST
-- =====================================================
/*
[ ] All tables have RLS enabled
[ ] Super admin can access all organizations
[ ] Clinic user can only access their organization
[ ] Clinic user cannot access other organization's patients
[ ] Insert with wrong organization_id fails
[ ] Escalations properly filter by permission level
[ ] Chat sessions properly scoped to participants
[ ] Lab orders properly scoped to organization
[ ] Unauthenticated requests fail
[ ] Token refresh works automatically
*/
