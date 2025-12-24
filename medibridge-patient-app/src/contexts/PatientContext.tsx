'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Patient Context Provider
 * 
 * Path: src/contexts/PatientContext.tsx
 * 
 * Manages the authenticated patient state across the application.
 * Works with both WhatsApp OTP and Email/Password authentication.
 */

// ============================================
// TYPES
// ============================================

interface Patient {
  patient_id: string;
  patient_name: string;
  phone_e164?: string;
  email?: string;
  organization_id?: string;
  authenticated_at: string;
  auth_method: 'otp' | 'email';
}

interface PatientContextType {
  patient: Patient | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (patient: Patient) => void;
  logout: () => void;
  updatePatient: (updates: Partial<Patient>) => void;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'medibridge_patient';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ============================================
// CONTEXT
// ============================================

const PatientContext = createContext<PatientContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load patient from localStorage on mount
  useEffect(() => {
    const loadPatient = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Check if session is expired
          const authenticatedAt = new Date(parsed.authenticated_at).getTime();
          const now = Date.now();
          
          if (now - authenticatedAt > SESSION_DURATION) {
            // Session expired
            localStorage.removeItem(STORAGE_KEY);
            setPatient(null);
          } else {
            setPatient(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading patient session:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, []);

  // Login function
  const login = (patientData: Patient) => {
    const sessionData = {
      ...patientData,
      authenticated_at: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    setPatient(sessionData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPatient(null);
    router.push('/auth/login');
  };

  // Update patient data
  const updatePatient = (updates: Partial<Patient>) => {
    if (patient) {
      const updated = { ...patient, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPatient(updated);
    }
  };

  const value: PatientContextType = {
    patient,
    loading,
    isAuthenticated: !!patient,
    login,
    logout,
    updatePatient
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function usePatient() {
  const context = useContext(PatientContext);
  
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  
  return context;
}

// ============================================
// PROTECTED ROUTE WRAPPER
// ============================================

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = usePatient();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
