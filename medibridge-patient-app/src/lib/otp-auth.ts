/**
 * OTP Authentication Utilities
 * Path: src/lib/otp-auth.ts
 */

// ============================================
// CONFIGURATION
// ============================================

export const OTP_CONFIG = {
    REQUEST_URL: 'https://n8n.nhcare.in/webhook/medibridge-otp-request',
    VERIFY_URL: 'https://n8n.nhcare.in/webhook/medibridge-otp-verify',
    OTP_LENGTH: 6,
    RESEND_COOLDOWN: 60,
    MAX_ATTEMPTS: 3,
    EXPIRY_MINUTES: 10,
    COUNTRY_CODE: '91',
    PHONE_LENGTH: 10,
  };
  
  // ============================================
  // TYPES
  // ============================================
  
  export interface OTPRequestResponse {
    success: boolean;
    message: string;
    phone_masked?: string;
    expires_in_minutes?: number;
    error?: string;
  }
  
  export interface OTPVerifyResponse {
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
  // PHONE UTILITIES
  // ============================================
  
  export function formatPhoneDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return digits;
  }
  
  export function cleanPhoneNumber(value: string): string {
    return value.replace(/\D/g, '').slice(0, OTP_CONFIG.PHONE_LENGTH);
  }
  
  export function isValidIndianPhone(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(phone);
  }
  
  export function toE164(phone: string): string {
    const clean = cleanPhoneNumber(phone);
    return `${OTP_CONFIG.COUNTRY_CODE}${clean}`;
  }
  
  export function maskPhone(phone: string): string {
    const e164 = toE164(phone);
    if (e164.length >= 12) {
      return `${e164.slice(0, 4)}•••••${e164.slice(-2)}`;
    }
    return phone;
  }
  
  // ============================================
  // API FUNCTIONS
  // ============================================
  
  export async function requestOTP(phone: string, purpose: string = 'login'): Promise<OTPRequestResponse> {
    try {
      const response = await fetch(OTP_CONFIG.REQUEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_e164: toE164(phone),
          purpose
        })
      });
      return await response.json();
    } catch (error) {
      console.error('OTP request error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: 'network_error'
      };
    }
  }
  
  export async function verifyOTP(
    phone: string, 
    otpCode: string, 
    purpose: string = 'login'
  ): Promise<OTPVerifyResponse> {
    try {
      const response = await fetch(OTP_CONFIG.VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_e164: toE164(phone),
          otp_code: otpCode,
          purpose
        })
      });
      return await response.json();
    } catch (error) {
      console.error('OTP verify error:', error);
      return {
        success: false,
        status: 'existing_patient',
        message: 'Network error. Please check your connection.',
        error: 'network_error'
      };
    }
  }
  
  // ============================================
  // SESSION HELPERS
  // ============================================
  
  const SESSION_KEY = 'medibridge_patient';
  
  export function saveSession(patient: {
    patient_id: string;
    patient_name: string;
    phone_e164: string;
    organization_id?: string;
  }): void {
    const session = {
      ...patient,
      authenticated_at: new Date().toISOString(),
      auth_method: 'otp'
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  
  export function getSession(): any | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  
  export function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  }
  
  export function isSessionValid(): boolean {
    const session = getSession();
    if (!session) return false;
    
    const authenticatedAt = new Date(session.authenticated_at).getTime();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    return (now - authenticatedAt) < maxAge;
  }