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
// Fetch user's prescriptions
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.user_metadata?.full_name || user.email}
              </span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {user.user_metadata?.full_name || 'User'}! 👋
          </h2>
          <p className="text-gray-600 mb-4">
            Your account: <strong>{user.email}</strong>
          </p>
          <p className="text-gray-600">
            Phone: <strong>{user.user_metadata?.phone || 'Not provided'}</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href={`/${org}/upload`}
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Prescription
            </h3>
            <p className="text-sm text-gray-600">
              Upload your prescription to get AI-powered guidance
            </p>
          </Link>

          <Link
            href={`/${org}/chat`}
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chat with AI Assistant
            </h3>
            <p className="text-sm text-gray-600">
              Ask questions about your medicines and health
            </p>
          </Link>

          <Link
            href={`/${org}/profile`}
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              My Profile
            </h3>
            <p className="text-sm text-gray-600">
              View and update your personal information
            </p>
          </Link>
        </div>

       {/* My Prescriptions Section */}
       <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📋</span> My Prescriptions
            </h3>
            {prescriptions && prescriptions.length > 0 && (
              <Link 
                href={`/${org}/prescriptions`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All →
              </Link>
            )}
          </div>
          
          <div className="divide-y divide-gray-200">
            {!prescriptions || prescriptions.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-gray-500 mb-4">No prescriptions uploaded yet</p>
                <Link
                  href={`/${org}/upload`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Upload Your First Prescription
                </Link>
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <div key={prescription.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        {prescription.file_type?.includes('pdf') ? (
                          <span className="text-lg">📄</span>
                        ) : (
                          <span className="text-lg">🖼️</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Prescription #{prescription.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(prescription.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        prescription.status === 'analyzed' 
                          ? 'bg-green-100 text-green-800' 
                          : prescription.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prescription.status === 'analyzed' ? '✅ Analyzed' : 
                         prescription.status === 'pending' ? '⏳ Pending' : 
                         prescription.status || 'New'}
                      </span>
                      
                      <Link
                        href={`/${org}/chat?prescription_id=${prescription.id}&session=${prescription.id}`}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Account Status */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🎉 Your account is active!
          </h3>
          <p className="text-sm text-blue-700">
            You can now upload prescriptions, chat with our AI assistant, and manage your health records.
          </p>
        </div>
      </main>
    </div>
  );
}
