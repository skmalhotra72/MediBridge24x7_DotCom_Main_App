'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Phone, 
  MessageCircle, 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  RefreshCw,
  User,
  Mail,
  Shield,
  ArrowLeft
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type AuthStep = 'phone' | 'otp' | 'profile' | 'success';

interface OTPResponse {
  success: boolean;
  message: string;
  phone_masked?: string;
  expires_in_minutes?: number;
  error?: string;
}

interface VerifyResponse {
  success: boolean;
  status: 'existing_patient' | 'new_patient';
  message: string;
  patient_id?: string;
  patient_name?: string;
  organization_id?: string;
  needs_profile_completion?: boolean;
  phone_e164?: string;
  error?: string;
  attempts_remaining?: number;
}

// ============================================
// CONFIG
// ============================================

const N8N_BASE_URL = 'https://n8n.nhcare.in/webhook';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

// ============================================
// MAIN COMPONENT
// ============================================

export default function OTPLogin() {
  const router = useRouter();
  const supabase = createClient();
  
  // State
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyData, setVerifyData] = useState<VerifyResponse | null>(null);
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  
  // Refs for OTP inputs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ============================================
  // PHONE VALIDATION
  // ============================================
  
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    return digits.slice(0, 10);
  };
  
  const isValidPhone = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  };
  
  const getFullPhoneE164 = (phone: string) => {
    return `91${phone}`;
  };

  // ============================================
  // API CALLS
  // ============================================
  
  const requestOTP = async () => {
    if (!isValidPhone(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${N8N_BASE_URL}/medibridge-otp-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_e164: getFullPhoneE164(phone),
          purpose: 'login'
        })
      });
      
      const data: OTPResponse = await response.json();
      
      if (data.success) {
        setPhoneMasked(data.phone_masked || `+91 ${phone.slice(0, 5)}•••••`);
        setStep('otp');
        setResendCooldown(RESEND_COOLDOWN);
        // Focus first OTP input
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP request error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
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
      
      const data: VerifyResponse = await response.json();
      
      if (data.success) {
        setVerifyData(data);
        
        if (data.status === 'new_patient' || data.needs_profile_completion) {
          // New user - show profile completion
          setStep('profile');
        } else {
          // Existing user - create session and redirect
          await createSession(data);
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
      setLoading(false);
    }
  };
  
  const completeProfile = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create or update patient in Supabase
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .upsert({
          phone_e164: getFullPhoneE164(phone),
          whatsapp_wa_id: getFullPhoneE164(phone),
          full_name: fullName.trim(),
          email: email.trim() || null,
          whatsapp_consent_given_at: whatsappConsent ? new Date().toISOString() : null,
          whatsapp_opt_out: !whatsappConsent,
          onboarded_via: 'web_otp',
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
      
      // Create session with updated data
      await createSession({
        success: true,
        status: 'existing_patient',
        message: 'Profile completed',
        patient_id: patient.id,
        patient_name: fullName.trim(),
        organization_id: patient.organization_id
      });
      
    } catch (err) {
      console.error('Profile completion error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const createSession = async (data: VerifyResponse) => {
    try {
      // Store session data in localStorage (for demo)
      // In production, use Supabase Auth or JWT
      localStorage.setItem('medibridge_patient', JSON.stringify({
        patient_id: data.patient_id,
        patient_name: data.patient_name,
        phone_e164: getFullPhoneE164(phone),
        organization_id: data.organization_id,
        authenticated_at: new Date().toISOString()
      }));
      
      setStep('success');
      
      // Redirect after brief success message
      setTimeout(() => {
        router.push('/dashboard'); // or wherever your main app is
      }, 2000);
      
    } catch (err) {
      console.error('Session creation error:', err);
      setError('Failed to create session. Please try again.');
    }
  };

  // ============================================
  // OTP INPUT HANDLERS
  // ============================================
  
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    
    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when complete
    if (digit && index === OTP_LENGTH - 1) {
      const completeOtp = newOtp.join('');
      if (completeOtp.length === OTP_LENGTH) {
        // Small delay to show the last digit
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
      
      // Focus last filled input or verify
      const lastIndex = Math.min(pastedData.length, OTP_LENGTH) - 1;
      if (pastedData.length >= OTP_LENGTH) {
        setTimeout(() => verifyOTP(), 300);
      } else {
        otpRefs.current[lastIndex + 1]?.focus();
      }
    }
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  
  const renderPhoneStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Login with WhatsApp</h2>
        <p className="text-slate-400">Enter your mobile number to receive OTP on WhatsApp</p>
      </div>
      
      {/* Phone Input */}
      <div className="space-y-2">
        <label className="text-sm text-slate-400">Mobile Number</label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <span className="text-xl">🇮🇳</span>
            <span className="text-white font-medium">+91</span>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(formatPhoneNumber(e.target.value));
              setError('');
            }}
            placeholder="9876543210"
            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-green-500 text-lg tracking-wider"
            maxLength={10}
            autoFocus
          />
        </div>
        <p className="text-xs text-slate-500">We'll send a 6-digit OTP to your WhatsApp</p>
      </div>
      
      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Submit Button */}
      <button
        onClick={requestOTP}
        disabled={loading || phone.length !== 10}
        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending OTP...
          </>
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            Get OTP on WhatsApp
          </>
        )}
      </button>
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-500">or continue with</span>
        </div>
      </div>
      
      {/* Alternative Login */}
      <button
        onClick={() => router.push('/auth/login')}
        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <Mail className="w-5 h-5" />
        Email & Password
      </button>
    </div>
  );
  
  const renderOtpStep = () => (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => {
          setStep('phone');
          setOtp(['', '', '', '', '', '']);
          setError('');
        }}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Change number
      </button>
      
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Enter OTP</h2>
        <p className="text-slate-400">
          We sent a 6-digit code to<br />
          <span className="text-white font-medium">{phoneMasked}</span>
        </p>
      </div>
      
      {/* OTP Input */}
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
            className="w-12 h-14 text-center text-2xl font-bold bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            maxLength={1}
          />
        ))}
      </div>
      
      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      
      {/* Verify Button */}
      <button
        onClick={verifyOTP}
        disabled={loading || otp.join('').length !== OTP_LENGTH}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Verify & Continue
          </>
        )}
      </button>
      
      {/* Resend */}
      <div className="text-center">
        {resendCooldown > 0 ? (
          <p className="text-slate-500 text-sm">
            Resend OTP in <span className="text-white font-medium">{resendCooldown}s</span>
          </p>
        ) : (
          <button
            onClick={() => {
              setOtp(['', '', '', '', '', '']);
              setError('');
              requestOTP();
            }}
            disabled={loading}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
  
  const renderProfileStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
        <p className="text-slate-400">Just a few details to get started</p>
      </div>
      
      {/* Form */}
      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Full Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError('');
            }}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            autoFocus
          />
        </div>
        
        {/* Email (Optional) */}
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Email (Optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-slate-500">For prescription reports & notifications</p>
        </div>
        
        {/* WhatsApp Consent */}
        <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-600 text-green-500 focus:ring-green-500 focus:ring-offset-slate-900"
            />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">WhatsApp Notifications</p>
              <p className="text-slate-400 text-xs mt-1">
                I consent to receive prescription analysis, health reminders, and follow-up notifications via WhatsApp. I can opt-out anytime.
              </p>
            </div>
          </label>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Submit Button */}
      <button
        onClick={completeProfile}
        disabled={loading || !fullName.trim()}
        className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <ArrowRight className="w-5 h-5" />
            Complete Setup
          </>
        )}
      </button>
      
      {/* Terms */}
      <p className="text-xs text-slate-500 text-center">
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
      </p>
    </div>
  );
  
  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
        <p className="text-slate-400">
          {verifyData?.patient_name ? `Hello, ${verifyData.patient_name}!` : 'You\'re all set!'}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Redirecting to dashboard...
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Medi<span className="text-blue-400">Bridge</span>
            <span className="text-green-400">24x7</span>
          </h1>
          <p className="text-slate-400 mt-1">Your Health Companion</p>
        </div>
        
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          {step === 'phone' && renderPhoneStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'profile' && renderProfileStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
        
        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          🔒 Your data is encrypted and secure
        </p>
      </div>
    </div>
  );
}
