-- =====================================================
-- Seed Data Script for MediBridge
-- =====================================================
-- This script creates sample data for development and testing
-- Run this AFTER all migrations have been applied

-- =====================================================
-- 1. Create Super Admin User
-- =====================================================
-- Note: Password must be set via Supabase Auth dashboard or API
-- This creates the user record in the users table

INSERT INTO users (id, email, role, full_name, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@medibridge.com', 'super_admin', 'Super Administrator', NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. Create Sample Organizations
-- =====================================================
INSERT INTO organizations (id, name, type, address, phone, email, created_at)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'City General Hospital',
    'hospital',
    '123 Medical Center Dr, New York, NY 10001',
    '+1-555-0101',
    'contact@citygeneralhospital.com',
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'HealthCare Plus Clinic',
    'clinic',
    '456 Wellness Ave, Los Angeles, CA 90001',
    '+1-555-0102',
    'info@healthcareplus.com',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. Create Organization Settings
-- =====================================================
INSERT INTO organization_settings (organization_id, primary_color, secondary_color, logo_url)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '#1e3a8a',
    '#3b82f6',
    NULL
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '#065f46',
    '#10b981',
    NULL
  )
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- 4. Create Sample Users for Each Organization
-- =====================================================
-- Organization 1 (City General Hospital) Users
INSERT INTO users (id, email, role, full_name, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'admin@citygeneralhospital.com', 'clinic_admin', 'Dr. Sarah Johnson', NOW()),
  ('20000000-0000-0000-0000-000000000002', 'doctor1@citygeneralhospital.com', 'doctor', 'Dr. Michael Chen', NOW()),
  ('20000000-0000-0000-0000-000000000003', 'doctor2@citygeneralhospital.com', 'doctor', 'Dr. Emily Rodriguez', NOW()),
  ('20000000-0000-0000-0000-000000000004', 'staff1@citygeneralhospital.com', 'staff', 'Nurse Jennifer Williams', NOW())
ON CONFLICT (id) DO NOTHING;

-- Organization 2 (HealthCare Plus) Users
INSERT INTO users (id, email, role, full_name, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000005', 'admin@healthcareplus.com', 'clinic_admin', 'Dr. Robert Brown', NOW()),
  ('20000000-0000-0000-0000-000000000006', 'doctor@healthcareplus.com', 'doctor', 'Dr. Lisa Anderson', NOW()),
  ('20000000-0000-0000-0000-000000000007', 'staff@healthcareplus.com', 'staff', 'Medical Assistant Tom Davis', NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. Link Users to Organizations (org_staff)
-- =====================================================
-- Organization 1 Staff
INSERT INTO org_staff (user_id, organization_id, can_handle_escalations, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', true, NOW()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', true, NOW()),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', true, NOW()),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', false, NOW())
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Organization 2 Staff
INSERT INTO org_staff (user_id, organization_id, can_handle_escalations, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', true, NOW()),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', true, NOW()),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', false, NOW())
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- =====================================================
-- 6. Create Sample Patients
-- =====================================================
-- Patients for Organization 1
INSERT INTO patients (organization_id, full_name, age, gender, phone, email, address, medical_history, created_at)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'John Smith',
    45,
    'male',
    '+1-555-1001',
    'john.smith@email.com',
    '789 Oak Street, New York, NY 10002',
    'Hypertension, Type 2 Diabetes',
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    'Maria Garcia',
    32,
    'female',
    '+1-555-1002',
    'maria.garcia@email.com',
    '321 Pine Avenue, New York, NY 10003',
    'Asthma, Seasonal Allergies',
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    'David Lee',
    28,
    'male',
    '+1-555-1003',
    'david.lee@email.com',
    '654 Maple Drive, New York, NY 10004',
    'No significant medical history',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Patients for Organization 2
INSERT INTO patients (organization_id, full_name, age, gender, phone, email, address, medical_history, created_at)
VALUES
  (
    '10000000-0000-0000-0000-000000000002',
    'Jennifer Taylor',
    55,
    'female',
    '+1-555-2001',
    'jennifer.taylor@email.com',
    '987 Elm Street, Los Angeles, CA 90002',
    'High Cholesterol, Osteoarthritis',
    NOW()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Michael Wilson',
    41,
    'male',
    '+1-555-2002',
    'michael.wilson@email.com',
    '246 Cedar Lane, Los Angeles, CA 90003',
    'Acid Reflux, Migraines',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. Create Global Lab Tests
-- =====================================================
INSERT INTO lab_tests (name, description, category, normal_range, unit, created_at)
VALUES
  ('Complete Blood Count (CBC)', 'Measures various components of blood', 'Hematology', NULL, NULL, NOW()),
  ('Basic Metabolic Panel', 'Tests kidney function and electrolyte balance', 'Chemistry', NULL, NULL, NOW()),
  ('Lipid Panel', 'Measures cholesterol and triglycerides', 'Chemistry', NULL, NULL, NOW()),
  ('Thyroid Panel', 'Tests thyroid function', 'Endocrinology', NULL, NULL, NOW()),
  ('Hemoglobin A1C', 'Measures average blood sugar over 3 months', 'Chemistry', '4.0-5.6', '%', NOW()),
  ('Urinalysis', 'Analyzes urine composition', 'Urinalysis', NULL, NULL, NOW())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. Create Sample Knowledge Articles
-- =====================================================
INSERT INTO knowledge_articles (title, content, category, tags, is_published, created_at, updated_at)
VALUES
  (
    'Managing Hypertension',
    'Hypertension, or high blood pressure, requires regular monitoring and lifestyle modifications. Recommended actions include: 1) Regular exercise, 2) Low-sodium diet, 3) Medication compliance, 4) Stress management, 5) Regular check-ups.',
    'chronic_conditions',
    ARRAY['hypertension', 'blood pressure', 'chronic care'],
    true,
    NOW(),
    NOW()
  ),
  (
    'Type 2 Diabetes Care',
    'Managing Type 2 Diabetes involves: 1) Blood glucose monitoring, 2) Balanced diet with carbohydrate counting, 3) Regular physical activity, 4) Medication as prescribed, 5) Regular HbA1c testing, 6) Foot care and eye examinations.',
    'chronic_conditions',
    ARRAY['diabetes', 'blood sugar', 'chronic care'],
    true,
    NOW(),
    NOW()
  ),
  (
    'When to Escalate to Emergency Care',
    'Escalate immediately for: Chest pain, Difficulty breathing, Severe bleeding, Loss of consciousness, Stroke symptoms (FAST), Severe allergic reactions, High fever in infants.',
    'emergency',
    ARRAY['emergency', 'urgent care', 'protocols'],
    true,
    NOW(),
    NOW()
  ),
  (
    'Medication Reconciliation Protocol',
    'Steps for accurate medication reconciliation: 1) Review all current medications, 2) Verify dosages and frequencies, 3) Check for drug interactions, 4) Document allergies, 5) Update electronic health records, 6) Provide patient education.',
    'medications',
    ARRAY['medication', 'reconciliation', 'patient safety'],
    true,
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUMMARY
-- =====================================================
/*
Created:
✓ 1 Super Admin (admin@medibridge.com)
✓ 2 Organizations (City General Hospital, HealthCare Plus Clinic)
✓ 7 Users across both organizations
✓ 5 Sample Patients
✓ 6 Global Lab Tests
✓ 4 Knowledge Base Articles

Next Steps:
1. Create auth users in Supabase Auth Dashboard for each email
2. Set passwords for all users
3. Test login with different roles
4. Verify RLS policies work correctly
5. Test cross-organization access restrictions

Default Login Credentials (set via Supabase):
- Super Admin: admin@medibridge.com
- Org 1 Admin: admin@citygeneralhospital.com
- Org 1 Doctor: doctor1@citygeneralhospital.com
- Org 2 Admin: admin@healthcareplus.com
- Org 2 Doctor: doctor@healthcareplus.com

Test Scenarios:
1. Login as super_admin - should see all organizations
2. Login as clinic_admin from Org 1 - should only see Org 1 data
3. Login as doctor from Org 2 - should only see Org 2 patients
4. Try to access Org 2 patient as Org 1 user - should fail/return empty
*/
