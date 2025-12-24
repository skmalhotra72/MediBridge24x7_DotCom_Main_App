/**
 * MediBridge WhatsApp OTP Login Page
 * 
 * Path: src/app/auth/otp/page.tsx
 * 
 * This page provides WhatsApp-based OTP authentication.
 * Users can login with their phone number and receive OTP via WhatsApp.
 */

import OTPLogin from '@/components/auth/OTPLogin';

export const metadata = {
  title: 'Login with WhatsApp | MediBridge24x7',
  description: 'Login to MediBridge24x7 using WhatsApp OTP verification',
};

export default function OTPLoginPage() {
  return <OTPLogin />;
}
