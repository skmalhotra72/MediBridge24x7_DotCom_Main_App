'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ============================================================
// THEME SYSTEM - Dynamic colors based on clinic_profiles
// ============================================================

// Default theme (cyan - universal default)
const DEFAULT_THEME = {
  primary: '#06b6d4',
  primaryLight: '#22d3ee',
  primaryDark: '#0891b2',
  secondary: '#3b82f6',
  accent: '#8b5cf6',
  background: '#0f172a',
  surface: '#164e63',
  text: '#ffffff',
  textMuted: '#a5f3fc',
};

// Theme presets for Tailwind classes
const THEME_PRESETS = {
  cyan: {
    name: 'cyan',
    // Text colors
    textPrimary: 'text-cyan-400',
    textPrimaryLight: 'text-cyan-300',
    textMuted: 'text-cyan-300',
    textPrimaryHex: '#22d3ee',
    // Background colors
    bgPrimary: 'bg-cyan-500',
    bgPrimaryLight: 'bg-cyan-500/20',
    bgPrimaryLighter: 'bg-cyan-500/10',
    bgPrimaryDark: 'bg-cyan-900',
    // Border colors
    borderPrimary: 'border-cyan-500',
    borderPrimaryLight: 'border-cyan-500/30',
    // Hover states
    hoverBg: 'hover:bg-cyan-600',
    hoverText: 'hover:text-cyan-300',
    // Gradient - DARK NAVY BLUE (matching production)
    heroGradient: 'linear-gradient(135deg, #0a1628 0%, #162033 50%, #0a1628 100%)',
    // Focus ring
    focusRing: 'focus:ring-cyan-500',
    // Button text color
    buttonText: 'text-cyan-600',
    buttonTextHover: 'hover:text-cyan-700',
  },
  purple: {
    name: 'purple',
    textPrimary: 'text-purple-400',
    textPrimaryLight: 'text-purple-300',
    textMuted: 'text-purple-300',
    textPrimaryHex: '#c4b5fd',
    bgPrimary: 'bg-purple-500',
    bgPrimaryLight: 'bg-purple-500/20',
    bgPrimaryLighter: 'bg-purple-500/10',
    bgPrimaryDark: 'bg-purple-900',
    borderPrimary: 'border-purple-500',
    borderPrimaryLight: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-600',
    hoverText: 'hover:text-purple-300',
    heroGradient: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
    focusRing: 'focus:ring-purple-500',
    buttonText: 'text-purple-600',
    buttonTextHover: 'hover:text-purple-700',
  },
  emerald: {
    name: 'emerald',
    textPrimary: 'text-emerald-400',
    textPrimaryLight: 'text-emerald-300',
    textMuted: 'text-emerald-300',
    textPrimaryHex: '#6ee7b7',
    bgPrimary: 'bg-emerald-500',
    bgPrimaryLight: 'bg-emerald-500/20',
    bgPrimaryLighter: 'bg-emerald-500/10',
    bgPrimaryDark: 'bg-emerald-900',
    borderPrimary: 'border-emerald-500',
    borderPrimaryLight: 'border-emerald-500/30',
    hoverBg: 'hover:bg-emerald-600',
    hoverText: 'hover:text-emerald-300',
    heroGradient: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f172a 100%)',
    focusRing: 'focus:ring-emerald-500',
    buttonText: 'text-emerald-600',
    buttonTextHover: 'hover:text-emerald-700',
  },
  blue: {
    name: 'blue',
    textPrimary: 'text-blue-400',
    textPrimaryLight: 'text-blue-300',
    textMuted: 'text-blue-300',
    textPrimaryHex: '#93c5fd',
    bgPrimary: 'bg-blue-500',
    bgPrimaryLight: 'bg-blue-500/20',
    bgPrimaryLighter: 'bg-blue-500/10',
    bgPrimaryDark: 'bg-blue-900',
    borderPrimary: 'border-blue-500',
    borderPrimaryLight: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-600',
    hoverText: 'hover:text-blue-300',
    heroGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
    focusRing: 'focus:ring-blue-500',
    buttonText: 'text-blue-600',
    buttonTextHover: 'hover:text-blue-700',
  },
  rose: {
    name: 'rose',
    textPrimary: 'text-rose-400',
    textPrimaryLight: 'text-rose-300',
    textMuted: 'text-rose-300',
    textPrimaryHex: '#fda4af',
    bgPrimary: 'bg-rose-500',
    bgPrimaryLight: 'bg-rose-500/20',
    bgPrimaryLighter: 'bg-rose-500/10',
    bgPrimaryDark: 'bg-rose-900',
    borderPrimary: 'border-rose-500',
    borderPrimaryLight: 'border-rose-500/30',
    hoverBg: 'hover:bg-rose-600',
    hoverText: 'hover:text-rose-300',
    heroGradient: 'linear-gradient(135deg, #0f172a 0%, #881337 50%, #0f172a 100%)',
    focusRing: 'focus:ring-rose-500',
    buttonText: 'text-rose-600',
    buttonTextHover: 'hover:text-rose-700',
  }
};

type ThemePreset = typeof THEME_PRESETS.cyan;

// Function to detect theme from custom_colors
function getThemePresetFromColors(customColors: any): ThemePreset {
  if (!customColors) return THEME_PRESETS.cyan;
  
  const primary = customColors.primary?.toLowerCase() || '';
  
  // Match based on primary color hex
  if (primary.includes('7c3aed') || primary.includes('8b5cf6') || primary.includes('a855f7')) {
    return THEME_PRESETS.purple;
  }
  if (primary.includes('06b6d4') || primary.includes('22d3ee') || primary.includes('0ea5e9')) {
    return THEME_PRESETS.cyan;
  }
  if (primary.includes('10b981') || primary.includes('34d399') || primary.includes('14b8a6')) {
    return THEME_PRESETS.emerald;
  }
  if (primary.includes('3b82f6') || primary.includes('6366f1') || primary.includes('818cf8')) {
    return THEME_PRESETS.blue;
  }
  if (primary.includes('f43f5e') || primary.includes('ec4899') || primary.includes('fb7185')) {
    return THEME_PRESETS.rose;
  }
  
  // Check for theme name in customColors
  if (customColors.themeName) {
    const themeName = customColors.themeName.toLowerCase();
    if (themeName in THEME_PRESETS) {
      return THEME_PRESETS[themeName as keyof typeof THEME_PRESETS];
    }
  }
  
  return THEME_PRESETS.cyan; // Default fallback
}

// Function to get inline theme colors (for dynamic hex values)
function getThemeColors(customColors: any) {
  if (!customColors?.primary) return DEFAULT_THEME;
  
  const primary = customColors.primary;
  
  // Detect and return appropriate color palette
  if (primary.includes('7c3aed') || primary.includes('8b5cf6')) {
    return {
      ...DEFAULT_THEME,
      primary: '#7c3aed',
      primaryLight: '#a78bfa',
      primaryDark: '#5b21b6',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      surface: '#581c87',
      textMuted: '#c4b5fd',
    };
  }
  if (primary.includes('06b6d4') || primary.includes('22d3ee')) {
    return {
      ...DEFAULT_THEME,
      primary: '#06b6d4',
      primaryLight: '#22d3ee',
      primaryDark: '#0891b2',
      secondary: '#3b82f6',
      accent: '#8b5cf6',
      surface: '#164e63',
      textMuted: '#a5f3fc',
    };
  }
  
  // Return custom colors merged with defaults
  return { ...DEFAULT_THEME, ...customColors };
}

// ============================================================
// AUTH CONTENT COMPONENT
// ============================================================

function AuthContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const org = params.org as string;
  const initialMode = searchParams.get('mode') || 'login';

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode as 'login' | 'signup');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [orgName, setOrgName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [themePreset, setThemePreset] = useState<ThemePreset>(THEME_PRESETS.cyan);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    async function fetchClinicData() {
      const supabase = createClient();

      // Check if already logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // UPDATED: Check if redirect=admin in URL
        const redirectTo = searchParams.get('redirect');
        if (redirectTo === 'admin') {
          router.push(`/${org}/admin/clinic-website`);
        } else {
          router.push(`/${org}/dashboard`);
        }
        return;
      }

      // Get organization
      const { data: organization } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('slug', org)
        .single();

      if (organization) {
        setOrgName(organization.name);

        // Get clinic profile with custom colors
        const { data: clinicProfile } = await supabase
          .from('clinic_profiles')
          .select('custom_colors, contact_phone')
          .eq('organization_id', organization.id)
          .single();

        if (clinicProfile?.custom_colors) {
          setTheme(getThemeColors(clinicProfile.custom_colors));
          setThemePreset(getThemePresetFromColors(clinicProfile.custom_colors));
        }
        if (clinicProfile?.contact_phone) {
          setContactPhone(clinicProfile.contact_phone);
        }
      } else {
        setOrgName(org.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
      }

      setLoading(false);
    }

    fetchClinicData();
  }, [org, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // UPDATED: Check if redirect=admin in URL
        const redirectTo = searchParams.get('redirect');
        if (redirectTo === 'admin') {
          router.push(`/${org}/admin/clinic-website`);
        } else {
          router.push(`/${org}/dashboard`);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              organization_slug: org,
            },
          },
        });
        if (error) throw error;
        setSuccess('Account created! Please check your email to verify.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div 
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${theme.primary}30`, borderTopColor: theme.primary }}
        />
      </div>
    );
  }

  const features = [
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Instant Analysis', 
      desc: 'AI-powered prescription analysis in under 30 seconds' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      title: '9+ Languages', 
      desc: 'Get healthcare guidance in your preferred language' 
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: '100% Secure', 
      desc: 'Bank-grade encryption protects your health data' 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header - Full Width, Matching Clinic Website */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/${org}`} className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: theme.primary }}
              >
                <span className="text-white font-bold">{orgName.charAt(0)}</span>
              </div>
              <div>
                <span className="font-bold text-white">{orgName}</span>
                <p className={`text-xs ${themePreset.textMuted}`}>Powered by MediBridge</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link href={`/clinic/${org}#doctors`} className="text-sm text-white/80 hover:text-white transition-colors">
                Our Doctors
              </Link>
              <Link href={`/clinic/${org}#services`} className="text-sm text-white/80 hover:text-white transition-colors">
                Services
              </Link>
              <Link href={`/clinic/${org}#medibridge`} className="text-sm text-white/80 hover:text-white transition-colors">
                General Care
              </Link>
              <Link href={`/clinic/${org}#testimonials`} className="text-sm text-white/80 hover:text-white transition-colors">
                Reviews
              </Link>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href={`/${org}`}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Patient Portal
              </Link>
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{ background: theme.primary }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Content - Full Width */}
      <div 
        className="min-h-screen pt-16 flex items-center"
        style={{ background: themePreset.heroGradient }}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Branding */}
            <div className="hidden lg:block">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: theme.primary, boxShadow: `0 10px 40px ${theme.primary}50` }}
                >
                  <span className="text-white font-bold text-xl">{orgName.charAt(0)}</span>
                </div>
                <div>
                  <span className="font-bold text-xl text-white">{orgName}</span>
                  <p className={`text-sm ${themePreset.textMuted}`}>Healthcare Intelligence</p>
                </div>
              </div>

              {/* Tagline */}
              <h1 className="text-4xl font-bold text-white mb-2">
                Healthcare That
              </h1>
              <h2 className={`text-4xl font-bold ${themePreset.textPrimary} mb-6`}>
                Never Sleeps
              </h2>

              <p className="text-lg text-gray-300 mb-8">
                Your 24/7 AI-powered healthcare companion for prescription 
                analysis and personalized guidance.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm"
                  >
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${themePreset.textMuted}`}
                      style={{ background: `${theme.primary}30` }}
                    >
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: theme.primary }}
                >
                  <span className="text-white font-bold">{orgName.charAt(0)}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{orgName}</span>
                  <p className="text-xs" style={{ color: theme.primary }}>Powered by MediBridge</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="mb-6 text-gray-500">
                {mode === 'login' 
                  ? 'Sign in to access your healthcare dashboard' 
                  : 'Get started with your free account'}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm border border-green-100">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 ${themePreset.focusRing} focus:border-transparent transition-all`}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 ${themePreset.focusRing} focus:border-transparent transition-all`}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 ${themePreset.focusRing} focus:border-transparent transition-all`}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                        style={{ accentColor: theme.primary }}
                      />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <a 
                      href="#" 
                      className={`text-sm font-medium ${themePreset.buttonText} ${themePreset.buttonTextHover} transition-colors`}
                    >
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: theme.primary }}
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  {' '}
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`font-semibold ${themePreset.buttonText} ${themePreset.buttonTextHover} transition-colors`}
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t text-center text-xs text-gray-400">
                By continuing, you agree to our{' '}
                <a href="#" className={`${themePreset.buttonText} hover:underline`}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" className={`${themePreset.buttonText} hover:underline`}>Privacy Policy</a>
              </div>

              {/* Back to Home */}
              <div className="mt-4 text-center">
                <Link
                  href={`/${org}`}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN AUTH PAGE WITH SUSPENSE
// ============================================================

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}