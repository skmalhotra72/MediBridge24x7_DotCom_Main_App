'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
}

export default function LandingPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Fetch organizations on page load
  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, subdomain')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
      
      // Auto-select first org if available
      if (data && data.length > 0) {
        setSelectedOrg(data[0].subdomain);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!selectedOrg) {
        throw new Error('Please select an organization');
      }

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to organization dashboard
      router.push(`/${selectedOrg}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            MediBridge24x7
          </h1>
          <p className="text-gray-600">
            Your AI-Powered Healthcare Companion
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Welcome Back
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Organization Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Organization
              </label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Choose Organization --</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.subdomain}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  if (selectedOrg) {
                    router.push(`/${selectedOrg}/auth?mode=signup`);
                  } else {
                    setError('Please select an organization first');
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign Up
              </button>
            </p>
            <p className="text-xs text-gray-500">
              🔒 Your data is secure and encrypted
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">💊</div>
            <p className="text-xs text-gray-600">Prescription Help</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-xs text-gray-600">24/7 AI Support</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📅</div>
            <p className="text-xs text-gray-600">Easy Booking</p>
          </div>
        </div>
      </div>
    </div>
  );
}