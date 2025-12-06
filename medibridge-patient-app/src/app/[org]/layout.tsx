import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}

export default async function OrgLayout({ 
  children, 
  params 
}: OrgLayoutProps) {
  const { org } = await params;
  const supabase = await createSupabaseServer();

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('subdomain', org)
    .eq('status', 'active')
    .single();

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-primary-600">
            {organization.name}
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by MediBridge24x7
          </p>
        </div>
      </footer>
    </div>
  );
}
