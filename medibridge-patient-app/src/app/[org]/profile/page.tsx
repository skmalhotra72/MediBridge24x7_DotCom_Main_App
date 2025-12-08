import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';

interface ProfilePageProps {
  params: Promise<{ org: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { org } = await params;
  const supabase = await createSupabaseServer();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${org}/auth?mode=login`);
  }

  const handleSignOut = async () => {
    'use server';
    const supabase = await createSupabaseServer();
    await supabase.auth.signOut();
    redirect(`/${org}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Premium Navigation */}
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-8">
              <Link href={`/${org}/dashboard`} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-white">MediBridge</span>
                  <p className="text-xs text-cyan-400 font-medium">Healthcare Intelligence</p>
                </div>
              </Link>

              {/* Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <Link href={`/${org}/dashboard`} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Dashboard
                </Link>
                <Link href={`/${org}/prescriptions`} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Prescriptions
                </Link>
                <Link href={`/${org}/profile`} className="px-4 py-2 text-sm font-semibold text-white bg-white/10 rounded-lg">
                  Profile
                </Link>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {(user.user_metadata?.full_name || 'Test User').split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">{user.user_metadata?.full_name || 'Test User'}</span>
              </div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            My Profile
          </h1>
          <p className="text-xl text-gray-300">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/30">
                <span className="text-white font-bold text-5xl">
                  {(user.user_metadata?.full_name || 'Test User').split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {user.user_metadata?.full_name || 'Test User'}
              </h2>
              <p className="text-gray-400 mb-6">{user.email}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-400">Account Active</span>
                </div>
                <div className="text-sm text-gray-400">
                  <p>Member since</p>
                  <p className="font-semibold text-white">
                    {new Date(user.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Personal Information</h3>
                <button className="px-4 py-2 bg-white/5 text-gray-300 text-sm font-medium rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                  Edit
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                    <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                      {user.user_metadata?.full_name || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                    <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                      {user.user_metadata?.phone || '+91 9876543210'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                    <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                      {user.user_metadata?.dob || 'Not provided'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                  <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                    {user.user_metadata?.address || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Medical Information</h3>
                <button className="px-4 py-2 bg-white/5 text-gray-300 text-sm font-medium rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                  Update
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Blood Group</label>
                  <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                    {user.user_metadata?.blood_group || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Allergies</label>
                  <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                    {user.user_metadata?.allergies || 'None reported'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Chronic Conditions</label>
                  <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white">
                    {user.user_metadata?.conditions || 'None reported'}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="font-semibold text-white mb-1">Preferred Language</p>
                    <p className="text-sm text-gray-400">Choose your preferred language for AI responses</p>
                  </div>
                  <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500">
                    <option>English</option>
                    <option>हिंदी (Hindi)</option>
                    <option>தமிழ் (Tamil)</option>
                    <option>తెలుగు (Telugu)</option>
                    <option>বাংলা (Bengali)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="font-semibold text-white mb-1">Email Notifications</p>
                    <p className="text-sm text-gray-400">Receive updates about your prescriptions</p>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="font-semibold text-white mb-1">WhatsApp Reminders</p>
                    <p className="text-sm text-gray-400">Get medicine reminders via WhatsApp</p>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative transition-colors">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Security</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">Change Password</p>
                      <p className="text-sm text-gray-400">Update your account password</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-400">Add an extra layer of security</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30">
                    Coming Soon
                  </span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8">
              <h3 className="text-2xl font-bold text-red-400 mb-6">Danger Zone</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/30 hover:bg-red-500/20 transition-colors group">
                  <div className="text-left">
                    <p className="font-semibold text-red-400">Delete Account</p>
                    <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                  </div>
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}