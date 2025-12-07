# MediBridge24x7 Authentication & Authorization Setup

## ✅ System Status: FULLY FUNCTIONAL

All authentication and authorization systems are properly configured and working. Users can log in and access features based on their assigned roles.

---

## 🔐 Authentication System Overview

### Technology Stack
- **Auth Provider:** Supabase Auth
- **Session Management:** JWT tokens with automatic refresh
- **State Management:** Zustand store
- **Security:** Row Level Security (RLS) policies on all tables
- **Password Requirements:** Minimum 6 characters (Supabase default)

### Authentication Flow
1. User enters email/password on login page
2. Supabase Auth validates credentials
3. On success, user data is loaded from `public.users` table
4. Organization data is loaded from `org_staff` and `organizations` tables
5. User is redirected based on role:
   - `super_admin` → `/admin/*`
   - `clinic_admin`, `doctor`, `staff` → `/portal/*`

---

## 👥 Current User Accounts

### 1. Super Admin
- **Email:** `admin@medibridge.com`
- **Role:** `super_admin`
- **Organization:** None (Global access)
- **Status:** ✅ Active
- **Dashboard:** `/admin/*`
- **Capabilities:**
  - Manage all organizations
  - View/manage global knowledge articles
  - View/manage lab tests
  - View global escalations
  - Cannot access organization portals

### 2. Clinic Admin - Kunal Bellur
- **Email:** `kunalbellur@gmail.com`
- **Role:** `clinic_admin`
- **Organization:** City General Hospital
- **Can Handle Escalations:** Yes
- **Status:** ✅ Active
- **Dashboard:** `/portal/*`
- **Capabilities:**
  - Full access to City General Hospital portal
  - Manage organization settings
  - Manage staff within organization
  - Handle escalations
  - Manage patients, consultations, prescriptions, lab orders
  - View chat sessions

### 3. Clinic Admin - City Hospital
- **Email:** `admin@citygeneralhospital.com`
- **Role:** `clinic_admin`
- **Organization:** City General Hospital
- **Can Handle Escalations:** Yes
- **Status:** ✅ Active (Recently synced)
- **Dashboard:** `/portal/*`
- **Capabilities:** Same as Clinic Admin above

---

## 🎯 Role-Based Access Control (RBAC)

### Role Hierarchy

```
super_admin (Global)
    ├── clinic_admin (Organization-specific)
    │   ├── doctor (Organization-specific)
    │   └── staff (Organization-specific)
```

### Role Permissions Matrix

| Feature | super_admin | clinic_admin | doctor | staff |
|---------|-------------|--------------|--------|-------|
| Access Admin Dashboard | ✅ | ❌ | ❌ | ❌ |
| Manage Organizations | ✅ | ❌ | ❌ | ❌ |
| Manage Global Knowledge | ✅ | ❌ | ❌ | ❌ |
| Manage Lab Tests | ✅ | ❌ | ❌ | ❌ |
| View Global Escalations | ✅ | ❌ | ❌ | ❌ |
| Access Portal Dashboard | ❌ | ✅ | ✅ | ✅ |
| Manage Org Settings | ❌ | ✅ | ❌ | ❌ |
| Manage Staff | ❌ | ✅ | ❌ | ❌ |
| Handle Escalations | ❌ | ✅* | ✅* | ❌ |
| Manage Patients | ❌ | ✅ | ✅ | ✅ |
| Create Consultations | ❌ | ✅ | ✅ | ❌ |
| Create Prescriptions | ❌ | ✅ | ✅ | ❌ |
| Create Lab Orders | ❌ | ✅ | ✅ | ❌ |
| Upload Lab Reports | ❌ | ✅ | ❌ | ✅ |
| View Chat Sessions | ❌ | ✅ | ✅ | ✅ |

\* Based on `can_handle_escalations` flag in `org_staff` table

---

## 🛡️ Security Implementation

### Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

#### Users Table Policies
- ✅ Users can view themselves and org members
- ✅ Users can update their own profile
- ✅ Clinic admins can update users in their org
- ✅ Super admins have full access

#### Organizations Table Policies
- ✅ Users can view their assigned organizations
- ✅ Super admins can view/edit all organizations
- ✅ Only super admins can create/delete organizations

#### Org_Staff Table Policies
- ✅ Users can view staff in their organizations
- ✅ Admins can add/remove/update staff
- ✅ Super admins have full access

#### Clinical Data Tables (Patients, Consultations, Prescriptions, etc.)
- ✅ Users can only access data from their organization
- ✅ RLS enforces organization-level data isolation
- ✅ Super admins do not have access to clinical data

### Helper Functions

The system uses PostgreSQL functions for RLS:

```sql
-- Check if user is super admin
is_super_admin()

-- Get user's current role
get_user_role()

-- Get user's organization IDs
get_user_org_ids()

-- Check if user has access to organization
user_has_org_access(org_id)
```

---

## 🔧 Database Structure

### Auth Tables (Supabase Auth Schema)
- `auth.users` - Supabase authentication users
  - Contains email, encrypted password, confirmation status
  - Managed by Supabase Auth

### Application Tables (Public Schema)

#### Users & Organizations
- `users` - Application user profiles
  - Links to `auth.users` via `id`
  - Contains: email, full_name, role, phone
- `organizations` - Healthcare organizations
  - Contains: name, subdomain, logo_url, status
- `org_staff` - User-organization assignments
  - Links users to organizations
  - Contains: user_id, organization_id, can_handle_escalations
- `organization_settings` - Org-specific settings
  - Contains: colors, logos, feature flags

#### Clinical Data
- `patients` - Patient records
- `consultations` - Doctor consultations
- `prescriptions` & `prescription_items` - Prescriptions
- `lab_tests` & `lab_orders` & `lab_reports` - Lab management
- `chat_sessions` & `messages` - AI chat system
- `escalations` - Case escalations
- `knowledge_articles` - Knowledge base

---

## 🚀 How to Test Authentication

### Testing Super Admin Access

1. **Login:**
   ```
   URL: http://localhost:5173/login
   Email: admin@medibridge.com
   Password: [Set in Supabase Auth]
   ```

2. **Expected Behavior:**
   - Redirected to `/admin/` dashboard
   - Can see "Organizations", "Knowledge Base", "Lab Tests", "Escalations" in sidebar
   - Can manage all organizations
   - Cannot access `/portal/*` routes

### Testing Clinic Admin Access

1. **Login:**
   ```
   URL: http://localhost:5173/login
   Email: kunalbellur@gmail.com
   OR
   Email: admin@citygeneralhospital.com
   Password: [Set in Supabase Auth]
   ```

2. **Expected Behavior:**
   - Redirected to `/portal/` dashboard
   - Can see organization-specific features
   - Can see "Patients", "Consultations", "Prescriptions", "Lab Orders", etc.
   - Can manage staff within City General Hospital
   - Cannot access `/admin/*` routes

### Testing Role-Based Restrictions

1. **Try to access wrong dashboard:**
   - Login as super_admin and navigate to `/portal` → Should show "Access Denied"
   - Login as clinic_admin and navigate to `/admin` → Should show "Access Denied"

2. **Test data isolation:**
   - Login as clinic_admin
   - Try to view patients → Should only see City General Hospital patients
   - Should not see data from other organizations

---

## 🔄 User Lifecycle

### Creating New Users

To create a new user:

1. **Create in Supabase Auth** (via Dashboard or API):
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'newuser@example.com',
     password: 'SecurePassword123',
     options: {
       data: {
         full_name: 'New User'
       }
     }
   });
   ```

2. **Add to public.users table:**
   ```sql
   INSERT INTO public.users (id, email, full_name, role)
   VALUES (
     'USER_ID_FROM_AUTH',
     'newuser@example.com',
     'New User',
     'doctor'  -- or clinic_admin, staff
   );
   ```

3. **Assign to organization** (if not super_admin):
   ```sql
   INSERT INTO public.org_staff (user_id, organization_id, can_handle_escalations)
   VALUES (
     'USER_ID_FROM_AUTH',
     'ORGANIZATION_ID',
     false
   );
   ```

### Updating User Roles

```sql
UPDATE public.users
SET role = 'clinic_admin'
WHERE email = 'user@example.com';
```

### Removing Users

```sql
-- Remove from organization
DELETE FROM public.org_staff WHERE user_id = 'USER_ID';

-- Remove user profile
DELETE FROM public.users WHERE id = 'USER_ID';

-- Remove from auth (via Supabase Dashboard or Admin API)
```

---

## 📊 Current Database State

### Organizations
- City General Hospital (subdomain: city-general)
- HealthCare Plus Clinic (subdomain: healthcare-plus)
- MB_Test_Clinic (subdomain: testclinic.com)
- VDOC Clinics (subdomain: vdoc.medibridge24x7.com)

### Users Summary
- Total auth.users: 3
- Total public.users: 3
- Super admins: 1
- Clinic admins: 2
- Doctors: 0
- Staff: 0

### Organization Assignments
- City General Hospital: 2 users (both clinic_admin)
- Other organizations: 0 users assigned

---

## 🐛 Troubleshooting

### Issue: User can't log in
**Solution:**
1. Check if user exists in `auth.users`
2. Verify email is confirmed (`email_confirmed_at` is set)
3. Check if account is locked or disabled
4. Verify password is correct

### Issue: User logged in but gets "Access Denied"
**Solution:**
1. Check if user exists in `public.users` table
2. Verify user's role matches route requirements
3. Check `org_staff` assignment if accessing portal

### Issue: User can't see their organization data
**Solution:**
1. Verify user is assigned to organization in `org_staff`
2. Check RLS policies are enabled
3. Verify organization_id is correct

### Issue: RLS policy denying access
**Solution:**
1. Check user's role in `public.users`
2. Verify helper functions return correct values
3. Test policy with SQL:
   ```sql
   SET LOCAL role TO authenticated;
   SET LOCAL request.jwt.claims.sub TO 'USER_ID';
   -- Then try your query
   ```

---

## 🔍 Verification Queries

### Check User Status
```sql
SELECT
  au.email,
  au.email_confirmed_at IS NOT NULL as confirmed,
  au.last_sign_in_at,
  pu.role,
  o.name as organization
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.org_staff os ON pu.id = os.user_id
LEFT JOIN public.organizations o ON os.organization_id = o.id
WHERE au.email = 'user@example.com';
```

### Check RLS Policies
```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Test User Permissions
```sql
-- Run as specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims.sub TO 'USER_ID';

-- Try to access data
SELECT * FROM patients LIMIT 5;
SELECT * FROM organizations LIMIT 5;
```

---

## ✅ System Health Checklist

- [x] All tables have RLS enabled
- [x] Helper functions created and working
- [x] User roles defined correctly
- [x] Organization assignments configured
- [x] Protected routes implemented
- [x] Login/logout functionality working
- [x] Role-based redirects working
- [x] Session persistence working
- [x] Data isolation verified
- [x] Test users documented

---

## 📞 Support

For issues or questions about authentication:
1. Check this documentation first
2. Review Supabase Auth logs in dashboard
3. Check browser console for errors
4. Verify database queries in Supabase SQL editor

---

**Last Updated:** 2025-11-24
**System Version:** 1.0
**Auth Status:** ✅ Fully Functional
