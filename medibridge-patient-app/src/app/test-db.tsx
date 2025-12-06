import { createSupabaseServer } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createSupabaseServer();
  
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .limit(5);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Supabase Connection Test</h1>
      
      <h2>Organizations Query:</h2>
      {error ? (
        <pre style={{ color: 'red' }}>ERROR: {JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(orgs, null, 2)}</pre>
      )}
      
      <h2>Environment Variables:</h2>
      <pre>
        SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
        {'\n'}
        SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
      </pre>
    </div>
  );
}
