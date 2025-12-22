'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/clinic-website/AdminLayout';

interface WorkingHours {
  [key: string]: { open: string; close: string; closed?: boolean };
}

interface ClinicProfile {
  id: string;
  organization_id: string;
  theme_id: string;
  hero_image_url: string;
  tagline: string;
  about_us: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  address: string;
  google_maps_url: string;
  working_hours: WorkingHours;
  is_published: boolean;
  seo_title: string;
  seo_description: string;
}

const defaultWorkingHours: WorkingHours = {
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: { open: '09:00', close: '14:00' },
  sunday: { open: '09:00', close: '14:00', closed: true },
};

export default function ProfileEditorPage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profile, setProfile] = useState<Partial<ClinicProfile>>({
    tagline: '',
    about_us: '',
    contact_email: '',
    contact_phone: '',
    whatsapp_number: '',
    address: '',
    google_maps_url: '',
    working_hours: defaultWorkingHours,
    is_published: false,
    seo_title: '',
    seo_description: '',
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${org}/auth`);
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

      // Get clinic profile
      const { data: existingProfile } = await supabase
        .from('clinic_profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .single();

      if (existingProfile) {
        setProfile({
          ...existingProfile,
          working_hours: existingProfile.working_hours || defaultWorkingHours,
        });
      }

      setLoading(false);
    }

    fetchData();
  }, [org, router]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    const supabase = createClient();

    try {
      // Check if profile exists
      const { data: existing } = await supabase
        .from('clinic_profiles')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('clinic_profiles')
          .update({
            tagline: profile.tagline,
            about_us: profile.about_us,
            contact_email: profile.contact_email,
            contact_phone: profile.contact_phone,
            address: profile.address,
            google_maps_url: profile.google_maps_url,
            working_hours: profile.working_hours,
            is_published: profile.is_published,
            seo_title: profile.seo_title,
            seo_description: profile.seo_description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('clinic_profiles')
          .insert({
            organization_id: orgId,
            tagline: profile.tagline,
            about_us: profile.about_us,
            contact_email: profile.contact_email,
            contact_phone: profile.contact_phone,
            address: profile.address,
            google_maps_url: profile.google_maps_url,
            working_hours: profile.working_hours,
            is_published: profile.is_published,
            seo_title: profile.seo_title,
            seo_description: profile.seo_description,
          });

        if (error) throw error;
      }

      setSuccessMessage('Profile saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setProfile(prev => {
      const currentDayHours = prev.working_hours?.[day] || { open: '09:00', close: '18:00', closed: false };
      return {
        ...prev,
        working_hours: {
          ...prev.working_hours,
          [day]: {
            open: currentDayHours.open || '09:00',
            close: currentDayHours.close || '18:00',
            closed: currentDayHours.closed || false,
            [field]: value,
          },
        } as WorkingHours,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <AdminLayout orgSlug={org} orgName={orgName}>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Profile</h1>
          <p className="text-gray-500 mt-1">Edit your clinic's information and contact details</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
              <input
                type="text"
                value={profile.tagline || ''}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                placeholder="e.g., Your Family's Health, Our Life's Work"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">A short, catchy phrase that describes your clinic</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">About Us</label>
              <textarea
                value={profile.about_us || ''}
                onChange={(e) => setProfile({ ...profile, about_us: e.target.value })}
                placeholder="Tell patients about your clinic, your mission, and what makes you special..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">This appears in the About section of your website</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={profile.contact_email || ''}
                onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                placeholder="contact@yourclinic.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profile.contact_phone || ''}
                onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="123 Health Street, Sector 14, Gurugram, Haryana 122001"
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Maps Embed URL</label>
              <input
                type="url"
                value={profile.google_maps_url || ''}
                onChange={(e) => setProfile({ ...profile, google_maps_url: e.target.value })}
                placeholder="https://www.google.com/maps/embed?..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Go to Google Maps → Share → Embed a map → Copy the src URL
              </p>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Working Hours</h2>
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                <div className="w-28">
                  <span className="font-medium text-gray-700 capitalize">{day}</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!profile.working_hours?.[day]?.closed}
                    onChange={(e) => updateWorkingHours(day, 'closed', !e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600">Open</span>
                </label>
                {!profile.working_hours?.[day]?.closed && (
                  <>
                    <input
                      type="time"
                      value={profile.working_hours?.[day]?.open || '09:00'}
                      onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={profile.working_hours?.[day]?.close || '18:00'}
                      onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </>
                )}
                {profile.working_hours?.[day]?.closed && (
                  <span className="text-gray-400 text-sm">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
              <input
                type="text"
                value={profile.seo_title || ''}
                onChange={(e) => setProfile({ ...profile, seo_title: e.target.value })}
                placeholder="e.g., Demo Clinic - Best Family Doctor in Gurugram"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">This appears in browser tabs and Google search results</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
              <textarea
                value={profile.seo_description || ''}
                onChange={(e) => setProfile({ ...profile, seo_description: e.target.value })}
                placeholder="A brief description of your clinic for search engines (150-160 characters recommended)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                {(profile.seo_description?.length || 0)}/160 characters
              </p>
            </div>
          </div>
        </div>

        {/* Publish Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Publish Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Website Status</h3>
              <p className="text-sm text-gray-500">Make your clinic website visible to the public</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.is_published || false}
                onChange={(e) => setProfile({ ...profile, is_published: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {profile.is_published ? 'Published' : 'Draft'}
              </span>
            </label>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}