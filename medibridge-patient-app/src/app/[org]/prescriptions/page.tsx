import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';

interface PrescriptionsPageProps {
  params: Promise<{ org: string }>;
}

export default async function PrescriptionsPage({ params }: PrescriptionsPageProps) {
  const { org } = await params;
  const supabase = await createSupabaseServer();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${org}/auth?mode=login`);
  }

  // Fetch ALL user's prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('id, file_url, file_type, status, created_at, upload_source')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                href={`/${org}/dashboard`}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Back
              </Link>
              <h1 className="text-xl font-bold text-gray-900">My Prescriptions</h1>
            </div>
            <div className="flex items-center">
              <Link
                href={`/${org}/upload`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                + Upload New
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Prescriptions</p>
            <p className="text-2xl font-bold text-gray-900">{prescriptions?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Analyzed</p>
            <p className="text-2xl font-bold text-green-600">
              {prescriptions?.filter(p => p.status === 'analyzed').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {prescriptions?.filter(p => p.status === 'pending').length || 0}
            </p>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Prescriptions</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {!prescriptions || prescriptions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions yet</h3>
                <p className="text-gray-500 mb-6">Upload your first prescription to get AI-powered analysis</p>
                <Link
                  href={`/${org}/upload`}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                  Upload Prescription
                </Link>
              </div>
            ) : (
              prescriptions.map((prescription) => (
                <div key={prescription.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        {prescription.file_type?.includes('pdf') ? (
                          <span className="text-2xl">📄</span>
                        ) : (
                          <span className="text-2xl">🖼️</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Prescription #{prescription.id.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(prescription.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Source: {prescription.upload_source || 'web'} • Type: {prescription.file_type || 'unknown'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
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
                      
                      {prescription.file_url && (
                        <a
                          href={prescription.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                        >
                          📎 File
                        </a>
                      )}
                      
                      <Link
                        href={`/${org}/chat?prescription_id=${prescription.id}&session=${prescription.id}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                      >
                        View Analysis →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Tips
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Click <strong>"View Analysis"</strong> to see AI-powered insights about your prescription</li>
            <li>• You can ask follow-up questions in the chat</li>
            <li>• Type <strong>"analyze again"</strong> in chat to get a fresh analysis</li>
            <li>• All your conversations are saved for future reference</li>
          </ul>
        </div>
      </main>
    </div>
  );
}