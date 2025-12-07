# MediBridge24x7 Test User Credentials

## Overview
This document contains test user credentials for different roles in the MediBridge24x7 system.

## Existing Users (Already Created)

### 1. Super Admin
- **Email:** admin@medibridge.com
- **Password:** (Set in Supabase Auth)
- **Role:** super_admin
- **Organization:** None (Global admin)
- **Access:** Full system access, can manage all organizations
- **Dashboard:** `/admin/*`

### 2. Clinic Admin - Kunal Bellur
- **Email:** kunalbellur@gmail.com
- **Password:** (Set in Supabase Auth)
- **Role:** clinic_admin
- **Organization:** City General Hospital
- **Can Handle Escalations:** Yes
- **Access:** Full access to City General Hospital portal
- **Dashboard:** `/portal/*`

### 3. Clinic Admin - City Hospital
- **Email:** admin@citygeneralhospital.com
- **Password:** (Set in Supabase Auth)
- **Role:** clinic_admin
- **Organization:** City General Hospital
- **Can Handle Escalations:** Yes
- **Access:** Full access to City General Hospital portal
- **Dashboard:** `/portal/*`

---

## Users to Create (For Complete Testing)

### 4. Doctor
- **Email:** doctor@citygeneralhospital.com
- **Password:** Doctor@123
- **Role:** doctor
- **Organization:** City General Hospital
- **Can Handle Escalations:** No
- **Access:** Doctor-specific features (consultations, prescriptions, lab orders)
- **Dashboard:** `/portal/*`

### 5. Staff Member
- **Email:** staff@citygeneralhospital.com
- **Password:** Staff@123
- **Role:** staff
- **Organization:** City General Hospital
- **Can Handle Escalations:** No
- **Access:** Limited portal access (patient management, basic operations)
- **Dashboard:** `/portal/*`

---

## Role-Based Access Control

### Super Admin (`super_admin`)
- Full access to admin dashboard (`/admin/*`)
- Can manage all organizations
- Can view global escalations
- Can manage knowledge base (global articles)
- Can manage lab tests
- Cannot access organization-specific portal

### Clinic Admin (`clinic_admin`)
- Full access to organization portal (`/portal/*`)
- Can manage organization settings
- Can manage staff within organization
- Can handle escalations
- Can manage patients, consultations, prescriptions, lab orders
- Can view chat sessions
- Cannot access admin dashboard

### Doctor (`doctor`)
- Access to organization portal (`/portal/*`)
- Can create and view consultations
- Can create prescriptions
- Can order lab tests
- Can view patients
- Cannot manage organization settings
- Cannot manage staff
- May or may not handle escalations (based on `can_handle_escalations`)

### Staff (`staff`)
- Limited access to organization portal (`/portal/*`)
- Can manage patients
- Can view consultations (read-only)
- Can assist with lab orders and reports
- Cannot create prescriptions
- Cannot manage organization settings
- Cannot manage other staff

---

## Testing Checklist

### Authentication Tests
- [ ] Login with super_admin account
- [ ] Login with clinic_admin account
- [ ] Login with doctor account
- [ ] Login with staff account
- [ ] Verify correct dashboard routing based on role
- [ ] Verify logout functionality

### Authorization Tests
- [ ] Super admin can access `/admin/*` routes
- [ ] Super admin cannot access `/portal/*` routes
- [ ] Clinic admin can access `/portal/*` routes
- [ ] Clinic admin cannot access `/admin/*` routes
- [ ] Doctor has appropriate permissions in portal
- [ ] Staff has limited permissions in portal

### Data Access Tests
- [ ] Users can only see data from their organization
- [ ] Super admin can see all organizations
- [ ] RLS policies prevent unauthorized data access

---

## Database User Status

| Email | Role | Organization | Auth Created | Public.Users | Org_Staff |
|-------|------|--------------|--------------|--------------|-----------|
| admin@medibridge.com | super_admin | None | ✅ | ✅ | ❌ |
| kunalbellur@gmail.com | clinic_admin | City General Hospital | ✅ | ✅ | ✅ |
| admin@citygeneralhospital.com | clinic_admin | City General Hospital | ✅ | ✅ | ✅ |
| doctor@citygeneralhospital.com | doctor | City General Hospital | ❌ | ❌ | ❌ |
| staff@citygeneralhospital.com | staff | City General Hospital | ❌ | ❌ | ❌ |

---

## Creating New Users (SQL)

To create the doctor and staff users, you would need to:

1. Create user in Supabase Auth (via Supabase Dashboard or signUp API)
2. Add user record to `public.users`
3. Add user to `org_staff` (if not super_admin)

**Note:** Users must be created through Supabase Auth first (with email/password), then their records are synced to public.users table.

---

## Important Notes

1. **Email Confirmation:** All users have `email_confirmed_at` set, so they can log in immediately
2. **Last Sign In:** Users show recent login activity
3. **RLS Policies:** All tables have Row Level Security enabled
4. **Password Requirements:** Supabase enforces minimum password strength
5. **Session Management:** Sessions are managed by Supabase Auth
6. **Organization Assignment:** Users (except super_admin) must be assigned to an organization via org_staff table

---

## Quick Start for Testing

1. **Test Super Admin:**
   - Go to login page
   - Enter: admin@medibridge.com
   - Should redirect to `/admin/` dashboard
   - Can manage organizations, knowledge base, lab tests, escalations

2. **Test Clinic Admin:**
   - Go to login page
   - Enter: kunalbellur@gmail.com or admin@citygeneralhospital.com
   - Should redirect to `/portal/` dashboard
   - Can access all portal features for City General Hospital

3. **For Complete Testing:**
   - Create doctor and staff users through Supabase Auth
   - Use the SQL queries in the next section to complete their setup

---

## SQL Scripts for User Creation

### Create Doctor User (After Auth Creation)
```sql
-- After creating auth user, get the user ID and run:
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'USER_ID_FROM_AUTH',
  'doctor@citygeneralhospital.com',
  'Dr. Test Doctor',
  'doctor'
);

INSERT INTO public.org_staff (user_id, organization_id, can_handle_escalations)
VALUES (
  'USER_ID_FROM_AUTH',
  '10000000-0000-0000-0000-000000000001',
  false
);
```

### Create Staff User (After Auth Creation)
```sql
-- After creating auth user, get the user ID and run:
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'USER_ID_FROM_AUTH',
  'staff@citygeneralhospital.com',
  'Test Staff Member',
  'staff'
);

INSERT INTO public.org_staff (user_id, organization_id, can_handle_escalations)
VALUES (
  'USER_ID_FROM_AUTH',
  '10000000-0000-0000-0000-000000000001',
  false
);
```
