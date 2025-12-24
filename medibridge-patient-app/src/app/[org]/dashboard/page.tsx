'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, FileText, FlaskConical, MessageCircle, Mic, Upload, Camera, X, Check, Loader2, User, Sparkles, LogOut, Phone } from 'lucide-react';
import PatientSelector, { PatientInfoBadge } from '@/components/PatientSelector';
import PatientHealthSummary from '@/components/PatientHealthSummary';

// ============================================================
// TYPES
// ============================================================

interface Patient {
  id: string;
  auth_user_id: string;
  full_name: string;
  patient_name?: string;
  gender: string | null;
  date_of_birth: string | null;
  age: number | null;
  age_unit: string;
  relationship: string;
  blood_group: string | null;
  known_allergies: string[];
  chronic_conditions: string[];
  health_summary: string | null;
  last_summary_update: string | null;
  created_at: string;
}

interface Prescription {
  id: string;
  chief_complaint: string | null;
  status: string;
  created_at: string;
  document_type: string | null;
  patient_id: string | null;
}

interface Stats {
  total: number;
  completed: number;
  processing: number;
  accuracy: number;
}

interface OTPSession {
  patient_id: string;
  patient_name: string;
  phone_e164: string;
  organization_id: string;
  authenticated_at: string;
}

// ============================================================
// THEME SYSTEM - Dynamic colors based on clinic_profiles
// ============================================================

// Theme preset definitions
const THEME_PRESETS = {
  cyan: {
    name: 'cyan',
    primary: {
      gradient: 'from-cyan-500 to-blue-600',
      gradientHover: 'from-cyan-400 to-blue-500',
      bg: 'bg-cyan-500',
      bgLight: 'bg-cyan-500/20',
      bgLighter: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      borderHover: 'border-cyan-400/60',
      text: 'text-cyan-400',
      textLight: 'text-cyan-300',
      shadow: 'shadow-cyan-500/20',
      shadowButton: 'shadow-cyan-500/25',
      ring: 'focus:ring-cyan-500/50 focus:border-cyan-500',
    },
    badge: {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-400',
    }
  },
  purple: {
    name: 'purple',
    primary: {
      gradient: 'from-purple-500 to-violet-600',
      gradientHover: 'from-purple-400 to-violet-500',
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-500/20',
      bgLighter: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      borderHover: 'border-purple-400/60',
      text: 'text-purple-400',
      textLight: 'text-purple-300',
      shadow: 'shadow-purple-500/20',
      shadowButton: 'shadow-purple-500/25',
      ring: 'focus:ring-purple-500/50 focus:border-purple-500',
    },
    badge: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
    }
  },
  emerald: {
    name: 'emerald',
    primary: {
      gradient: 'from-emerald-500 to-teal-600',
      gradientHover: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-500/20',
      bgLighter: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      borderHover: 'border-emerald-400/60',
      text: 'text-emerald-400',
      textLight: 'text-emerald-300',
      shadow: 'shadow-emerald-500/20',
      shadowButton: 'shadow-emerald-500/25',
      ring: 'focus:ring-emerald-500/50 focus:border-emerald-500',
    },
    badge: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
    }
  },
  blue: {
    name: 'blue',
    primary: {
      gradient: 'from-blue-500 to-indigo-600',
      gradientHover: 'from-blue-400 to-indigo-500',
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-500/20',
      bgLighter: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      borderHover: 'border-blue-400/60',
      text: 'text-blue-400',
      textLight: 'text-blue-300',
      shadow: 'shadow-blue-500/20',
      shadowButton: 'shadow-blue-500/25',
      ring: 'focus:ring-blue-500/50 focus:border-blue-500',
    },
    badge: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
    }
  },
  rose: {
    name: 'rose',
    primary: {
      gradient: 'from-rose-500 to-pink-600',
      gradientHover: 'from-rose-400 to-pink-500',
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-500/20',
      bgLighter: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      borderHover: 'border-rose-400/60',
      text: 'text-rose-400',
      textLight: 'text-rose-300',
      shadow: 'shadow-rose-500/20',
      shadowButton: 'shadow-rose-500/25',
      ring: 'focus:ring-rose-500/50 focus:border-rose-500',
    },
    badge: {
      bg: 'bg-rose-500/20',
      text: 'text-rose-400',
    }
  }
};

type ThemePreset = typeof THEME_PRESETS.cyan;

// Function to detect theme from custom_colors
function getThemeFromColors(customColors: any): ThemePreset {
  if (!customColors) return THEME_PRESETS.cyan; // Default theme
  
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

// ============================================================
// SERVICE CARDS COMPONENT
// ============================================================

const ServiceCards = ({ 
  onPrescriptionClick, 
  onLabReportClick, 
  onChatClick,
  theme
}: {
  onPrescriptionClick: () => void;
  onLabReportClick: () => void;
  onChatClick: () => void;
  theme: ThemePreset;
}) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Badge - Uses theme color */}
      <div className={`inline-flex items-center gap-2 ${theme.badge.bg} ${theme.badge.text} px-3 py-1 rounded-full text-xs font-medium mb-4`}>
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        AI Ready • 9+ Languages
      </div>
      
      <h2 className="text-white text-xl font-bold mb-2">How can we help you today?</h2>
      <p className="text-slate-400 text-sm mb-6">Choose an option below to get started with your health query</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Doctor's Prescription - Uses theme color */}
        <button
          onClick={onPrescriptionClick}
          className={`group relative bg-gradient-to-br ${theme.primary.bgLighter} 
                     border ${theme.primary.border} hover:${theme.primary.borderHover}
                     rounded-xl p-5 text-left transition-all duration-300
                     hover:shadow-lg ${theme.primary.shadow} hover:scale-[1.02]`}
        >
          <div className={`w-12 h-12 bg-gradient-to-br ${theme.primary.gradient} rounded-xl 
                          flex items-center justify-center mb-4 
                          group-hover:scale-110 transition-transform duration-300`}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className={`${theme.primary.text} font-semibold text-base mb-2`}>Doctor's Prescription</h3>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            Upload your prescription for medicine analysis, dosage explanations, and precautions
          </p>
          <span className={`inline-flex items-center ${theme.primary.text} text-sm font-medium group-hover:gap-2 transition-all`}>
            Get Started 
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Lab Report - Orange (Fixed) */}
        <button
          onClick={onLabReportClick}
          className="group relative bg-gradient-to-br from-orange-500/10 to-amber-500/10 
                     border border-orange-500/30 hover:border-orange-400/60
                     rounded-xl p-5 text-left transition-all duration-300
                     hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02]"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl 
                          flex items-center justify-center mb-4
                          group-hover:scale-110 transition-transform duration-300">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-orange-400 font-semibold text-base mb-2">Lab Report</h3>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            Upload your lab test results for detailed analysis and health insights
          </p>
          <span className="inline-flex items-center text-orange-400 text-sm font-medium group-hover:gap-2 transition-all">
            Get Started 
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Chat Only - Emerald Green (Fixed) */}
        <button
          onClick={onChatClick}
          className="group relative bg-gradient-to-br from-emerald-500/10 to-green-500/10 
                     border border-emerald-500/30 hover:border-emerald-400/60
                     rounded-xl p-5 text-left transition-all duration-300
                     hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02]"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl 
                          flex items-center justify-center mb-4
                          group-hover:scale-110 transition-transform duration-300">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-emerald-400 font-semibold text-base mb-2">Chat Only</h3>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            Ask health questions directly without uploading any documents
          </p>
          <span className="inline-flex items-center text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
            Get Started 
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Voice Chat - Gray (Coming Soon - Fixed) */}
        <div className="group relative bg-gradient-to-br from-slate-500/5 to-slate-600/5 
                        border border-slate-500/20 rounded-xl p-5 text-left opacity-60">
          <div className="absolute top-3 right-3">
            <span className="bg-slate-500/20 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
              Coming Soon
            </span>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-slate-400/50 to-slate-500/50 rounded-xl 
                          flex items-center justify-center mb-4">
            <Mic className="w-6 h-6 text-white/70" />
          </div>
          <h3 className="text-slate-400/70 font-semibold text-base mb-2">Voice Chat</h3>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Speak your questions and get audio responses
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// UPLOAD MODAL COMPONENT
// ============================================================

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, question: string) => void;
  isUploading: boolean;
  type: 'prescription' | 'lab';
  selectedPatient: Patient | null;
  theme: ThemePreset;
}

const UploadModal = ({ isOpen, onClose, onSubmit, isUploading, type, selectedPatient, theme }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setQuestion('');
      setDragActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isPrescription = type === 'prescription';
  
  // Use theme colors for prescription, fixed orange for lab
  const gradientFrom = isPrescription ? theme.primary.gradient.split(' ')[0] : 'from-orange-400';
  const gradientTo = isPrescription ? theme.primary.gradient.split(' ')[1] : 'to-amber-500';
  const borderColor = isPrescription ? theme.primary.border : 'border-orange-500/30';
  const shadowColor = isPrescription ? theme.primary.shadow : 'shadow-orange-500/10';
  const headerGradient = isPrescription 
    ? `${theme.primary.bgLighter.replace('bg-', 'from-').replace('/10', '/20')} to-transparent` 
    : 'from-orange-500/20 to-amber-500/20';
  const headerBorder = isPrescription ? theme.primary.border.replace('/30', '/20') : 'border-orange-500/20';
  const textColor = isPrescription ? theme.primary.textLight : 'text-orange-300';
  const iconBg = isPrescription ? theme.primary.bgLight : 'bg-orange-500/20';
  const iconColor = isPrescription ? theme.primary.text : 'text-orange-400';
  const focusRing = isPrescription ? theme.primary.ring : 'focus:ring-orange-500/50 focus:border-orange-500';
  const buttonGradient = isPrescription 
    ? `${theme.primary.gradient} hover:${theme.primary.gradientHover} ${theme.primary.shadowButton}` 
    : 'from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 shadow-orange-500/25';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
                      rounded-2xl w-full max-w-md border ${borderColor} shadow-2xl ${shadowColor}`}>
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerGradient} px-6 py-4 rounded-t-2xl border-b ${headerBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${isPrescription ? theme.primary.gradient : 'from-orange-400 to-amber-500'} rounded-xl flex items-center justify-center`}>
                {isPrescription ? (
                  <FileText className="w-5 h-5 text-white" />
                ) : (
                  <FlaskConical className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {isPrescription ? "Upload Doctor's Prescription" : "Upload Lab Report"}
                </h3>
                <p className={`${textColor} text-xs`}>
                  {isPrescription ? "Get medicine analysis and dosage guidance" : "Get detailed lab result interpretation"}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Patient Badge */}
        {selectedPatient && (
          <div className="px-6 pt-4">
            <div className={`flex items-center gap-2 ${theme.primary.bgLighter} border ${theme.primary.border} rounded-lg px-3 py-2`}>
              <User className={`w-4 h-4 ${theme.primary.text}`} />
              <span className={`${theme.primary.textLight} text-sm`}>Patient:</span>
              <span className="text-white text-sm font-medium">{selectedPatient.full_name}</span>
              {selectedPatient.gender && (
                <span className={`${theme.primary.text} text-xs`}>({selectedPatient.gender})</span>
              )}
              {selectedPatient.age && (
                <span className={`${theme.primary.text} text-xs`}>{selectedPatient.age}Y</span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300
                        ${dragActive 
                          ? `${isPrescription ? theme.primary.border.replace('/30', '') : 'border-orange-400'} ${isPrescription ? theme.primary.bgLighter : 'bg-orange-500/10'}` 
                          : file 
                            ? 'border-green-400 bg-green-500/10' 
                            : `border-slate-600 hover:${isPrescription ? theme.primary.border.replace('/30', '/50') : 'border-orange-400/50'} bg-slate-800/50`
                        }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-slate-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-400 text-xs hover:underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`w-14 h-14 ${iconBg} rounded-full flex items-center justify-center mx-auto`}>
                  <Upload className={`w-7 h-7 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-white font-medium">Drag & drop your file here</p>
                  <p className="text-slate-400 text-xs mt-1">or click to browse</p>
                </div>
                
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 
                               text-white text-sm rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Browse Files
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 
                               text-white text-sm rounded-lg transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </button>
                </div>
                
                <p className="text-slate-500 text-xs">Supported: PDF, JPG, PNG (Max 10MB)</p>
              </div>
            )}
          </div>

          {/* Question Input */}
          <div>
            <label className="block text-gray-200 text-sm font-medium mb-2">
              What would you like to know? <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={isPrescription 
                ? "e.g., Explain my medicines and their side effects..." 
                : "e.g., Are my test results normal? What should I be concerned about?"}
              rows={3}
              className={`w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white 
                         placeholder-slate-400 text-sm resize-none
                         focus:outline-none focus:ring-2 ${focusRing}
                         transition-all duration-300`}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={() => file && onSubmit(file, question)}
            disabled={!file || isUploading}
            className={`w-full py-3.5 bg-gradient-to-r ${buttonGradient}
                       text-white font-semibold rounded-xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300 shadow-lg
                       flex items-center justify-center gap-2`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                {isPrescription ? 'Analyze Prescription' : 'Analyze Lab Report'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;
  const supabase = createClient();

  // State
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [pendingAction, setPendingAction] = useState<'prescription' | 'lab' | 'chat' | null>(null);
  
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabReportModal, setShowLabReportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, processing: 0, accuracy: 100 });
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Auth type tracking
  const [authType, setAuthType] = useState<'supabase' | 'otp' | null>(null);
  const [otpSession, setOtpSession] = useState<OTPSession | null>(null);
  
  // Theme state - loaded from database
  const [theme, setTheme] = useState<ThemePreset>(THEME_PRESETS.cyan);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Get organization with clinic_profiles for theme
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('slug', org)
          .single();
        
        if (orgData) {
          setOrgName(orgData.name);
          setOrgId(orgData.id);
          
          // Fetch clinic_profiles for custom colors/theme
          const { data: clinicProfile } = await supabase
            .from('clinic_profiles')
            .select('custom_colors')
            .eq('organization_id', orgData.id)
            .single();
          
          if (clinicProfile?.custom_colors) {
            const detectedTheme = getThemeFromColors(clinicProfile.custom_colors);
            setTheme(detectedTheme);
            console.log('Theme loaded:', detectedTheme.name, 'for org:', org);
          } else {
            // Default to cyan if no custom colors
            setTheme(THEME_PRESETS.cyan);
            console.log('No custom colors, using default cyan theme for:', org);
          }
        }

        // ============================================================
        // AUTH CHECK: Supabase Auth OR OTP Session
        // ============================================================
        
        // Check for Supabase Auth user
        const { data: { user } } = await supabase.auth.getUser();

        // Check for OTP session in localStorage
        let storedOtpSession: OTPSession | null = null;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('medibridge_patient');
          if (stored) {
            try {
              storedOtpSession = JSON.parse(stored);
              // Check if session is still valid (7 days)
              if (storedOtpSession) {
                const authTime = new Date(storedOtpSession.authenticated_at).getTime();
                const now = Date.now();
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                if (now - authTime > sevenDays) {
                  localStorage.removeItem('medibridge_patient');
                  storedOtpSession = null;
                }
              }
            } catch (e) {
              localStorage.removeItem('medibridge_patient');
              storedOtpSession = null;
            }
          }
        }

        // Redirect to auth if neither session exists
        if (!user && !storedOtpSession) {
          router.push(`/${org}/auth`);
          return;
        }

        // Set user info from either source
        if (user) {
          setAuthType('supabase');
          setUserId(user.id);
          setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'User');

          // Auto-load first patient for Supabase auth users
          const { data: firstPatient } = await supabase
            .from('patients')
            .select('*')
            .eq('auth_user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (firstPatient) {
            setSelectedPatient(firstPatient as Patient);
          }

          // Get prescriptions for Supabase user
          const { data: prescriptions } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (prescriptions) {
            setRecentPrescriptions(prescriptions);
            
            // Calculate stats
            const total = prescriptions.length;
            const completed = prescriptions.filter(p => p.status === 'analyzed' || p.status === 'completed').length;
            const processing = prescriptions.filter(p => p.status === 'processing' || p.status === 'pending').length;
            
            setStats({
              total,
              completed,
              processing,
              accuracy: 100
            });
          }
        } else if (storedOtpSession) {
          setAuthType('otp');
          setOtpSession(storedOtpSession);
          setUserId(storedOtpSession.patient_id);
          setUserName(storedOtpSession.patient_name || 'Patient');

          // Load patient data for OTP user
          const { data: patientData } = await supabase
            .from('patients')
            .select('*')
            .eq('id', storedOtpSession.patient_id)
            .single();

          if (patientData) {
            setSelectedPatient(patientData as Patient);
          }

          // Get prescriptions for OTP patient
          const { data: prescriptions } = await supabase
            .from('prescriptions')
            .select('*')
            .eq('patient_id', storedOtpSession.patient_id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (prescriptions) {
            setRecentPrescriptions(prescriptions);
            
            // Calculate stats
            const total = prescriptions.length;
            const completed = prescriptions.filter(p => p.status === 'analyzed' || p.status === 'completed').length;
            const processing = prescriptions.filter(p => p.status === 'processing' || p.status === 'pending').length;
            
            setStats({
              total,
              completed,
              processing,
              accuracy: 100
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [org, router, supabase]);

  // Handle logout - clears both Supabase and OTP sessions
  const handleLogout = async () => {
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Clear OTP session from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medibridge_patient');
    }
    
    router.push(`/${org}/auth`);
  };

  // Handle action that requires patient selection
  const handleActionWithPatient = (action: 'prescription' | 'lab' | 'chat') => {
    // For OTP users, patient is already selected (themselves)
    if (authType === 'otp' && selectedPatient) {
      if (action === 'prescription') {
        setShowPrescriptionModal(true);
      } else if (action === 'lab') {
        setShowLabReportModal(true);
      } else if (action === 'chat') {
        router.push(`/${org}/chat?patient_id=${selectedPatient.id}`);
      }
    } else {
      // For Supabase users, show patient selector
      setPendingAction(action);
      setShowPatientSelector(true);
    }
  };

  // After patient is selected
  const handlePatientSelected = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSelector(false);
    
    // Now proceed with the pending action
    if (pendingAction === 'prescription') {
      setShowPrescriptionModal(true);
    } else if (pendingAction === 'lab') {
      setShowLabReportModal(true);
    } else if (pendingAction === 'chat') {
      router.push(`/${org}/chat?patient_id=${patient.id}`);
    }
    
    setPendingAction(null);
  };

  // Handle file upload
  const handleUpload = async (file: File, question: string, documentType: 'prescription' | 'lab_report') => {
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setIsUploading(true);
    
    try {
      // For OTP users, we use the patient_id directly
      const uploadUserId = authType === 'supabase' ? userId : selectedPatient.id;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${uploadUserId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      // Create prescription record with patient_id
      const { data: prescription, error: insertError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: authType === 'supabase' ? userId : null,
          organization_id: orgId,
          patient_id: selectedPatient.id,
          file_url: publicUrl,
          file_type: file.type,
          chief_complaint: question || 'Please analyze this document',
          status: 'pending',
          document_type: documentType,
          patient_name: selectedPatient.full_name,
          patient_gender: selectedPatient.gender,
          patient_age: selectedPatient.age ? `${selectedPatient.age}` : null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send to n8n webhook
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
        'https://n8n.nhcare.in/webhook/medibridge-chat-v6-test';

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: prescription.id,
          file_url: publicUrl,
          file_type: file.type,
          user_id: uploadUserId,
          user_name: userName,
          user_email: authType === 'otp' && otpSession ? `${otpSession.phone_e164}@otp.medibridge.in` : '',
          organization_id: orgId,
          organization: org,
          clinic_name: orgName,
          patient_id: selectedPatient.id,
          patient_name: selectedPatient.full_name,
          patient_gender: selectedPatient.gender,
          patient_age: selectedPatient.age,
          chief_complaint: question || 'Please analyze this document',
          query: question || 'Please analyze this document',
          channel: 'web',
          document_type: documentType,
          chat_session_id: prescription.id,
          auth_type: authType
        })
      });

      // Close modal and redirect to chat
      setShowPrescriptionModal(false);
      setShowLabReportModal(false);
      
      router.push(`/${org}/chat?prescription_id=${prescription.id}&session=${prescription.id}&patient_id=${selectedPatient.id}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin ${theme.primary.text}`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${theme.primary.gradient} rounded-xl flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-white font-bold">MediBridge</h1>
              <p className="text-slate-400 text-xs">{orgName}</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            {/* Selected Patient Badge */}
            {selectedPatient && (
              <button
                onClick={() => authType === 'supabase' && setShowPatientSelector(true)}
                className={`hidden sm:flex items-center gap-2 ${theme.primary.bgLight} border ${theme.primary.border} 
                         rounded-full px-3 py-1.5 hover:${theme.primary.bgLighter} transition-colors
                         ${authType === 'otp' ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <User className={`w-4 h-4 ${theme.primary.text}`} />
                <span className={`${theme.primary.textLight} text-sm font-medium`}>{selectedPatient.full_name}</span>
                {authType === 'supabase' && (
                  <span className={`${theme.primary.text} opacity-70 text-xs`}>Change</span>
                )}
              </button>
            )}
            
            <button className={`${theme.primary.text} text-sm font-medium`}>Dashboard</button>
            <button 
              onClick={() => router.push(`/${org}/prescriptions`)}
              className="text-slate-400 hover:text-white text-sm"
            >
              Prescriptions
            </button>
            <button className="text-slate-400 hover:text-white text-sm">Profile</button>
            
            {/* User Info & Logout */}
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-700">
              <div className={`flex items-center gap-2 ${authType === 'otp' ? 'bg-green-500/20' : 'bg-emerald-500/20'} px-3 py-1.5 rounded-full`}>
                <div className={`w-6 h-6 ${authType === 'otp' ? 'bg-green-500' : 'bg-emerald-500'} rounded-full flex items-center justify-center`}>
                  {authType === 'otp' ? (
                    <Phone className="w-3 h-3 text-white" />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className={`${authType === 'otp' ? 'text-green-300' : 'text-emerald-300'} text-sm font-medium hidden sm:inline`}>
                  {userName}
                </span>
                {authType === 'otp' && (
                  <span className="text-green-400/60 text-xs hidden md:inline">WhatsApp</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Healthcare That
          </h1>
          <h2 className={`text-4xl font-bold ${theme.primary.text} mb-4`}>
            Never Sleeps
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Your 24/7 AI-powered healthcare companion. Get instant prescription analysis,
            medicine information, and personalized health guidance in your preferred language.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className={`${theme.primary.text} text-xs font-medium mb-1`}>Total Uploads</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-500 text-xs">Documents analyzed</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-green-400 text-xs font-medium mb-1">Completed</p>
            <p className="text-3xl font-bold text-white">{stats.completed}</p>
            <p className="text-slate-500 text-xs">Ready to view</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-yellow-400 text-xs font-medium mb-1">Processing</p>
            <p className="text-3xl font-bold text-white">{stats.processing}</p>
            <p className="text-slate-500 text-xs">In queue</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className={`${theme.primary.text} text-xs font-medium mb-1`}>Success Rate</p>
            <p className="text-3xl font-bold text-white">{stats.accuracy}%</p>
            <p className="text-slate-500 text-xs">Accuracy score</p>
          </div>
        </div>

        {/* Service Cards - Uses theme */}
        <ServiceCards
          onPrescriptionClick={() => handleActionWithPatient('prescription')}
          onLabReportClick={() => handleActionWithPatient('lab')}
          onChatClick={() => handleActionWithPatient('chat')}
          theme={theme}
        />

        {/* Patient Health Summary */}
        {selectedPatient && orgId && (
          <PatientHealthSummary
            patientId={selectedPatient.id}
            organizationId={orgId}
            organizationSlug={org}
          />
        )}

        {/* Recent Activity */}
        <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-white text-xl font-bold mb-4">Recent Activity</h2>
          
          {recentPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {recentPrescriptions.map((prescription) => (
                <button
                  key={prescription.id}
                  onClick={() => router.push(`/${org}/chat?prescription_id=${prescription.id}&session=${prescription.id}${prescription.patient_id ? `&patient_id=${prescription.patient_id}` : ''}`)}
                  className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700 
                             rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      prescription.document_type === 'lab_report' 
                        ? 'bg-orange-500/20' 
                        : theme.primary.bgLight
                    }`}>
                      {prescription.document_type === 'lab_report' ? (
                        <FlaskConical className="w-5 h-5 text-orange-400" />
                      ) : (
                        <FileText className={`w-5 h-5 ${theme.primary.text}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {prescription.chief_complaint || 'Document Analysis'}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {formatDate(prescription.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    prescription.status === 'analyzed' || prescription.status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {prescription.status === 'analyzed' || prescription.status === 'completed' 
                      ? '✓ Analyzed' 
                      : 'Processing'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No recent activity. Upload a prescription to get started!</p>
            </div>
          )}
        </div>
      </main>

      {/* Patient Selector Modal - Only for Supabase auth users */}
      {authType === 'supabase' && (
        <PatientSelector
          isOpen={showPatientSelector}
          onClose={() => {
            setShowPatientSelector(false);
            setPendingAction(null);
          }}
          onPatientSelected={handlePatientSelected}
          userId={userId}
          organizationId={orgId}
        />
      )}

      {/* Upload Modals - Pass theme */}
      <UploadModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onSubmit={(file, question) => handleUpload(file, question, 'prescription')}
        isUploading={isUploading}
        type="prescription"
        selectedPatient={selectedPatient}
        theme={theme}
      />

      <UploadModal
        isOpen={showLabReportModal}
        onClose={() => setShowLabReportModal(false)}
        onSubmit={(file, question) => handleUpload(file, question, 'lab_report')}
        isUploading={isUploading}
        type="lab"
        selectedPatient={selectedPatient}
        theme={theme}
      />
    </div>
  );
}