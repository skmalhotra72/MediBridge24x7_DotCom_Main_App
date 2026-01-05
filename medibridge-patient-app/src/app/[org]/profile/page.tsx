'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// Language options (10 languages as per platform features)
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit modals
  const [showPersonalEdit, setShowPersonalEdit] = useState(false);
  const [showMedicalEdit, setShowMedicalEdit] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');

  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappReminders, setWhatsappReminders] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push(`/${org}/auth`);
        return;
      }

      // Get patient data - try email first, then phone
      let patientData = null;
      let patientError = null;

      // Try finding by email
      if (user.email) {
        const emailResult = await supabase
          .from('patients')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
        
        patientData = emailResult.data;
        patientError = emailResult.error;
      }

      // If no patient found by email, try phone
      if (!patientData && user.phone) {
        const phoneResult = await supabase
          .from('patients')
          .select('*')
          .eq('phone_e164', user.phone)
          .maybeSingle();
        
        if (phoneResult.data) {
          patientData = phoneResult.data;
          patientError = phoneResult.error;
        }
      }

      // If still no patient found, create one
      if (!patientData && !patientError) {
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            email: user.email || null,
            phone_e164: user.phone || null,
            full_name: user.user_metadata?.full_name || 'Patient',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating patient:', createError);
          patientError = createError;
        } else {
          patientData = newPatient;
        }
      }

      if (patientError) throw patientError;

      setPatient(patientData);
      setFullName(patientData.full_name || '');
      setEmail(user.email || '');
      setPhone(patientData.phone_e164 || '');
      setDateOfBirth(patientData.date_of_birth || '');
      setAddress(patientData.address || '');
      setBloodGroup(patientData.blood_group || '');
      setAllergies(patientData.allergies || '');
      setChronicConditions(
        typeof patientData.chronic_conditions === 'string' 
          ? patientData.chronic_conditions 
          : (patientData.chronic_conditions ? JSON.stringify(patientData.chronic_conditions) : '')
      );
      setPreferredLanguage(patientData.preferred_language || 'en');
      setEmailNotifications(patientData.email_notifications !== false);
      setWhatsappReminders(patientData.whatsapp_consent_given_at !== null);

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading patient data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const updatePersonalInfo = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      if (!patient?.id) throw new Error('Patient ID not found');

      const { error: updateError } = await supabase
        .from('patients')
        .update({
          full_name: fullName,
          phone_e164: phone || null,
          date_of_birth: dateOfBirth || null,
          address: address || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;

      setSuccess('Personal information updated successfully!');
      setShowPersonalEdit(false);
      await loadPatientData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating personal info:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateMedicalInfo = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      if (!patient?.id) throw new Error('Patient ID not found');

      const { error: updateError } = await supabase
        .from('patients')
        .update({
          blood_group: bloodGroup || null,
          allergies: allergies || null,
          chronic_conditions: chronicConditions.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;

      setSuccess('Medical information updated successfully!');
      setShowMedicalEdit(false);
      await loadPatientData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating medical info:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateLanguagePreference = async (langCode: string) => {
    try {
      const supabase = createClient();

      if (!patient?.id) throw new Error('Patient ID not found');

      const { error: updateError } = await supabase
        .from('patients')
        .update({
          preferred_language: langCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;

      setPreferredLanguage(langCode);
      setSuccess('Language preference updated!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('Error updating language:', err);
      setError(err.message);
    }
  };

  const updateNotificationPreference = async (type: 'email' | 'whatsapp', value: boolean) => {
    try {
      const supabase = createClient();

      if (!patient?.id) throw new Error('Patient ID not found');

      const updateData = type === 'email'
        ? { email_notifications: value }
        : { 
            whatsapp_consent_given_at: value ? new Date().toISOString() : null,
            whatsapp_opt_out: !value
          };

      const { error: updateError } = await supabase
        .from('patients')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;

      if (type === 'email') {
        setEmailNotifications(value);
      } else {
        setWhatsappReminders(value);
      }
    } catch (err: any) {
      console.error('Error updating notification preference:', err);
      setError(err.message);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();

      if (!patient?.id) throw new Error('Patient ID not found');

      // Mark account as deleted (soft delete)
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (updateError) throw updateError;

      // Sign out
      await supabase.auth.signOut();
      router.push(`/${org}`);
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${org}/dashboard`} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white">MB</span>
                </div>
                <div>
                  <div className="font-bold">MediBridge</div>
                  <div className="text-xs text-cyan-400">Healthcare Intelligence</div>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/${org}/dashboard`} className="text-slate-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href={`/${org}/prescriptions`} className="text-slate-300 hover:text-white transition-colors">
                Prescriptions
              </Link>
              <Link href={`/${org}/profile`} className="text-white font-semibold">
                Profile
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {patient?.full_name?.charAt(0) || 'P'}
                </div>
                <span className="hidden md:inline text-sm">{patient?.full_name || 'Patient'}</span>
              </div>
              <button
                onClick={async () => {
                  await createClient().auth.signOut();
                  router.push(`/${org}/auth`);
                }}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-600 border border-green-200">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {patient?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{patient?.full_name || 'Patient'}</h2>
                <p className="text-sm text-gray-500 mb-4">{email}</p>

                <div className="w-full p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">Account Active</span>
                </div>

                <div className="w-full text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member since</span>
                    <span className="font-medium">
                      {patient?.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                <button
                  onClick={() => setShowPersonalEdit(true)}
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                  <p className="text-gray-900">{patient?.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                  <p className="text-gray-900">{email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                  <p className="text-gray-900">{phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                  <p className="text-gray-900">
                    {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-gray-900">{address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Medical Information</h3>
                <button
                  onClick={() => setShowMedicalEdit(true)}
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
                >
                  Update
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                  <p className="text-gray-900">{bloodGroup || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Allergies</label>
                  <p className="text-gray-900">{allergies || 'None reported'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Chronic Conditions</label>
                  <p className="text-gray-900">{chronicConditions || 'None reported'}</p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Preferences</h3>

              <div className="space-y-6">
                {/* Language Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Language
                    <span className="block text-xs text-gray-500 font-normal mt-1">
                      Choose your preferred language for AI responses
                    </span>
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => updateLanguagePreference(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notification Preferences */}
                <div>
                  <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive updates about your prescriptions</div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => updateNotificationPreference('email', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <div>
                      <div className="font-medium text-gray-900">WhatsApp Reminders</div>
                      <div className="text-sm text-gray-500">Get medicine reminders via WhatsApp</div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={whatsappReminders}
                        onChange={(e) => updateNotificationPreference('whatsapp', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Security</h3>

              <div className="space-y-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Change Password</div>
                      <div className="text-sm text-gray-500">Update your account password</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-500">Add an extra layer of security</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl p-6 shadow-sm border border-red-200">
              <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-600 mb-4">Permanently delete your account and all data</p>

              <button
                onClick={deleteAccount}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Personal Info Modal */}
      {showPersonalEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Edit Personal Information</h3>
                <button
                  onClick={() => setShowPersonalEdit(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="Enter phone number (e.g., +919876543210)"
                />
                <p className="mt-1 text-xs text-gray-500">Format: +91 followed by 10 digits</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowPersonalEdit(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={updatePersonalInfo}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medical Info Modal */}
      {showMedicalEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Update Medical Information</h3>
                <button
                  onClick={() => setShowMedicalEdit(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="List any allergies (medications, food, etc.)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
                <textarea
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="List any chronic conditions (diabetes, hypertension, etc.)"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowMedicalEdit(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={updateMedicalInfo}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  minLength={8}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={changePassword}
                disabled={saving || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}