import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function validateEnvironmentVariables() {
  const errors: string[] = [];

  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is required');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL');
  } else if (!supabaseUrl.includes('.supabase.co')) {
    errors.push('VITE_SUPABASE_URL must be a valid Supabase URL');
  }

  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  } else if (supabaseAnonKey.length < 100) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }

  if (errors.length > 0) {
    const errorMessage = [
      'Environment variable validation failed:',
      ...errors.map((err) => `  - ${err}`),
      '',
      'Please check your .env file and ensure all required variables are set correctly.',
      'See .env.example for reference.',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

validateEnvironmentVariables();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
