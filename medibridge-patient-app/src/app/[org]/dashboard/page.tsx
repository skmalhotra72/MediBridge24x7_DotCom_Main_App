import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';

interface DashboardPageProps {
  params: Promise<{ org: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { org } = await params;
  const supabase = await createSupabaseServer();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${org}/auth?mode=login`);
  }

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('id, file_url, file_type, status, created_at, upload_source')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const handleSignOut = async () => {
    'use server';
    const supabase = await createSupabaseServer();
    await supabase.auth.signOut();
    redirect(`/${org}`);
  };

  const totalPrescriptions = prescriptions?.length || 0;
  const analyzedCount = prescriptions?.filter(p => p.status === 'analyzed').length || 0;
  const pendingCount = prescriptions?.filter(p => p.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Premium Navigation */}
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-white">MediBridge</span>
                  <p className="text-xs text-cyan-400 font-medium">Healthcare Intelligence</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="hidden md:flex items-center gap-2">
                <Link href={`/${org}/dashboard`} className="px-4 py-2 text-sm font-semibold text-white bg-white/10 rounded-lg">
                  Dashboard
                </Link>
                <Link href={`/${org}/prescriptions`} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  Prescriptions
                </Link>
                <Link href={`/${org}/profile`} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
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
        
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Healthcare That <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Never Sleeps
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Your 24/7 AI-powered healthcare companion. Get instant prescription analysis, smart reminders, and personalized guidance.
          </p>
        </div>

        {/* Stats Grid - Like Main Website */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-cyan-400 text-sm font-semibold mb-2">Total Uploads</p>
            <p className="text-4xl font-bold text-white mb-1">{totalPrescriptions}</p>
            <p className="text-gray-400 text-xs">Prescriptions analyzed</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-green-400 text-sm font-semibold mb-2">Completed</p>
            <p className="text-4xl font-bold text-white mb-1">{analyzedCount}</p>
            <p className="text-gray-400 text-xs">Ready to view</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-amber-400 text-sm font-semibold mb-2">Processing</p>
            <p className="text-4xl font-bold text-white mb-1">{pendingCount}</p>
            <p className="text-gray-400 text-xs">In queue</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-purple-400 text-sm font-semibold mb-2">Success Rate</p>
            <p className="text-4xl font-bold text-white mb-1">98%</p>
            <p className="text-gray-400 text-xs">Accuracy score</p>
          </div>
        </div>

        {/* Primary CTA - Upload Prescription */}
        <div className="mb-12 relative group overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 p-12 shadow-2xl shadow-cyan-500/20">
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">AI Ready • 9+ Languages</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Upload Your Prescription
              </h2>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Get instant AI-powered analysis, medicine information, and personalized health guidance in your preferred language
              </p>
              <Link
                href={`/${org}/upload`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Now</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Decorative element */}
            <div className="hidden lg:block relative">
              <div className="w-64 h-64">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 rotate-6 group-hover:rotate-12 transition-transform duration-700"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-32 h-32 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid - Matching Main Website Style */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">Quick Access</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* AI Assistant */}
            <Link
              href={`/${org}/chat`}
              className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  AI Health Assistant
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  24/7 multilingual support for all your medicine and health queries
                </p>
                <div className="flex items-center text-cyan-400 font-semibold group-hover:translate-x-2 transition-transform">
                  <span>Start Chat</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Lab Tests - Coming Soon */}
            <div className="relative bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-3xl p-8 border-2 border-dashed border-purple-500/30 overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                  Coming Soon
                </span>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 opacity-50">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-3">
                Book Lab Tests
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Home sample collection with certified labs at competitive prices
              </p>
            </div>

            {/* Health Profile */}
            <Link
              href={`/${org}/profile`}
              className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  Health Profile
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Manage your medical history, allergies, and health preferences
                </p>
                <div className="flex items-center text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                  <span>View Profile</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Prescriptions Section */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
          <div className="px-8 py-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">My Prescriptions</h2>
                  <p className="text-sm text-gray-400 mt-1">Your healthcare journey at a glance</p>
                </div>
              </div>
              {prescriptions && prescriptions.length > 0 && (
                <Link 
                  href={`/${org}/prescriptions`}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  View All
                </Link>
              )}
            </div>
          </div>

          {!prescriptions || prescriptions.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Start Your Healthcare Journey</h3>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Upload your first prescription to unlock AI-powered analysis and personalized health guidance
              </p>
              <Link
                href={`/${org}/upload`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-600 shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload First Prescription
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {prescriptions.map((prescription) => (
                <div 
                  key={prescription.id} 
                  className="px-8 py-5 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                        {prescription.file_type?.includes('pdf') ? (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-white mb-1">
                          Prescription #{prescription.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(prescription.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })} • {new Date(prescription.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 text-sm font-bold rounded-xl ${
                        prescription.status === 'analyzed' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : prescription.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {prescription.status === 'analyzed' ? '✓ Analyzed' : 
                         prescription.status === 'pending' ? '○ Processing' : 
                         'New'}
                      </span>
                      
                      <Link
                        href={`/${org}/chat?prescription_id=${prescription.id}&session=${prescription.id}`}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trust Indicators - Matching Main Website */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white">100% Secure</p>
              <p className="text-sm text-gray-400">Bank-grade encryption</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white">24/7 Available</p>
              <p className="text-sm text-gray-400">Always here to help</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white">9+ Languages</p>
              <p className="text-sm text-gray-400">Multilingual support</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}