import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface OrgHomePageProps {
  params: Promise<{ org: string }>;
}

export default async function OrgHomePage({ params }: OrgHomePageProps) {
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
    <div className="space-y-12">
      <section className="text-center py-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Your Healthcare Companion
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get 24/7 support for your prescriptions, medicines, and health questions
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">💊</div>
          <h3 className="text-xl font-semibold mb-2">Understand Your Medicines</h3>
          <p className="text-gray-600">
            Clear explanations of your prescriptions in your language
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">24/7 AI Assistant</h3>
          <p className="text-gray-600">
            Get instant answers to your health questions anytime
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">Book Tests & Appointments</h3>
          <p className="text-gray-600">
            Schedule lab tests and follow-up visits easily
          </p>
        </div>
      </section>

      <section className="text-center space-y-6">
        <div className="flex gap-4 justify-center">
          <Link
            href={`/${org}/auth?mode=signup`}
            className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
          >
            Get Started
          </Link>
          <Link
            href={`/${org}/auth?mode=login`}
            className="px-8 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition"
          >
            Sign In
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          🔒 Your health data is secure and private
        </p>
      </section>
    </div>
  );
}
