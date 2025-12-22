'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/clinic-website/AdminLayout';
import Link from 'next/link';

interface DashboardStats {
  doctors: number;
  testimonials: number;
  services: number;
  isPublished: boolean;
}

interface StaffMember {
  id: string;
  role: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [staffInfo, setStaffInfo] = useState<StaffMember | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    doctors: 0,
    testimonials: 0,
    services: 0,
    isPublished: false,
  });
  const [clinicProfile, setClinicProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${org}/auth?redirect=admin`);
        return;
      }

      // Get organization
      const { data: organization } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', org)
        .single();

      if (!organization) {
        router.push(`/${org}/dashboard`);
        return;
      }

      setOrgName(organization.name);
      setOrgId(organization.id);

      // ✅ CHECK IF USER IS AUTHORIZED STAFF FOR THIS CLINIC
      const { data: staffData, error: staffError } = await supabase
        .from('org_staff')
        .select('id, role, email, full_name, is_active')
        .eq('user_id', user.id)
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .single();

      if (staffError || !staffData) {
        // User is NOT authorized staff - redirect to patient dashboard
        console.log('Access denied: User is not authorized staff for this clinic');
        router.push(`/${org}/dashboard?error=unauthorized`);
        return;
      }

      // User is authorized!
      setAuthorized(true);
      setStaffInfo(staffData);

      // Get clinic profile
      const { data: profile } = await supabase
        .from('clinic_profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .single();

      setClinicProfile(profile);

      // Get stats
      const [doctorsRes, testimonialsRes] = await Promise.all([
        supabase
          .from('doctor_profiles')
          .select('id', { count: 'exact' })
          .eq('organization_id', organization.id)
          .eq('is_active', true),
        supabase
          .from('testimonials')
          .select('id', { count: 'exact' })
          .eq('organization_id', organization.id)
          .eq('is_approved', true),
      ]);

      setStats({
        doctors: doctorsRes.count || 0,
        testimonials: testimonialsRes.count || 0,
        services: profile?.services?.length || 0,
        isPublished: profile?.is_published || false,
      });

      setLoading(false);
    }

    fetchData();
  }, [org, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You are not authorized to access the admin dashboard for this clinic.</p>
          <Link
            href={`/${org}/dashboard`}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Patient Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Edit Clinic Profile',
      description: 'Update your clinic name, tagline, contact info, and more',
      href: `/${org}/admin/clinic-website/profile`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Doctors',
      description: 'Add, edit, or remove doctor profiles',
      href: `/${org}/admin/clinic-website/doctors`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      title: 'Manage Testimonials',
      description: 'Add patient reviews and success stories',
      href: `/${org}/admin/clinic-website/testimonials`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-amber-500',
    },
    {
      title: 'Edit Services',
      description: 'Update the services your clinic offers',
      href: `/${org}/admin/clinic-website/services`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
  ];

  return (
    <AdminLayout orgSlug={org} orgName={orgName}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your clinic&apos;s white-label website</p>
          </div>
          {staffInfo && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {staffInfo.role === 'owner' ? 'Owner' : staffInfo.role}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stats.doctors > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {stats.doctors > 0 ? 'Active' : 'Add doctors'}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.doctors}</h3>
          <p className="text-sm text-gray-500">Doctors Listed</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stats.testimonials > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {stats.testimonials > 0 ? 'Active' : 'Add reviews'}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.testimonials}</h3>
          <p className="text-sm text-gray-500">Patient Reviews</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stats.services > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {stats.services > 0 ? 'Active' : 'Add services'}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.services}</h3>
          <p className="text-sm text-gray-500">Services Offered</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.isPublished ? 'bg-green-100' : 'bg-gray-100'}`}>
              <svg className={`w-6 h-6 ${stats.isPublished ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${stats.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {stats.isPublished ? 'Live' : 'Draft'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{stats.isPublished ? 'Published' : 'Not Published'}</h3>
          <p className="text-sm text-gray-500">Website Status</p>
        </div>
      </div>

      {/* Website Preview Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">Your Clinic Website</h2>
            <p className="text-purple-100 mb-2">
              {clinicProfile?.tagline || 'Add a tagline to make your clinic stand out'}
            </p>
            <p className="text-sm text-purple-200">
              URL: <span className="font-mono bg-white/20 px-2 py-0.5 rounded">/clinic/{org}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/clinic/${org}`}
              target="_blank"
              className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Site
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity / Tips */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started Tips</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${clinicProfile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {clinicProfile ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-medium">1</span>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Complete your clinic profile</h4>
              <p className="text-sm text-gray-500">Add your clinic&apos;s contact info, tagline, and about section</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${stats.doctors > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {stats.doctors > 0 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-medium">2</span>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Add your doctors</h4>
              <p className="text-sm text-gray-500">List your clinic&apos;s doctors with their specializations and fees</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${stats.testimonials >= 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {stats.testimonials >= 3 ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-medium">3</span>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Add patient testimonials</h4>
              <p className="text-sm text-gray-500">Showcase patient success stories to build trust</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${stats.isPublished ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              {stats.isPublished ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs font-medium">4</span>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Publish your website</h4>
              <p className="text-sm text-gray-500">Make your clinic website live for patients to find</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}