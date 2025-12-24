'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
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
// OTP CONFIG
// ============================================================

const N8N_BASE_URL = 'https://n8n.nhcare.in/webhook';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

// ============================================================
// AUTH CONTENT COMPONENT
// ============================================================

function AuthContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const org = params.org as string;
  const initialMode = searchParams.get('mode') || 'login';

  // Auth mode: 'login' | 'signup' | 'otp-phone' | 'otp-verify' | 'otp-profile'
  const [mode, setMode] = useState<'login' | 'signup' | 'otp-phone' | 'otp-verify' | 'otp-profile'>(initialMode as 'login' | 'signup');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [themePreset, setThemePreset] = useState<ThemePreset>(THEME_PRESETS.cyan);

  // Email/Password Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // OTP Form state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phoneMasked, setPhoneMasked] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpPatientData, setOtpPatientData] = useState<any>(null);
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [profileEmail, setProfileEmail] = useState('');

  // Refs for OTP inputs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
        setOrgId(organization.id);

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

  // ============================================================
  // PHONE UTILITIES
  // ============================================================

  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const isValidPhone = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const getFullPhoneE164 = (phone: string) => {
    return `91${phone}`;
  };

  // ============================================================
  // OTP HANDLERS
  // ============================================================

  const requestOTP = async () => {
    if (!isValidPhone(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${N8N_BASE_URL}/medibridge-otp-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_e164: getFullPhoneE164(phone),
          purpose: 'login'
        })
      });

      const data = await response.json();

      if (data.success) {
        setPhoneMasked(data.phone_masked || `+91 ${phone.slice(0, 5)}•••••`);
        setMode('otp-verify');
        setResendCooldown(RESEND_COOLDOWN);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP request error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${N8N_BASE_URL}/medibridge-otp-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_e164: getFullPhoneE164(phone),
          otp_code: otpCode,
          purpose: 'login'
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpPatientData(data);

        if (data.status === 'new_patient' || data.needs_profile_completion) {
          setMode('otp-profile');
        } else {
          await createOTPSession(data);
        }
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
        if (data.attempts_remaining !== undefined && data.attempts_remaining <= 0) {
          setError('Too many failed attempts. Please request a new OTP.');
          setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const completeOTPProfile = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .upsert({
          phone_e164: getFullPhoneE164(phone),
          whatsapp_wa_id: getFullPhoneE164(phone),
          full_name: fullName.trim(),
          email: profileEmail.trim() || null,
          whatsapp_consent_given_at: whatsappConsent ? new Date().toISOString() : null,
          whatsapp_opt_out: !whatsappConsent,
          onboarded_via: 'web_otp',
          organization_id: orgId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_e164'
        })
        .select()
        .single();

      if (patientError) {
        console.error('Profile save error:', patientError);
        setError('Failed to save profile. Please try again.');
        return;
      }

      await createOTPSession({
        success: true,
        status: 'existing_patient',
        message: 'Profile completed',
        patient_id: patient.id,
        patient_name: fullName.trim(),
        organization_id: patient.organization_id || orgId
      });

    } catch (err) {
      console.error('Profile completion error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const createOTPSession = async (data: any) => {
    localStorage.setItem('medibridge_patient', JSON.stringify({
      patient_id: data.patient_id,
      patient_name: data.patient_name,
      phone_e164: getFullPhoneE164(phone),
      organization_id: data.organization_id || orgId,
      authenticated_at: new Date().toISOString()
    }));

    setSuccess('Login successful! Redirecting...');

    setTimeout(() => {
      router.push(`/${org}/dashboard`);
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (digit && index === OTP_LENGTH - 1) {
      const completeOtp = newOtp.join('');
      if (completeOtp.length === OTP_LENGTH) {
        setTimeout(() => verifyOTP(), 300);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);

    if (pastedData) {
      const newOtp = [...otp];
      pastedData.split('').forEach((digit, index) => {
        if (index < OTP_LENGTH) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);

      if (pastedData.length >= OTP_LENGTH) {
        setTimeout(() => verifyOTP(), 300);
      } else {
        otpRefs.current[pastedData.length]?.focus();
      }
    }
  };

  // ============================================================
  // EMAIL/PASSWORD HANDLER
  // ============================================================

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

  // ============================================================
  // RENDER AUTH FORM BASED ON MODE
  // ============================================================

  const renderAuthForm = () => {
    // OTP Phone Input Mode
    if (mode === 'otp-phone') {
      return (
        <>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Login with WhatsApp</h2>
          </div>
          <p className="mb-6 text-gray-500">Enter your mobile number to receive OTP on WhatsApp</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl">
                  <span className="text-lg">🇮🇳</span>
                  <span className="font-medium text-gray-700">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(formatPhoneNumber(e.target.value)); setError(null); }}
                  className={`flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 ${themePreset.focusRing} focus:border-transparent transition-all text-lg tracking-wider`}
                  placeholder="9876543210"
                  maxLength={10}
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">We'll send a 6-digit OTP to your WhatsApp</p>
            </div>

            <button
              onClick={requestOTP}
              disabled={submitting || phone.length !== 10}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Get OTP on WhatsApp
                </>
              )}
            </button>
          </div>
        </>
      );
    }

    // OTP Verify Mode
    if (mode === 'otp-verify') {
      return (
        <>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => { setMode('otp-phone'); setOtp(['', '', '', '', '', '']); setError(null); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Enter OTP</h2>
          </div>
          <p className="mb-6 text-gray-500">
            We sent a 6-digit code to<br />
            <span className="font-medium text-gray-900">{phoneMasked}</span>
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

          <div className="space-y-4">
            <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${themePreset.focusRing} focus:border-transparent transition-all`}
                  maxLength={1}
                />
              ))}
            </div>

            <button
              onClick={verifyOTP}
              disabled={submitting || otp.join('').length !== OTP_LENGTH}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: theme.primary }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verify & Continue
                </>
              )}
            </button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-gray-500 text-sm">
                  Resend OTP in <span className="font-medium">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  onClick={() => { setOtp(['', '', '', '', '', '']); setError(null); requestOTP(); }}
                  disabled={submitting}
                  className={`text-sm font-medium ${themePreset.buttonText} ${themePreset.buttonTextHover} transition-colors flex items-center gap-1 mx-auto`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </>
      );
    }

    // OTP Profile Completion Mode
    if (mode === 'otp-profile') {
      return (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="mb-6 text-gray-500">Just a few details to get started</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setError(null); }}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 ${themePreset.focusRing} focus:border-transparent transition-all`}
                placeholder="Enter your full name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 ${themePreset.focusRing} focus:border-transparent transition-all`}
                placeholder="your@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">For prescription reports & notifications</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300"
                  style={{ accentColor: theme.primary }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">WhatsApp Notifications</p>
                  <p className="text-xs text-gray-500 mt-1">
                    I consent to receive prescription analysis, health reminders, and follow-up notifications via WhatsApp.
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={completeOTPProfile}
              disabled={submitting || !fullName.trim()}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: theme.primary }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </>
      );
    }

    // Default: Login/Signup with Email + WhatsApp Button
    return (
      <>
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

        {/* WhatsApp OTP Button - Primary */}
        <button
          onClick={() => { setMode('otp-phone'); setError(null); }}
          className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all hover:opacity-90 bg-green-600 hover:bg-green-700 mb-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Continue with WhatsApp
        </button>
        <p className="text-center text-green-600 text-xs mb-6">✨ Recommended - Fast & Secure OTP Login</p>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or use email</span>
          </div>
        </div>

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

        <form onSubmit={handleEmailSubmit} className="space-y-4">
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
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-700 hover:bg-gray-600"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {mode === 'login' ? 'Sign In with Email' : 'Create Account'}
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
      </>
    );
  };

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
              {renderAuthForm()}

              {/* Terms - Show only on login/signup modes */}
              {(mode === 'login' || mode === 'signup') && (
                <>
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
                </>
              )}
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