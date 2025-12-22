import Link from 'next/link';
import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface OrgPageProps {
  params: Promise<{ org: string }>;
}

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
  },
  purple: {
    name: 'purple',
    textPrimary: 'text-purple-400',
    textPrimaryLight: 'text-purple-300',
    textMuted: 'text-purple-300',
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
  },
  emerald: {
    name: 'emerald',
    textPrimary: 'text-emerald-400',
    textPrimaryLight: 'text-emerald-300',
    textMuted: 'text-emerald-300',
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
  },
  blue: {
    name: 'blue',
    textPrimary: 'text-blue-400',
    textPrimaryLight: 'text-blue-300',
    textMuted: 'text-blue-300',
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
  },
  rose: {
    name: 'rose',
    textPrimary: 'text-rose-400',
    textPrimaryLight: 'text-rose-300',
    textMuted: 'text-rose-300',
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
// MAIN PAGE COMPONENT
// ============================================================

export default async function OrgLandingPage({ params }: OrgPageProps) {
  const { org } = await params;
  const supabase = await createSupabaseServer();

  // Check if user is already logged in
  const { data: { user } } = await supabase.auth.getUser();
  
  // If logged in, redirect to dashboard
  if (user) {
    redirect(`/${org}/dashboard`);
  }

  // Get organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', org)
    .single();

  // Get clinic profile with custom colors
  let theme = DEFAULT_THEME;
  let themePreset = THEME_PRESETS.cyan;
  let contactPhone = '';
  
  if (organization) {
    const { data: clinicProfile } = await supabase
      .from('clinic_profiles')
      .select('custom_colors, tagline, contact_phone')
      .eq('organization_id', organization.id)
      .single();

    if (clinicProfile?.custom_colors) {
      theme = getThemeColors(clinicProfile.custom_colors);
      themePreset = getThemePresetFromColors(clinicProfile.custom_colors);
    }
    if (clinicProfile?.contact_phone) {
      contactPhone = clinicProfile.contact_phone;
    }
  }

  // Get organization name
  const orgName = organization?.name || org
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
                href={`/${org}/auth?mode=login`}
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

      {/* Hero Section - Full Width */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: themePreset.heroGradient }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: `${theme.primary}15` }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: `${theme.secondary}15` }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-32 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 ${themePreset.bgPrimaryLight} ${themePreset.borderPrimaryLight} border rounded-full mb-8`}>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className={`text-sm font-semibold ${themePreset.textMuted}`}>24/7 AI-Powered Healthcare</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Welcome to Your<br />
            <span className={themePreset.textPrimary}>Healthcare Companion</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Get instant AI-powered prescription analysis, medicine information, and personalized health guidance in your language
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href={`/${org}/auth?mode=signup`}
              className="w-full sm:w-auto px-8 py-4 text-white font-bold rounded-xl shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              style={{ background: theme.primary, boxShadow: `0 20px 60px ${theme.primary}40` }}
            >
              <span>Get Started Free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href={`/${org}/auth?mode=login`}
              className="w-full sm:w-auto px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-white/5 text-white border-2 border-white/10 hover:bg-white/10"
            >
              <span>Already have an account?</span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${themePreset.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Available 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className={`w-5 h-5 ${themePreset.textPrimary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="text-sm font-medium">9+ Languages</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need for Better Healthcare
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive AI-powered tools to help you understand and manage your health
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2" style={{ ['--hover-border-color' as any]: `${theme.primaryLight}50` }}>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"
                style={{ background: `${theme.primary}15` }}
              >
                <svg className="w-8 h-8" style={{ color: theme.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Understand Your Medicines
              </h3>
              <p className="text-gray-600">
                Clear explanations of your prescriptions in your language. Know what you're taking and why.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"
                style={{ background: `${theme.secondary}15` }}
              >
                <svg className="w-8 h-8" style={{ color: theme.secondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                24/7 AI Assistant
              </h3>
              <p className="text-gray-600">
                Get instant answers to your health questions anytime, anywhere in multiple languages.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"
                style={{ background: `${theme.accent}15` }}
              >
                <svg className="w-8 h-8" style={{ color: theme.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Book Tests & Appointments
              </h3>
              <p className="text-gray-600">
                Schedule lab tests and follow-up visits easily from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section 
        className="py-20"
        style={{ background: themePreset.heroGradient }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                style={{ background: theme.primary, boxShadow: `0 20px 60px ${theme.primary}40` }}
              >
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Upload Prescription</h3>
              <p className="text-gray-400">
                Take a photo or upload your prescription in any format
              </p>
            </div>

            <div className="text-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
                style={{ background: theme.secondary, boxShadow: `0 20px 60px ${theme.secondary}40` }}
              >
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Analysis</h3>
              <p className="text-gray-400">
                Our AI instantly analyzes and explains everything
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl" style={{ boxShadow: '0 20px 60px rgba(34, 197, 94, 0.4)' }}>
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Get Guidance</h3>
              <p className="text-gray-400">
                Ask questions and get personalized healthcare support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div 
            className="max-w-4xl mx-auto rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden"
            style={{ background: theme.primary, boxShadow: `0 30px 100px ${theme.primary}50` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-white/80">
                Join thousands of patients getting better healthcare with AI
              </p>
              <Link
                href={`/${org}/auth?mode=signup`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                style={{ color: theme.primary }}
              >
                <span>Create Free Account</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: theme.primary }}
              >
                <span className="text-white font-bold text-sm">{orgName.charAt(0)}</span>
              </div>
              <p className="text-sm text-gray-400">
                Powered by <span className="font-semibold text-white">MediBridge24x7</span>
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}