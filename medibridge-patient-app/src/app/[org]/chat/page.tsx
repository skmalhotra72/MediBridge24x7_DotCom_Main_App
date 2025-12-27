'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, Send, Loader2, User, Stethoscope, Calendar, 
  CheckCircle, Building2, Phone, FileText, ChevronDown, 
  ChevronUp, Pill, AlertTriangle, FlaskConical, Clock,
  Bot, Sparkles, Moon, Sun, UserPlus, RefreshCw, RotateCcw,
  Paperclip, Camera, Mic, MicOff, X, Upload, Image, Square,
  AlertCircle
} from 'lucide-react';

// Voice Note Components
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';
import VoiceNotePlayer from '@/components/VoiceNotePlayer';
import AudioResponsePlayer from '@/components/AudioResponsePlayer';
// ============================================
// INTERFACES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'welcome' | 'question' | 'answer' | 'general' | 'progress' | 'upload' | 'error' | 'voice';
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  // Voice note fields
  audioUrl?: string;
  audioDuration?: number;
  transcription?: string;
  audioResponseUrl?: string;
}

interface PrescriptionData {
  id: string;
  file_url: string | null;
  status: string;
  created_at: string;
  chief_complaint: string | null;
  patient_name: string | null;
  patient_age: string | null;
  patient_gender: string | null;
  doctor_name: string | null;
  doctor_qualifications: string | null;
  doctor_registration: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_contact: string | null;
  prescription_date_extracted: string | null;
  diagnosis: string | null;
  user_question: string | null;
  ai_answer: string | null;
  ai_analysis: string | null;
  ai_summary: string | null;
  precautions: string[] | null;
  follow_up_instructions: {
    when_to_return?: string;
    warning_signs?: string;
    lifestyle_advice?: string;
  } | null;
  total_medicines: number | null;
  total_tests: number | null;
  document_type: string | null;
  suggested_questions: string[] | string | null;
  processing_status?: string;
  processing_progress?: string;
  response_data?: any;
}

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  timing: string | null;
  duration: string | null;
  instructions: string | null;
  item_type: string;
  purpose: string | null;
  medicine_form: string | null;
}

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  storagePath?: string;
  error?: string;
}

interface PatientData {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  organization_id: string;
  auth_user_id: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const safeParseArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (value.includes(',')) {
        return value.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [value];
    }
  }
  return [];
};

const extractAiAnswer = (data: any): string | null => {
  if (!data) return null;
  
  if (data.ai_answer && typeof data.ai_answer === 'string') {
    return data.ai_answer;
  }
  
  if (data.response_data) {
    let responseData = data.response_data;
    
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        console.error('Error parsing response_data string:', e);
        if (responseData.length > 50) {
          return responseData;
        }
        return null;
      }
    }
    
    if (responseData.ai_answer) {
      return responseData.ai_answer;
    }
    
    if (responseData.output) {
      return responseData.output;
    }
    
    if (responseData.text) {
      return responseData.text;
    }
  }
  
  return null;
};

// ============================================
// THEME COLORS
// ============================================

const getThemeColors = (isDark: boolean) => ({
  bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
  bgSecondary: isDark ? 'bg-slate-900' : 'bg-white',
  bgTertiary: isDark ? 'bg-slate-900/50' : 'bg-gray-100',
  bgCard: isDark ? 'bg-slate-800/50' : 'bg-white',
  bgCardHover: isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50',
  bgInput: isDark ? 'bg-slate-800' : 'bg-white',
  bgMessage: isDark ? 'bg-slate-800/80' : 'bg-white',
  bgHighlight: isDark ? 'bg-slate-700/30' : 'bg-gray-100',
  text: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-slate-400' : 'text-gray-600',
  textMuted: isDark ? 'text-slate-500' : 'text-gray-500',
  textLabel: isDark ? 'text-slate-500' : 'text-gray-500',
  border: isDark ? 'border-slate-800' : 'border-gray-200',
  borderLight: isDark ? 'border-slate-700/50' : 'border-gray-200',
  borderInput: isDark ? 'border-slate-700' : 'border-gray-300',
  cyan: 'text-cyan-400',
  cyanBg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50',
  cyanBorder: isDark ? 'border-cyan-500/30' : 'border-cyan-200',
  green: 'text-green-400',
  orange: 'text-orange-400',
  pink: 'text-pink-400',
  teal: 'text-teal-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  badgeGreen: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
  badgeYellow: isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
  badgeOrange: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700',
  badgeTeal: isDark ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700',
  badgePink: isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-700',
  badgeRed: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
  placeholder: isDark ? 'placeholder-slate-500' : 'placeholder-gray-400',
});

// ============================================
// ERROR SCREEN COMPONENT (No Patient / Org Not Found)
// ============================================

interface ErrorScreenProps {
  orgSlug: string;
  isDark: boolean;
  onGoToDashboard: () => void;
  errorType: 'no_patient' | 'org_not_found';
}

const ErrorScreen = ({ orgSlug, isDark, onGoToDashboard, errorType }: ErrorScreenProps) => {
  const colors = getThemeColors(isDark);
  
  const isOrgError = errorType === 'org_not_found';
  
  return (
    <div className={`fixed inset-0 ${colors.bg} flex items-center justify-center z-[9999] p-4`}>
      <div className={`${colors.bgCard} rounded-2xl border ${colors.borderLight} p-8 max-w-md w-full text-center shadow-xl`}>
        <div className={`w-16 h-16 ${isOrgError ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-orange-500 to-red-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        
        <h2 className={`${colors.text} text-xl font-bold mb-2`}>
          {isOrgError ? 'Organization Not Found' : 'No Patient Selected'}
        </h2>
        
        <p className={`${colors.textSecondary} text-sm mb-6`}>
          {isOrgError 
            ? `Could not find organization "${orgSlug}". Please check the URL or contact support.`
            : 'To upload a prescription or start a chat, please go to the dashboard and select a patient first.'
          }
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onGoToDashboard}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
          
          <p className={`${colors.textMuted} text-xs`}>
            {isOrgError 
              ? 'If you believe this is an error, please contact the clinic.'
              : 'You can select an existing patient or add a new family member from the dashboard.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROCESSING STATUS COMPONENT
// ============================================

interface ProcessingStatusProps {
  status: string;
  progress: string;
  isDark: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  showRefreshHint: boolean;
  elapsedTime: number;
}

const ProcessingStatus = ({ 
  status, 
  progress, 
  isDark, 
  onRefresh, 
  isRefreshing,
  showRefreshHint,
  elapsedTime 
}: ProcessingStatusProps) => {
  const colors = getThemeColors(isDark);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />;
      default:
        return <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return isDark 
          ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' 
          : 'from-green-50 to-emerald-50 border-green-200';
      case 'error':
        return isDark 
          ? 'from-red-500/20 to-rose-500/20 border-red-500/30'
          : 'from-red-50 to-rose-50 border-red-200';
      case 'processing':
        return isDark 
          ? 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30'
          : 'from-cyan-50 to-blue-50 border-cyan-200';
      default:
        return isDark 
          ? 'from-slate-500/20 to-slate-600/20 border-slate-500/30'
          : 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getProgressSteps = () => {
    const steps = [
      { key: 'receiving', label: 'Receiving document', match: ['receiving', 'pending'] },
      { key: 'reading', label: 'Reading document', match: ['reading'] },
      { key: 'analyzing', label: 'Analyzing content', match: ['analyzing prescription', 'analyzing'] },
      { key: 'extracting', label: 'Extracting details', match: ['extracting'] },
      { key: 'generating', label: 'Generating analysis', match: ['generating'] },
      { key: 'complete', label: 'Analysis complete', match: ['complete', 'completed'] }
    ];

    const progressLower = progress?.toLowerCase() || '';
    let currentStepIndex = 0;

    steps.forEach((step, index) => {
      if (step.match.some(m => progressLower.includes(m))) {
        currentStepIndex = index;
      }
    });

    return { steps, currentStepIndex };
  };

  if (status === 'completed') {
    return null;
  }

  const { steps, currentStepIndex } = getProgressSteps();
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className={`bg-gradient-to-r ${getStatusColor()} rounded-xl border p-4 mb-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className={`${colors.text} font-medium text-sm`}>
              {status === 'error' ? 'Processing Error' : 'Analyzing Your Prescription'}
            </p>
            <p className={`${colors.textSecondary} text-xs`}>
              {progress || 'Starting...'} 
              {status === 'processing' && elapsedTime > 0 && (
                <span className="ml-2 text-cyan-400">({formatTime(elapsedTime)})</span>
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showRefreshHint
              ? 'bg-cyan-500 text-white animate-pulse hover:bg-cyan-600'
              : isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } disabled:opacity-50`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {status === 'processing' && (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index < currentStepIndex 
                  ? 'bg-green-400' 
                  : index === currentStepIndex 
                    ? 'bg-cyan-400 animate-pulse' 
                    : isDark ? 'bg-slate-600' : 'bg-gray-300'
              }`} />
              <span className={`text-xs transition-all duration-300 ${
                index < currentStepIndex 
                  ? 'text-green-400' 
                  : index === currentStepIndex 
                    ? 'text-cyan-400 font-medium' 
                    : colors.textMuted
              }`}>
                {step.label}
              </span>
              {index === currentStepIndex && (
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin ml-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {showRefreshHint && status === 'processing' && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-600/50' : 'border-gray-300'}`}>
          <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            ⏱️ Taking longer than expected? Click "Refresh Status" to check for updates.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-2">
          <p className={`${isDark ? 'text-red-300' : 'text-red-600'} text-xs`}>
            There was an issue processing your prescription. Please try uploading again or click Refresh to retry.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// COLLAPSIBLE CARD COMPONENT
// ============================================

interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  badge?: string | number;
  badgeColor?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
  isDark: boolean;
}

const CollapsibleCard = ({ 
  title, 
  icon, 
  iconColor, 
  badge, 
  badgeColor = '',
  defaultExpanded = false,
  children,
  preview,
  isDark
}: CollapsibleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = getThemeColors(isDark);

  return (
    <div className={`${colors.bgCard} rounded-xl border ${colors.borderLight} overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${colors.bgCardHover} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          <span className={`${colors.text} font-medium text-sm`}>{title}</span>
          {badge !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${colors.textSecondary}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${colors.textSecondary}`} />
        )}
      </button>
      
      {!isExpanded && preview && (
        <div className="px-4 pb-3 -mt-1">
          {preview}
        </div>
      )}
      
      {isExpanded && (
        <div className={`px-4 pb-4 border-t ${colors.borderLight} pt-3`}>
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// STATIC CARD COMPONENT
// ============================================

interface StaticCardProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  badge?: string | number;
  badgeColor?: string;
  children: React.ReactNode;
  isDark: boolean;
}

const StaticCard = ({ 
  title, 
  icon, 
  iconColor, 
  badge,
  badgeColor = '',
  children,
  isDark
}: StaticCardProps) => {
  const colors = getThemeColors(isDark);

  return (
    <div className={`${colors.bgCard} rounded-xl border ${colors.borderLight} overflow-hidden`}>
      <div className="px-4 py-3 flex items-center gap-2">
        <span className={iconColor}>{icon}</span>
        <span className={`${colors.text} font-medium text-sm`}>{title}</span>
        {badge !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
};

// ============================================
// MARKDOWN RENDERER
// ============================================

const RenderMarkdown = ({ text, className = '', isDark }: { text: string; className?: string; isDark: boolean }) => {
  const colors = getThemeColors(isDark);
  
  if (!text) return null;

  const processInline = (content: string): React.ReactNode => {
    if (!content) return null;
    
    const parts: React.ReactNode[] = [];
    let remaining = content;
    let keyIndex = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`(.+?)`/);

      let earliestMatch: RegExpMatchArray | null = null;
      let earliestIndex = remaining.length;
      let matchType = '';

      if (boldMatch && boldMatch.index !== undefined && boldMatch.index < earliestIndex) {
        earliestMatch = boldMatch;
        earliestIndex = boldMatch.index;
        matchType = 'bold';
      }
      if (codeMatch && codeMatch.index !== undefined && codeMatch.index < earliestIndex) {
        earliestMatch = codeMatch;
        earliestIndex = codeMatch.index;
        matchType = 'code';
      }

      if (earliestMatch && earliestIndex < remaining.length) {
        if (earliestIndex > 0) {
          parts.push(<span key={keyIndex++}>{remaining.substring(0, earliestIndex)}</span>);
        }

        const matchContent = earliestMatch[1];
        if (matchType === 'bold') {
          parts.push(<strong key={keyIndex++} className={`font-semibold ${colors.text}`}>{matchContent}</strong>);
        } else if (matchType === 'code') {
          parts.push(
            <code key={keyIndex++} className={`px-1.5 py-0.5 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} rounded text-cyan-500 text-xs font-mono`}>
              {matchContent}
            </code>
          );
        }

        remaining = remaining.substring(earliestIndex + earliestMatch[0].length);
      } else {
        parts.push(<span key={keyIndex++}>{remaining}</span>);
        break;
      }
    }

    return parts.length > 0 ? parts : content;
  };

  const lines = text.split('\n');
  const textColor = isDark ? 'text-slate-200' : 'text-gray-700';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {lines.map((line, lineIndex) => {
        if (line.startsWith('### ')) {
          return (
            <h4 key={lineIndex} className={`text-sm font-bold ${colors.text} mt-3 mb-1`}>
              {processInline(line.replace('### ', ''))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={lineIndex} className={`text-base font-bold ${colors.text} mt-3 mb-1`}>
              {processInline(line.replace('## ', ''))}
            </h3>
          );
        }

        if (line.trim() === '---' || line.trim() === '***') {
          return <hr key={lineIndex} className={`${isDark ? 'border-slate-600/50' : 'border-gray-300'} my-3`} />;
        }

        if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ')) {
          const content = line.trim().replace(/^[-•*]\s/, '');
          return (
            <div key={lineIndex} className="flex items-start gap-2 ml-1">
              <span className="text-cyan-400 mt-0.5 text-xs">●</span>
              <span className={`${textColor} text-sm`}>{processInline(content)}</span>
            </div>
          );
        }

        const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return (
            <div key={lineIndex} className="flex items-start gap-2 ml-1">
              <span className="text-cyan-400 font-medium text-sm min-w-[18px]">{numberedMatch[1]}.</span>
              <span className={`${textColor} text-sm`}>{processInline(numberedMatch[2])}</span>
            </div>
          );
        }

        if (line.trim() === '') {
          return <div key={lineIndex} className="h-1.5" />;
        }

        return (
          <p key={lineIndex} className={`${textColor} text-sm leading-relaxed`}>
            {processInline(line)}
          </p>
        );
      })}
    </div>
  );
};

// ============================================
// FILE UPLOAD MODAL COMPONENT
// ============================================

interface FileUploadModalProps {
  onClose: () => void;
  onFileSelect: (file: File, type: 'prescription' | 'lab_report', question: string) => void;
  isDark: boolean;
  patientName?: string;
}

const FileUploadModal = ({ onClose, onFileSelect, isDark, patientName }: FileUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'prescription' | 'lab_report'>('prescription');
  const [question, setQuestion] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colors = getThemeColors(isDark);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;
    
    if (!validTypes.includes(file.type)) {
      alert('Please select a PDF or image file (PNG, JPG, JPEG, WEBP)');
      return false;
    }
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (selectedFile) {
      const defaultQuestion = documentType === 'prescription' 
        ? 'Please analyze this prescription and explain the medicines'
        : 'Please analyze this lab report and explain the results';
      onFileSelect(selectedFile, documentType, question.trim() || defaultQuestion);
      onClose();
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (selectedFile.type.includes('image')) return <Image className="w-8 h-8 text-blue-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className={`${colors.bgSecondary} rounded-2xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${colors.text}`}>Upload Document</h3>
          <button onClick={onClose} className={`p-1 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} rounded-full`}>
            <X className={`w-5 h-5 ${colors.textSecondary}`} />
          </button>
        </div>

        {/* Patient Info Badge */}
        {patientName && (
          <div className={`mb-4 p-3 ${colors.cyanBg} rounded-lg border ${colors.cyanBorder}`}>
            <p className={`text-xs ${colors.textSecondary}`}>Uploading for:</p>
            <p className={`text-sm font-medium ${colors.cyan}`}>{patientName}</p>
          </div>
        )}

        {/* Document Type Selection */}
        <div className="mb-4">
          <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
            What are you uploading?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDocumentType('prescription')}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                documentType === 'prescription'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                  : `${colors.border} ${isDark ? 'hover:border-slate-600' : 'hover:border-gray-300'} ${colors.text}`
              }`}
            >
              💊 Prescription
            </button>
            <button
              onClick={() => setDocumentType('lab_report')}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                documentType === 'lab_report'
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                  : `${colors.border} ${isDark ? 'hover:border-slate-600' : 'hover:border-gray-300'} ${colors.text}`
              }`}
            >
              🔬 Lab Report
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${
            dragActive
              ? 'border-cyan-500 bg-cyan-500/10'
              : selectedFile
                ? 'border-green-500 bg-green-500/10'
                : `${colors.border} ${isDark ? 'hover:border-slate-600' : 'hover:border-gray-400'}`
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              {getFileIcon()}
              <p className={`text-sm font-medium ${colors.text}`}>{selectedFile.name}</p>
              <p className={`text-xs ${colors.textSecondary}`}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <Upload className={`w-10 h-10 ${colors.textMuted} mx-auto mb-2`} />
              <p className={`text-sm ${colors.textSecondary}`}>
                {dragActive ? 'Drop the file here' : 'Drag & drop or click to select'}
              </p>
              <p className={`text-xs ${colors.textMuted} mt-1`}>
                PDF, PNG, JPG up to 10MB
              </p>
            </>
          )}
        </div>

        {/* Question Field */}
        <div className="mb-4">
          <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
            What would you like to know? (Optional)
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={documentType === 'prescription' 
              ? "e.g., Explain these medicines and their side effects"
              : "e.g., Are these test results normal?"}
            className={`w-full px-3 py-2 ${colors.bgInput} border ${colors.borderInput} rounded-xl ${colors.text} ${colors.placeholder} focus:outline-none focus:border-cyan-500 resize-none text-sm`}
            rows={2}
          />
          <p className={`text-xs ${colors.textMuted} mt-1`}>
            Leave blank for standard analysis
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedFile}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Upload & Analyze
        </button>
      </div>
    </div>
  );
};

// ============================================
// CAMERA CAPTURE COMPONENT
// ============================================

interface CameraCaptureProps {
  onClose: () => void;
  onCapture: (imageBlob: Blob) => void;
  isDark: boolean;
}

const CameraCapture = ({ onClose, onCapture, isDark }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      setError('Unable to access camera. Please grant permission.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = async () => {
    if (capturedImage) {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      onCapture(blob);
      onClose();
    }
  };

  const toggleCamera = () => {
    setCapturedImage(null);
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[10000]">
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 text-white hover:bg-white/20 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium">Take Photo of Prescription</span>
        <button onClick={toggleCamera} className="p-2 text-white hover:bg-white/20 rounded-full">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-4">
            <p className="mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-white text-black rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="Captured" className="max-h-full max-w-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-6 bg-gradient-to-t from-black/50 to-transparent">
        {capturedImage ? (
          <>
            <button
              onClick={retake}
              className="px-6 py-3 bg-white/20 text-white rounded-full font-medium"
            >
              Retake
            </button>
            <button
              onClick={confirmCapture}
              className="px-6 py-3 bg-cyan-500 text-white rounded-full font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Use Photo
            </button>
          </>
        ) : (
          <button
            onClick={capturePhoto}
            disabled={!!error}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Camera className="w-8 h-8 text-gray-900" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// CHAT INPUT ACTIONS COMPONENT
// ============================================

interface ChatInputActionsProps {
  onUploadClick: () => void;
  onCameraClick: () => void;
  disabled?: boolean;
  isDark: boolean;
}

const ChatInputActions = ({
  onUploadClick,
  onCameraClick,
  disabled = false,
  isDark
}: ChatInputActionsProps) => {
  const colors = getThemeColors(isDark);

  return (
    <div className={`flex items-center gap-1 px-2 py-1.5 border-t ${colors.borderLight}`}>
      <button
        onClick={onUploadClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${colors.textSecondary} hover:text-cyan-500 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
        title="Upload Prescription or Lab Report"
      >
        <Paperclip className="w-4 h-4" />
        <span className="hidden sm:inline">Upload</span>
      </button>

      <button
        onClick={onCameraClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs ${colors.textSecondary} hover:text-cyan-500 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
        title="Take Photo of Prescription"
      >
        <Camera className="w-4 h-4" />
        <span className="hidden sm:inline">Camera</span>
      </button>
    </div>
  );
};

// ============================================
// PRESCRIPTION DETAILS COMPONENT
// ============================================

interface PrescriptionDetailsProps {
  prescription: PrescriptionData | null;
  medicines: PrescriptionItem[];
  tests: PrescriptionItem[];
  precautions: string[];
  followUp: any;
  formatDate: (date: string | null) => string;
  getAiSummary: () => string;
  isDark: boolean;
}

const PrescriptionDetails = ({
  prescription,
  medicines,
  tests,
  precautions,
  followUp,
  formatDate,
  getAiSummary,
  isDark
}: PrescriptionDetailsProps) => {
  const colors = getThemeColors(isDark);

  return (
    <div className="space-y-3">
      <CollapsibleCard
        title="Prescription Analysis"
        icon={<CheckCircle className="w-4 h-4" />}
        iconColor="text-green-400"
        defaultExpanded={false}
        isDark={isDark}
        preview={
          <p className={`${colors.textSecondary} text-xs`}>
            {prescription?.patient_name || 'Patient'} • {prescription?.patient_age || '-'} • {prescription?.status === 'analyzed' ? '✓ Analyzed' : 'Processing'}
          </p>
        }
      >
        <div className="space-y-3">
          <div className={`${colors.bgHighlight} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 text-xs font-medium">Patient Information</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className={colors.textLabel}>Name</p>
                <p className={colors.text}>{prescription?.patient_name || 'Not specified'}</p>
              </div>
              <div>
                <p className={colors.textLabel}>Age / Gender</p>
                <p className={colors.text}>
                  {prescription?.patient_age || '-'}
                  {prescription?.patient_gender && ` / ${prescription.patient_gender}`}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`${colors.bgHighlight} rounded-lg p-2`}>
              <p className={`${colors.textLabel} text-xs flex items-center gap-1`}>
                <Calendar className="w-3 h-3" /> Date
              </p>
              <p className={`${colors.text} text-xs mt-1`}>
                {formatDate(prescription?.prescription_date_extracted || prescription?.created_at || null)}
              </p>
            </div>
            <div className={`${colors.bgHighlight} rounded-lg p-2`}>
              <p className={`${colors.textLabel} text-xs`}>Status</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                prescription?.status === 'analyzed' || prescription?.status === 'completed'
                  ? colors.badgeGreen
                  : colors.badgeYellow
              }`}>
                {prescription?.status === 'analyzed' || prescription?.status === 'completed' ? '✓ Analyzed' : 'Processing'}
              </span>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      <StaticCard
        title="AI Analysis Complete"
        icon={<Sparkles className="w-4 h-4" />}
        iconColor="text-cyan-400"
        isDark={isDark}
      >
        <div className="space-y-3">
          {(prescription?.user_question || prescription?.chief_complaint) && (
            <div>
              <p className="text-cyan-400 text-xs font-medium mb-1">Question Asked:</p>
              <p className={`${colors.textSecondary} text-xs ${colors.bgHighlight} rounded-lg p-2`}>
                {prescription?.user_question || prescription?.chief_complaint}
              </p>
            </div>
          )}
          <div>
            <p className="text-cyan-400 text-xs font-medium mb-1">AI Summary:</p>
            <p className={`${colors.textSecondary} text-xs leading-relaxed`}>
              {getAiSummary()}
            </p>
          </div>
        </div>
      </StaticCard>

      <StaticCard
        title="Precautions"
        icon={<AlertTriangle className="w-4 h-4" />}
        iconColor="text-orange-400"
        badge={precautions.length > 0 ? precautions.length : undefined}
        badgeColor={colors.badgeOrange}
        isDark={isDark}
      >
        {precautions.length > 0 ? (
          <ul className="space-y-2">
            {precautions.map((precaution, index) => (
              <li key={index} className={`${colors.textSecondary} text-xs flex items-start gap-2`}>
                <span className="text-orange-400 mt-0.5">•</span>
                <span>{precaution}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={`${colors.textMuted} text-sm`}>No specific precautions noted</p>
        )}
      </StaticCard>

      <CollapsibleCard
        title="Diagnostic Tests"
        icon={<FlaskConical className="w-4 h-4" />}
        iconColor="text-teal-400"
        badge={tests.length > 0 ? tests.length : undefined}
        badgeColor={colors.badgeTeal}
        isDark={isDark}
        preview={
          <p className={`${colors.textMuted} text-xs`}>
            {tests.length > 0 ? `${tests.length} test(s) prescribed` : 'No diagnostic tests prescribed'}
          </p>
        }
      >
        {tests.length > 0 ? (
          <div className="space-y-2">
            {tests.map((test, index) => (
              <div key={test.id} className="text-sm">
                <p className={`${colors.text} font-medium`}>{index + 1}. {test.medicine_name}</p>
                {test.instructions && (
                  <p className={`${colors.textSecondary} text-xs ml-4`}>• {test.instructions}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={`${colors.textMuted} text-sm`}>No diagnostic tests prescribed</p>
        )}
      </CollapsibleCard>

      <CollapsibleCard
        title="Prescribed Medicines"
        icon={<Pill className="w-4 h-4" />}
        iconColor="text-pink-400"
        badge={medicines.length > 0 ? `${medicines.length} medicine${medicines.length > 1 ? 's' : ''}` : undefined}
        badgeColor={colors.badgePink}
        isDark={isDark}
        preview={
          medicines.length > 0 ? (
            <p className={`${colors.textSecondary} text-xs`}>
              {medicines.slice(0, 2).map(m => m.medicine_name).join(', ')}
              {medicines.length > 2 && ` +${medicines.length - 2} more`}
            </p>
          ) : (
            <p className={`${colors.textMuted} text-xs`}>No medicines prescribed</p>
          )
        }
      >
        {medicines.length > 0 ? (
          <div className="space-y-2">
            {medicines.map((med, index) => (
              <div key={med.id} className={`${colors.bgHighlight} rounded-lg p-3`}>
                <p className={`${colors.text} font-medium text-sm mb-1`}>
                  {index + 1}. {med.medicine_name}
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {med.purpose && (
                    <p className={colors.textSecondary}><span className={colors.textLabel}>Purpose:</span> {med.purpose}</p>
                  )}
                  {med.dosage && (
                    <p className={colors.textSecondary}><span className={colors.textLabel}>Dosage:</span> {med.dosage}</p>
                  )}
                  {med.frequency && (
                    <p className={colors.textSecondary}><span className={colors.textLabel}>Frequency:</span> {med.frequency}</p>
                  )}
                  {med.duration && (
                    <p className={colors.textSecondary}><span className={colors.textLabel}>Duration:</span> {med.duration}</p>
                  )}
                  {med.timing && (
                    <p className={colors.textSecondary}><span className={colors.textLabel}>Timing:</span> {med.timing}</p>
                  )}
                  {med.medicine_form && (
                    <p className={colors.textSecondary}><span className={colors.textLabel}>Form:</span> {med.medicine_form}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`${colors.textMuted} text-sm`}>No medicines prescribed</p>
        )}
      </CollapsibleCard>

      <CollapsibleCard
        title="Follow Up"
        icon={<Clock className="w-4 h-4" />}
        iconColor="text-blue-400"
        isDark={isDark}
        preview={
          <p className={`${colors.textSecondary} text-xs`}>
            {followUp?.when_to_return || 'As advised by doctor'}
          </p>
        }
      >
        <div className="space-y-2 text-xs">
          <p className={colors.textSecondary}>
            <span className="text-teal-400 font-medium">When to return:</span> {followUp?.when_to_return || 'As advised by doctor'}
          </p>
          {followUp?.warning_signs && (
            <p className={colors.textSecondary}>
              <span className="text-red-400 font-medium">Warning signs:</span> {followUp.warning_signs}
            </p>
          )}
          {followUp?.lifestyle_advice && (
            <p className={colors.textSecondary}>
              <span className="text-green-400 font-medium">Lifestyle advice:</span> {followUp.lifestyle_advice}
            </p>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Doctor Information"
        icon={<Stethoscope className="w-4 h-4" />}
        iconColor="text-green-400"
        isDark={isDark}
        preview={
          <p className={`${colors.textSecondary} text-xs`}>
            {prescription?.doctor_name || 'Not specified'}
          </p>
        }
      >
        <div className="space-y-2 text-xs">
          <div>
            <p className={colors.textLabel}>Doctor Name</p>
            <p className={`${colors.text} font-medium`}>{prescription?.doctor_name || 'Not specified'}</p>
          </div>
          {prescription?.doctor_qualifications && (
            <div>
              <p className={colors.textLabel}>Qualifications</p>
              <p className={colors.text}>{prescription.doctor_qualifications}</p>
            </div>
          )}
          {prescription?.doctor_registration && (
            <div>
              <p className={colors.textLabel}>Registration No.</p>
              <p className={colors.text}>{prescription.doctor_registration}</p>
            </div>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Clinic Information"
        icon={<Building2 className="w-4 h-4" />}
        iconColor="text-purple-400"
        isDark={isDark}
        preview={
          <p className={`${colors.textSecondary} text-xs`}>
            {prescription?.clinic_name || 'Not specified'}
          </p>
        }
      >
        <div className="space-y-2 text-xs">
          <div>
            <p className={colors.textLabel}>Clinic Name</p>
            <p className={`${colors.text} font-medium`}>{prescription?.clinic_name || 'Not specified'}</p>
          </div>
          {prescription?.clinic_address && (
            <div>
              <p className={colors.textLabel}>Address</p>
              <p className={colors.text}>{prescription.clinic_address}</p>
            </div>
          )}
          {prescription?.clinic_contact && (
            <div>
              <p className={colors.textLabel}>Contact</p>
              <p className={`${colors.text} flex items-center gap-1`}>
                <Phone className="w-3 h-3" />
                {prescription.clinic_contact}
              </p>
            </div>
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
};

// ============================================
// MAIN COMPONENT - WITH VOICE NOTE INTEGRATION
// ============================================

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const org = params.org as string;
  const prescriptionId = searchParams.get('prescription_id');
  const sessionId = searchParams.get('session');
  const patientIdFromUrl = searchParams.get('patient_id');

  const [isDark, setIsDark] = useState(true);
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('pending');
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // ============================================
  // CRITICAL: Patient state - NO AUTO-CREATION
  // ============================================
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<'no_patient' | 'org_not_found'>('no_patient');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const colors = getThemeColors(isDark);

  const defaultQuickQuestions = [
    'What are the side effects?',
    'Can I take this with food?',
    'What if I miss a dose?',
    'Any drug interactions?'
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem('medibridge-theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('medibridge-theme', newTheme ? 'dark' : 'light');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================================
  // CRITICAL: FETCH EXISTING PATIENT ONLY - NO CREATION
  // ============================================
  const fetchExistingPatient = useCallback(async (userId: string, organizationId: string): Promise<PatientData | null> => {
    console.log('🔍 Looking for existing patient:', { userId, organizationId });
    
    try {
      // Strategy 1: Look for patient by auth_user_id and organization_id
      const { data: existingPatient, error } = await supabase
        .from('patients')
        .select('id, full_name, email, phone, organization_id, auth_user_id')
        .eq('auth_user_id', userId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching patient:', error);
        return null;
      }

      if (existingPatient) {
        console.log('✅ Found existing patient:', existingPatient.id, existingPatient.full_name);
        return existingPatient as PatientData;
      }

      // Strategy 2: If patient_id is in URL, verify it belongs to this user
      if (patientIdFromUrl) {
        const { data: urlPatient, error: urlError } = await supabase
          .from('patients')
          .select('id, full_name, email, phone, organization_id, auth_user_id')
          .eq('id', patientIdFromUrl)
          .eq('auth_user_id', userId)
          .maybeSingle();

        if (!urlError && urlPatient) {
          console.log('✅ Found patient from URL:', urlPatient.id, urlPatient.full_name);
          return urlPatient as PatientData;
        }
      }

      // Strategy 3: If we have a prescription, get patient from there
      if (prescriptionId) {
        const { data: prescPatient, error: prescError } = await supabase
          .from('prescriptions')
          .select('patient_id, patients:patient_id(id, full_name, email, phone, organization_id, auth_user_id)')
          .eq('id', prescriptionId)
          .single();

        if (!prescError && prescPatient?.patients) {
          const patient = prescPatient.patients as any;
          // Verify this patient belongs to the current user
          if (patient.auth_user_id === userId) {
            console.log('✅ Found patient from prescription:', patient.id, patient.full_name);
            return patient as PatientData;
          }
        }
      }

      console.log('⚠️ No existing patient found for user in this organization');
      return null;

    } catch (error) {
      console.error('❌ Error in fetchExistingPatient:', error);
      return null;
    }
  }, [supabase, patientIdFromUrl, prescriptionId]);

  // ============================================
  // INITIALIZE: Fetch user and patient on load
  // ============================================
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        
        // Step 1: Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No authenticated user, redirecting to login');
          router.push(`/${org}/login`);
          return;
        }
        setCurrentUser(user);
        console.log('✅ User authenticated:', user.id);

        // Step 2: Get organization
        let currentOrgId: string | null = null;
        let currentOrgName: string = '';

        console.log('🔍 Looking up organization by subdomain:', org);
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, subdomain')
          .eq('subdomain', org)
          .maybeSingle();

        if (orgData) {
          currentOrgId = orgData.id;
          currentOrgName = orgData.name || '';
          console.log('✅ Organization found by subdomain:', orgData.id, orgData.name);
        } else {
          console.log('🔄 Trying slug lookup for:', org);
          const { data: orgData2, error: orgError2 } = await supabase
            .from('organizations')
            .select('id, name, subdomain')
            .eq('slug', org)
            .maybeSingle();

          if (orgData2) {
            currentOrgId = orgData2.id;
            currentOrgName = orgData2.name || '';
            console.log('✅ Organization found by slug:', orgData2.id, orgData2.name);
          } else {
            console.log('🔄 Trying case-insensitive lookup for:', org);
            const { data: orgData3 } = await supabase
              .from('organizations')
              .select('id, name, subdomain')
              .ilike('subdomain', org)
              .maybeSingle();

            if (orgData3) {
              currentOrgId = orgData3.id;
              currentOrgName = orgData3.name || '';
              console.log('✅ Organization found by ilike:', orgData3.id, orgData3.name);
            }
          }
        }

        if (!currentOrgId) {
          console.error('❌ Organization not found by subdomain or slug:', org);
          setErrorType('org_not_found');
          setShowError(true);
          setLoading(false);
          return;
        }
        
        setOrgId(currentOrgId);
        setOrgName(currentOrgName || org.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
        console.log('✅ Organization loaded:', currentOrgId, currentOrgName);

        // Step 3: Find existing patient (NO CREATION!)
        const existingPatient = await fetchExistingPatient(user.id, currentOrgId);
        
        if (existingPatient) {
          setPatientId(existingPatient.id);
          setPatientData(existingPatient);
          console.log('✅ Patient loaded:', existingPatient.full_name);
        } else {
          console.log('⚠️ No patient found - showing error screen');
          setErrorType('no_patient');
          setShowError(true);
          setLoading(false);
          return;
        }

        // Step 4: Load prescription if ID provided
        if (prescriptionId) {
          await loadPrescription(prescriptionId);
        } else {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hello ${existingPatient.full_name}! I'm Dr. Bridge, your AI healthcare assistant. You can upload a prescription or lab report, and I'll help you understand it. What would you like to do?`,
            timestamp: new Date(),
            type: 'welcome'
          }]);
          setSuggestedQuestions(defaultQuickQuestions);
        }

        setLoading(false);

      } catch (error) {
        console.error('❌ Initialization error:', error);
        setLoading(false);
      }
    }

    initialize();
  }, [org, prescriptionId, supabase, router, fetchExistingPatient]);

  // ============================================
  // LOAD PRESCRIPTION DATA
  // ============================================
  const loadPrescription = async (prescId: string) => {
    try {
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select(`
          id, file_url, status, created_at, chief_complaint,
          patient_name, patient_age, patient_gender,
          doctor_name, doctor_qualifications, doctor_registration,
          clinic_name, clinic_address, clinic_contact,
          prescription_date_extracted, diagnosis,
          user_question, ai_answer, ai_analysis, ai_summary,
          precautions, follow_up_instructions,
          total_medicines, total_tests, document_type,
          suggested_questions,
          processing_status, processing_progress, response_data
        `)
        .eq('id', prescId)
        .single();

      if (!prescriptionError && prescriptionData) {
        setPrescription(prescriptionData);
        setProcessingStatus(prescriptionData.processing_status || 'pending');
        setProcessingProgress(prescriptionData.processing_progress || '');
        
        if (prescriptionData.processing_status === 'processing') {
          setProcessingStartTime(Date.now());
        }
        
        const dbQuestions = safeParseArray(prescriptionData.suggested_questions);
        setSuggestedQuestions(dbQuestions.length > 0 ? dbQuestions : defaultQuickQuestions);
        
        const initialMessages: Message[] = [];
        
        initialMessages.push({
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I'm Dr. Bridge, your AI healthcare assistant. I've analyzed your prescription and I'm here to answer any questions you have about your medicines, dosages, and treatment plan. What would you like to know?`,
          timestamp: new Date(prescriptionData.created_at),
          type: 'welcome'
        });
        
        if (prescriptionData.processing_status === 'processing') {
          initialMessages.push({
            id: 'processing',
            role: 'assistant',
            content: '⏳ Analyzing your prescription... Please wait.',
            timestamp: new Date(),
            type: 'progress'
          });
        }
        
        if (prescriptionData.processing_status === 'completed' || prescriptionData.status === 'analyzed') {
          if (prescriptionData.user_question || prescriptionData.chief_complaint) {
            initialMessages.push({
              id: 'user-question',
              role: 'user',
              content: prescriptionData.user_question || prescriptionData.chief_complaint || '',
              timestamp: new Date(prescriptionData.created_at),
              type: 'question'
            });
          }
          
          const aiAnswer = extractAiAnswer(prescriptionData);
          
          if (aiAnswer) {
            initialMessages.push({
              id: 'ai-answer',
              role: 'assistant',
              content: aiAnswer,
              timestamp: new Date(prescriptionData.created_at),
              type: 'answer'
            });
          }
        }
        
        setMessages(initialMessages);
        
        const { data: items } = await supabase
          .from('prescription_items')
          .select('*')
          .eq('prescription_id', prescId)
          .order('sequence_number', { ascending: true });
        
        if (items) {
          setPrescriptionItems(items);
        }
      }
    } catch (error) {
      console.error('Error loading prescription:', error);
    }
  };

  // ============================================
  // FILE UPLOAD HELPER
  // ============================================
  const uploadChatFile = async (
    file: File | Blob,
    fileType: 'prescription' | 'lab_report' | 'image' | 'audio'
  ): Promise<UploadResult> => {
    try {
      const userId = currentUser?.id || 'anonymous';
      const timestamp = Date.now();
      const extension = file instanceof File 
        ? file.name.split('.').pop() 
        : file.type?.includes('audio') ? 'webm' : 'jpg';
      const fileName = `${userId}/${fileType}_${timestamp}.${extension}`;
      const bucket = file.type?.includes('audio') ? 'voice-messages' : 
                     fileType === 'lab_report' ? 'lab-reports' : 'prescriptions';

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        fileUrl: urlData.publicUrl,
        storagePath: data.path
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ============================================
  // HANDLE FILE UPLOAD - USES EXISTING PATIENT ONLY
  // ============================================
  const handleFileUpload = async (file: File, type: 'prescription' | 'lab_report', question: string) => {
    if (!patientId || !patientData) {
      alert('No patient selected. Please go to the dashboard and select a patient first.');
      router.push(`/${org}/dashboard`);
      return;
    }

    setUploadingFile(true);
    setShowFileModal(false);
    
    const uploadMessage: Message = {
      id: `upload-${Date.now()}`,
      role: 'user',
      content: `📎 Uploading ${type === 'prescription' ? 'Prescription' : 'Lab Report'}...`,
      timestamp: new Date(),
      type: 'upload',
      fileName: file.name
    };
    setMessages(prev => [...prev, uploadMessage]);
    
    try {
      console.log('📤 Starting upload for patient:', patientId, patientData.full_name);

      const uploadResult = await uploadChatFile(file, type);
      if (!uploadResult.success || !uploadResult.fileUrl) {
        throw new Error(uploadResult.error || 'File upload failed');
      }
      console.log('✅ File uploaded:', uploadResult.fileUrl);

      setMessages(prev => prev.map(m => 
        m.id === uploadMessage.id 
          ? { 
              ...m, 
              content: `📎 ${file.name}${question ? `\n\n💬 "${question}"` : ''}`, 
              fileUrl: uploadResult.fileUrl, 
              fileType: type 
            }
          : m
      ));

      const newChatSessionId = sessionId || `chat-upload-${Date.now()}`;
      
      const prescriptionData = {
        patient_id: patientId,
        organization_id: orgId,
        file_url: uploadResult.fileUrl,
        chief_complaint: question,
        user_question: question,
        document_type: type,
        status: 'pending',
        processing_status: 'processing',
        processing_progress: 'Receiving your document...',
        processing_started_at: new Date().toISOString()
      };

      console.log('📝 Creating prescription with existing patient:', prescriptionData);

      const { data: newPrescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert(prescriptionData)
        .select('id')
        .single();

      if (prescriptionError || !newPrescription) {
        console.error('Prescription creation error:', prescriptionError);
        throw new Error('Failed to create prescription record');
      }

      const newPrescriptionId = newPrescription.id;
      console.log('✅ Prescription created:', newPrescriptionId);

      setMessages(prev => [...prev, {
        id: 'processing',
        role: 'assistant' as const,
        content: `⏳ Analyzing your ${type === 'prescription' ? 'prescription' : 'lab report'}... Please wait.`,
        timestamp: new Date(),
        type: 'progress' as const
      }]);

      setProcessingStatus('processing');
      setProcessingStartTime(Date.now());

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        'https://n8n.nhcare.in/webhook/medibridge-chat-v6-test';

      const mimeType = file.type || (
        file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
        file.name?.toLowerCase().endsWith('.png') ? 'image/png' :
        file.name?.toLowerCase().endsWith('.jpg') || file.name?.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
        'application/octet-stream'
      );
      
      const payload = {
        prescription_id: newPrescriptionId,
        patient_id: patientId,
        chat_session_id: newChatSessionId,
        user_id: currentUser?.id,
        file_url: uploadResult.fileUrl,
        file_type: mimeType,
        document_type: type,
        query: question,
        chief_complaint: question,
        user_question: question,
        channel: 'web',
        organization: org,
        organization_id: orgId,
        is_new_upload: false,
        upload_source: 'chat'
      };

      console.log('📤 Sending to n8n:', webhookUrl);
      console.log('📄 File type detected:', mimeType);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('📥 n8n response:', result);
      
      if (response.status === 202 || result.status === 'processing') {
        console.log('⏳ Async processing started');
      } else if (result.error) {
        throw new Error(result.error || result.message || 'Analysis failed');
      } else {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== 'processing');
          return [...filtered, {
            id: `assistant-${Date.now()}`,
            role: 'assistant' as const,
            content: result.output || result.text || result.ai_answer || 
                     `I've analyzed your ${type}. Here's what I found...`,
            timestamp: new Date(),
            type: 'answer' as const
          }];
        });
        
        if (result.suggested_questions) {
          setSuggestedQuestions(safeParseArray(result.suggested_questions));
        }
      }

      const channel = supabase
        .channel(`prescription-${newPrescriptionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'prescriptions',
            filter: `id=eq.${newPrescriptionId}`
          },
          (payload) => {
            const newData = payload.new as any;
            console.log('📡 Real-time update:', newData.processing_status);
            
            setProcessingStatus(newData.processing_status || 'processing');
            setProcessingProgress(newData.processing_progress || '');
            
            if (newData.processing_status === 'completed') {
              const aiAnswer = extractAiAnswer(newData);
              
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== 'processing');
                if (aiAnswer) {
                  return [...filtered, {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant' as const,
                    content: aiAnswer,
                    timestamp: new Date(),
                    type: 'answer' as const
                  }];
                }
                return filtered;
              });
              
              if (newData.response_data?.suggested_questions) {
                setSuggestedQuestions(safeParseArray(newData.response_data.suggested_questions));
              }
              
              supabase.removeChannel(channel);
            }
            
            if (newData.processing_status === 'error') {
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== 'processing');
                return [...filtered, {
                  id: `error-${Date.now()}`,
                  role: 'assistant' as const,
                  content: 'Sorry, there was an error processing your document. Please try again.',
                  timestamp: new Date(),
                  type: 'error' as const
                }];
              });
              supabase.removeChannel(channel);
            }
          }
        )
        .subscribe();

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'processing' && m.id !== uploadMessage.id);
        return [...filtered, {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}`,
          timestamp: new Date(),
          type: 'error' as const
        }];
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // ============================================
  // HANDLE CAMERA CAPTURE
  // ============================================
  const handleCameraCapture = async (imageBlob: Blob) => {
    setShowCamera(false);
    const file = new File([imageBlob], `prescription_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    await handleFileUpload(file, 'prescription', 'Please analyze this prescription and explain the medicines');
  };
// ============================================
// CONNECT TO DOCTOR MODAL COMPONENT
// ============================================

interface ConnectToDoctorModalProps {
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
  isDark: boolean;
  orgName: string;
  patientName?: string;
}

const ConnectToDoctorModal = ({
  onClose,
  onSubmit,
  isSubmitting,
  isDark,
  orgName,
  patientName 
}: ConnectToDoctorModalProps) => {
  const [reason, setReason] = useState('');
  const colors = getThemeColors(isDark);

  const handleSubmit = () => {
    onSubmit(reason);
  };

  const quickReasons = [
    'Side effects from medicine',
    'Dosage clarification needed',
    'Symptoms not improving',
    'New symptoms appeared',
    'Need prescription refill',
    'General health concern'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
      <div className={`${colors.bgSecondary} rounded-2xl max-w-md w-full shadow-2xl border ${colors.borderLight} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-4 border-b ${colors.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`${colors.text} font-semibold`}>Connect to Doctor</h3>
              <p className={`${colors.textSecondary} text-xs`}>Request a callback from {orgName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`p-2 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <X className={`w-5 h-5 ${colors.textSecondary}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Patient Info */}
          {patientName && (
            <div className={`${colors.cyanBg} rounded-lg p-3 border ${colors.cyanBorder}`}>
              <p className={`text-xs ${colors.textSecondary}`}>Requesting callback for:</p>
              <p className={`text-sm font-medium ${colors.cyan}`}>{patientName}</p>
            </div>
          )}

          {/* Info Box */}
          <div className={`${isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'} rounded-lg p-3 border`}>
            <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>
              📞 A doctor from <span className="font-semibold">{orgName}</span> will contact you within <span className="font-semibold">2 hours</span>.
            </p>
          </div>

          {/* Quick Reasons */}
          <div>
            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
              Quick select a reason:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickReasons.map((quickReason, index) => (
                <button
                  key={index}
                  onClick={() => setReason(quickReason)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    reason === quickReason
                      ? 'bg-cyan-500 text-white border-cyan-500'
                      : `${colors.border} ${colors.text} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`
                  }`}
                >
                  {quickReason}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div>
            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
              Or describe your concern:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., I'm experiencing dizziness after taking the medicine..."
              className={`w-full px-3 py-2.5 ${colors.bgInput} border ${colors.borderInput} rounded-xl ${colors.text} ${colors.placeholder} focus:outline-none focus:border-cyan-500 resize-none text-sm`}
              rows={3}
              maxLength={500}
            />
            <p className={`text-xs ${colors.textMuted} mt-1 text-right`}>
              {reason.length}/500 characters
            </p>
          </div>

          {/* Emergency Warning */}
          <div className={`${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'} rounded-lg p-3 border`}>
            <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'} flex items-start gap-2`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>For emergencies:</strong> Please call <strong>102</strong> or visit the nearest hospital immediately.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${colors.border} flex gap-3`}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Request Callback
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
  // ============================================
  // HANDLE VOICE MESSAGE - LOCAL TRANSCRIPTION + N8N TEXT
  // ============================================
  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    // CRITICAL: Immediate logging to confirm function is called
    console.log('🎤🎤🎤 handleVoiceMessage CALLED 🎤🎤🎤');
    console.log('🎤 Audio blob received:', {
      size: audioBlob?.size,
      type: audioBlob?.type,
      duration: duration
    });

    // Validate audioBlob
    if (!audioBlob || audioBlob.size === 0) {
      console.error('❌ Invalid audio blob - empty or null');
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: 'Sorry, the voice recording was empty. Please try again and hold the microphone button while speaking.',
        timestamp: new Date(),
        type: 'error' as const
      }]);
      return;
    }

    // Check minimum size (very short recordings might be too small)
    if (audioBlob.size < 1000) {
      console.warn('⚠️ Audio blob is very small:', audioBlob.size, 'bytes');
    }

    if (!patientId) {
      console.error('❌ No patient ID available');
      alert('No patient selected. Please go to the dashboard first.');
      return;
    }

    setIsRecording(false);
    setUploadingFile(true);
    
    // Create voice message with pending transcription
    const voiceMessageId = `voice-${Date.now()}`;
    const voiceMessage: Message = {
      id: voiceMessageId,
      role: 'user',
      content: '🎤 Voice message...',
      timestamp: new Date(),
      type: 'voice',
      audioDuration: duration
    };
    setMessages(prev => [...prev, voiceMessage]);
    
    try {
      // Step 1: Upload audio to Supabase via our API
      console.log('📤 Step 1: Uploading audio to Supabase...');
      const uploadFormData = new FormData();
      uploadFormData.append('audio', audioBlob, 'voice-note.webm');
      uploadFormData.append('patient_id', patientId);
      uploadFormData.append('chat_session_id', sessionId || prescriptionId || `chat-${Date.now()}`);
      
      const uploadResponse = await fetch('/api/voice/upload', {
        method: 'POST',
        body: uploadFormData
      });
      
      console.log('📤 Upload response status:', uploadResponse.status);
      const uploadResult = await uploadResponse.json();
      console.log('📤 Upload result:', uploadResult);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Voice upload failed');
      }
      
      console.log('✅ Voice uploaded:', uploadResult.audio_url);
      
      // Update message with audio URL
      setMessages(prev => prev.map(m => 
        m.id === voiceMessageId 
          ? { ...m, audioUrl: uploadResult.audio_url }
          : m
      ));
      
      // Step 2: Show processing message
      setMessages(prev => [...prev, {
        id: 'processing',
        role: 'assistant' as const,
        content: '🎤 Transcribing your voice message...',
        timestamp: new Date(),
        type: 'progress' as const
      }]);
      
      // Step 3: Transcribe locally via our API (bypasses n8n Whisper issues)
      console.log('🎤 Step 3: Transcribing audio locally...');
      const transcribeFormData = new FormData();
      transcribeFormData.append('audio', audioBlob, 'voice-note.webm');
      
      const transcribeResponse = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: transcribeFormData
      });
      
      console.log('🎤 Transcribe response status:', transcribeResponse.status);
      const transcribeResult = await transcribeResponse.json();
      console.log('🎤 Transcribe result:', transcribeResult);
      
      if (!transcribeResult.success || !transcribeResult.text) {
        // If transcription fails, provide a fallback
        console.error('❌ Transcription failed:', transcribeResult.error);
        throw new Error(transcribeResult.error || 'Transcription failed - please try typing your question instead');
      }
      
      const transcription = transcribeResult.text;
      console.log('✅ Transcription successful:', transcription);
      
      // Update voice message with transcription
      setMessages(prev => prev.map(m => 
        m.id === voiceMessageId 
          ? { ...m, content: transcription, transcription: transcription }
          : m
      ));
      
      // Update processing message
      setMessages(prev => prev.map(m =>
        m.id === 'processing'
          ? { ...m, content: '🤔 Thinking...' }
          : m
      ));
      
      // Step 4: Send transcribed TEXT to n8n (not audio)
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        'https://n8n.nhcare.in/webhook/medibridge-chat-v6-test';

      console.log('📤 Step 4: Sending text query to n8n:', transcription);
      console.log('📤 Webhook URL:', webhookUrl);
      
      const n8nPayload = {
        patient_id: patientId,
        prescription_id: prescriptionId || null,
        chat_session_id: sessionId || prescriptionId || `chat-${Date.now()}`,
        user_id: currentUser?.id,
        query: transcription, // Send TEXT, not audio
        input_type: 'text', // Treat as text since we transcribed locally
        document_type: 'follow_up',
        channel: 'web',
        organization: org,
        organization_id: orgId,
        voice_transcription: transcription, // Include original transcription for context
        audio_url: uploadResult.audio_url // Include audio URL for reference
      };
      
      console.log('📤 n8n payload:', n8nPayload);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });

      console.log('📥 n8n response status:', response.status);
      
      // Safely parse JSON response from n8n
      let result: any = {};
      try {
        const responseText = await response.text();
        console.log('📥 n8n raw response length:', responseText?.length);
        console.log('📥 n8n raw response preview:', responseText?.substring(0, 200));
        
        if (responseText && responseText.trim()) {
          result = JSON.parse(responseText);
          console.log('📥 n8n parsed result:', result);
        } else {
          console.warn('⚠️ n8n returned empty response');
          result = { 
            output: 'I received your message. How can I help you?' 
          };
        }
      } catch (parseError) {
        console.error('❌ Failed to parse n8n response:', parseError);
        result = { 
          output: 'I received your message. Please try again.' 
        };
      }
      
      // Step 5: Add AI response
      const aiResponse = result.output || result.text || result.ai_answer || 
                         'I received your message. How can I help you?';
      
      console.log('✅ AI response received:', aiResponse.substring(0, 100) + '...');
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'processing');
        return [...filtered, {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: aiResponse,
          timestamp: new Date(),
          type: 'answer' as const,
          audioResponseUrl: result.audio_response_url
        }];
      });
      
      // Update suggested questions if provided
      if (result.suggested_questions) {
        setSuggestedQuestions(safeParseArray(result.suggested_questions));
      }
      
      console.log('✅ Voice message flow completed successfully!');
      
    } catch (error: any) {
      console.error('❌ Voice processing error:', error);
      console.error('❌ Error stack:', error.stack);
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'processing');
        // Keep the voice message but mark as error
        const withError = filtered.map(m => 
          m.id === voiceMessageId 
            ? { ...m, content: m.transcription || m.content || '🎤 Voice message (failed to process)' }
            : m
        );
        return [...withError, {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: `Sorry, I could not process your voice message: ${error.message || 'Please try again or type your question.'}`,
          timestamp: new Date(),
          type: 'error' as const
        }];
      });
    } finally {
      setUploadingFile(false);
      console.log('🎤 handleVoiceMessage completed (finally block)');
    }
  };

  const fetchPrescriptionItems = useCallback(async () => {
    if (!prescriptionId) return;
    
    const { data, error } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('prescription_id', prescriptionId)
      .order('sequence_number', { ascending: true });
    
    if (!error && data) {
      setPrescriptionItems(data);
    }
  }, [prescriptionId, supabase]);

  const addAiAnswerToMessages = useCallback((aiAnswer: string) => {
    if (!aiAnswer) return;
    
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== 'processing' && m.id !== 'loading');
      const alreadyHasThisAnswer = filtered.some(
        m => m.type === 'answer' && m.content === aiAnswer
      );
      
      if (alreadyHasThisAnswer) {
        return filtered;
      }
      
      return [...filtered, {
        id: `ai-answer-${Date.now()}`,
        role: 'assistant' as const,
        content: aiAnswer,
        timestamp: new Date(),
        type: 'answer' as const
      }];
    });
  }, []);

  const refreshPrescriptionStatus = useCallback(async () => {
    if (!prescriptionId || isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          id, file_url, status, created_at, chief_complaint,
          patient_name, patient_age, patient_gender,
          doctor_name, doctor_qualifications, doctor_registration,
          clinic_name, clinic_address, clinic_contact,
          prescription_date_extracted, diagnosis,
          user_question, ai_answer, ai_analysis, ai_summary,
          precautions, follow_up_instructions,
          total_medicines, total_tests, document_type,
          suggested_questions,
          processing_status, processing_progress, response_data
        `)
        .eq('id', prescriptionId)
        .single();
      
      if (!error && data) {
        setPrescription(data);
        setProcessingStatus(data.processing_status || 'pending');
        setProcessingProgress(data.processing_progress || '');
        
        const dbQuestions = safeParseArray(data.suggested_questions);
        if (dbQuestions.length > 0) {
          setSuggestedQuestions(dbQuestions);
        }
        
        if (data.processing_status === 'completed') {
          setShowRefreshHint(false);
          setProcessingStartTime(null);
          await fetchPrescriptionItems();
          
          const aiAnswer = extractAiAnswer(data);
          if (aiAnswer) {
            addAiAnswerToMessages(aiAnswer);
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [prescriptionId, isRefreshing, supabase, fetchPrescriptionItems, addAiAnswerToMessages]);

  // Timer effects
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (processingStatus === 'processing') {
      if (!processingStartTime) {
        setProcessingStartTime(Date.now());
      }
      
      intervalId = setInterval(() => {
        if (processingStartTime) {
          const elapsed = Math.floor((Date.now() - processingStartTime) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);
    } else {
      setElapsedTime(0);
      setProcessingStartTime(null);
    }
    
    return () => clearInterval(intervalId);
  }, [processingStatus, processingStartTime]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (processingStatus === 'processing') {
      timeoutId = setTimeout(() => {
        setShowRefreshHint(true);
      }, 30000);
    } else {
      setShowRefreshHint(false);
    }
    
    return () => clearTimeout(timeoutId);
  }, [processingStatus]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (processingStatus === 'processing' && prescriptionId) {
      intervalId = setInterval(() => {
        refreshPrescriptionStatus();
      }, 15000);
    }
    
    return () => clearInterval(intervalId);
  }, [processingStatus, prescriptionId, refreshPrescriptionStatus]);

  // Real-time subscription for prescription updates
  useEffect(() => {
    if (!prescriptionId) return;

    const channel = supabase
      .channel(`prescription-${prescriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prescriptions',
          filter: `id=eq.${prescriptionId}`
        },
        (payload) => {
          const newData = payload.new as any;
          
          if (newData.processing_status) {
            setProcessingStatus(newData.processing_status);
          }
          
          if (newData.processing_progress) {
            setProcessingProgress(newData.processing_progress);
          }
          
          if (newData.processing_status === 'completed') {
            setShowRefreshHint(false);
            setProcessingStartTime(null);
            
            const aiAnswer = extractAiAnswer(newData);
            
            setPrescription(prev => ({
              ...prev!,
              ...newData,
              ai_answer: aiAnswer || newData.ai_answer,
              status: 'analyzed'
            }));
            
            if (newData.response_data) {
              let responseData = newData.response_data;
              if (typeof responseData === 'string') {
                try {
                  responseData = JSON.parse(responseData);
                } catch (e) {}
              }
              if (responseData?.suggested_questions) {
                setSuggestedQuestions(safeParseArray(responseData.suggested_questions));
              }
            }
            
            if (aiAnswer) {
              addAiAnswerToMessages(aiAnswer);
            }
            
            fetchPrescriptionItems();
          }
          
          if (newData.processing_status === 'error') {
            setShowRefreshHint(false);
            
            let errorMessage = 'There was an error processing your prescription.';
            if (newData.response_data) {
              try {
                const errorData = typeof newData.response_data === 'string' 
                  ? JSON.parse(newData.response_data) 
                  : newData.response_data;
                errorMessage = errorData.message || errorData.error || errorMessage;
              } catch (e) {}
            }
            
            setMessages(prev => {
              const filtered = prev.filter(m => m.id !== 'processing' && m.id !== 'loading');
              return [...filtered, {
                id: `error-${Date.now()}`,
                role: 'assistant' as const,
                content: errorMessage,
                timestamp: new Date(),
                type: 'error' as const
              }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prescriptionId, supabase, fetchPrescriptionItems, addAiAnswerToMessages]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || sending) return;

    if (!patientId) {
      alert('No patient selected. Please go to the dashboard first.');
      return;
    }

    setSending(true);
    setInputValue('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      type: 'question'
    };

    setMessages(prev => [...prev, userMessage]);

    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
      type: 'general'
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ||
        'https://n8n.nhcare.in/webhook/medibridge-chat-v6-test';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: prescriptionId,
          chat_session_id: sessionId || prescriptionId,
          patient_id: patientId,
          user_id: currentUser?.id,
          query: messageToSend,
          chief_complaint: messageToSend,
          channel: 'web',
          organization: org,
          document_type: 'follow_up'
        })
      });

      const result = await response.json();
      
      if (response.status === 202 || result.status === 'processing') {
        setProcessingStatus('processing');
        setProcessingStartTime(Date.now());
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== 'loading');
          return [...filtered, {
            id: 'processing',
            role: 'assistant' as const,
            content: '⏳ Analyzing your request... Please wait.',
            timestamp: new Date(),
            type: 'progress' as const
          }];
        });
      } else {
        let answerText = result.output || result.text || result.ai_answer || 'I apologize, but I could not process your question. Please try again.';
        
        const answerMatch = answerText.match(/###\s*ANSWER TO YOUR QUESTION\s*([\s\S]*?)(?=###|---\s*###|$)/i);
        if (answerMatch) {
          answerText = answerMatch[1].trim();
        }
        
        if (result.suggested_questions) {
          const newQuestions = safeParseArray(result.suggested_questions);
          if (newQuestions.length > 0) {
            setSuggestedQuestions(newQuestions);
          }
        }
        
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== 'loading');
          return [...filtered, {
            id: `assistant-${Date.now()}`,
            role: 'assistant' as const,
            content: answerText,
            timestamp: new Date(),
            type: 'answer' as const
          }];
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'loading');
        return [...filtered, {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          type: 'error' as const
        }];
      });
    } finally {
      setSending(false);
    }
  };

  const handleConnectToDoctor = async (reason?: string) => {
    if (escalating || escalated || !patientId) return;
    
    setEscalating(true);
    setShowEscalationModal(false);
    
    try {
      let chatSessionId = null;
      
      if (orgId && patientId) {
        if (sessionId) {
          const { data: existingSession } = await supabase
            .from('chat_sessions')
            .select('id')
            .eq('id', sessionId)
            .maybeSingle();
          
          if (existingSession) {
            chatSessionId = sessionId;
            await supabase
              .from('chat_sessions')
              .update({ status: 'escalated' })
              .eq('id', chatSessionId);
          }
        }
        
        if (!chatSessionId) {
          const { data: newSession, error: sessionError } = await supabase
            .from('chat_sessions')
            .insert({
              organization_id: orgId,
              patient_id: patientId,
              prescription_id: prescriptionId || null,
              status: 'escalated',
              channel: 'app',
              chat_summary: `Patient requested doctor connection. Patient: ${patientData?.full_name || 'Unknown'}. Reason: ${reason || 'Not specified'}`
            })
            .select('id')
            .single();
          
          if (!sessionError && newSession) {
            chatSessionId = newSession.id;
          }
        }
      }
      
      if (orgId && chatSessionId && patientId) {
        // Determine severity based on reason keywords
        let severity = 'medium';
        const reasonLower = (reason || '').toLowerCase();
        if (reasonLower.includes('emergency') || reasonLower.includes('severe') ||
            reasonLower.includes('chest pain') || reasonLower.includes('breathing')) {
          severity = 'critical';
        } else if (reasonLower.includes('side effect') || reasonLower.includes('not improving') ||
                   reasonLower.includes('new symptom')) {
          severity = 'high';
        }

        await supabase
          .from('escalations')
          .insert({
            organization_id: orgId,
            patient_id: patientId,
            chat_session_id: chatSessionId,
            escalation_type: 'doctor_request',
            severity: severity,
            status: 'pending',
            reason: reason || 'Patient requested doctor callback',
            escalation_summary: `Patient ${patientData?.full_name || 'Unknown'} requested to connect with a doctor. Reason: ${reason || 'Not specified'}`,
            ai_recommendation: `Patient has requested direct doctor consultation. Reason provided: \"${reason || 'Not specified'}\". Please review the chat history and prescription details.`,
            response_deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          });
      }
      
      const confirmMessage: Message = {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Your request has been sent to the clinic!**\n\n${reason ? `**Your concern:** \"${reason}\"\n\n` : ''}A doctor from ${orgName || 'the clinic'} will review your case and contact you within **2 hours**.\n\n**What happens next:**\n- The clinic staff will see your request\n- They will review your prescription and chat history\n- You'll receive a callback or message shortly\n\nIn the meantime, feel free to continue asking me questions about your prescription.`,
        timestamp: new Date(),
        type: 'general'
      };
      
      setMessages(prev => [...prev, confirmMessage]);
      setEscalated(true);
      setEscalationReason('');
      
    } catch (error) {
      console.error('Error connecting to doctor:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Sorry, there was an error sending your request. Please try again or contact the clinic directly.',
        timestamp: new Date(),
        type: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setEscalating(false);
    }
  };
        


  const goToDashboard = () => {
    router.push(`/${org}/dashboard`);
  };

  const medicines = prescriptionItems.filter(item => item.item_type === 'medicine');
  const tests = prescriptionItems.filter(item => item.item_type === 'test');

  const getPrecautions = (): string[] => {
    if (!prescription?.precautions) return [];
    if (Array.isArray(prescription.precautions)) return prescription.precautions;
    if (typeof prescription.precautions === 'string') {
      try {
        return JSON.parse(prescription.precautions);
      } catch {
        return [prescription.precautions];
      }
    }
    return [];
  };

  const getFollowUp = () => {
    if (!prescription?.follow_up_instructions) return null;
    if (typeof prescription.follow_up_instructions === 'string') {
      try {
        return JSON.parse(prescription.follow_up_instructions);
      } catch {
        return null;
      }
    }
    return prescription.follow_up_instructions;
  };

  const getAiSummary = (): string => {
    if (prescription?.ai_summary) return prescription.ai_summary;
    const aiAnswer = extractAiAnswer(prescription);
    if (aiAnswer) {
      return aiAnswer
        .replace(/[#*_~`]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 300) + '...';
    }
    return 'Prescription analyzed successfully.';
  };

  const precautions = getPrecautions();
  const followUp = getFollowUp();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isProcessingComplete = processingStatus === 'completed' || prescription?.status === 'analyzed';
  const isInputDisabled = sending || processingStatus === 'processing' || uploadingFile;

  // ============================================
  // RENDER: ERROR SCREEN (No Patient / Org Not Found)
  // ============================================
  if (showError) {
    return (
      <ErrorScreen 
        orgSlug={org} 
        isDark={isDark} 
        onGoToDashboard={goToDashboard}
        errorType={errorType}
      />
    );
  }

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (loading) {
    return (
      <div className={`fixed inset-0 ${colors.bg} flex items-center justify-center z-[9999]`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${colors.text} text-lg`}>Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className={`fixed inset-0 ${colors.bg} flex flex-col z-[9999] transition-colors duration-300`}>
      
      {/* MODALS */}
      {showFileModal && (
        <FileUploadModal
          onClose={() => setShowFileModal(false)}
          onFileSelect={handleFileUpload}
          isDark={isDark}
          patientName={patientData?.full_name}
        />
      )}
      
      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          onCapture={handleCameraCapture}
          isDark={isDark}
        />
      )}
      {showEscalationModal && (
        <ConnectToDoctorModal
          onClose={() => setShowEscalationModal(false)}
          onSubmit={(reason) => handleConnectToDoctor(reason)}
          isSubmitting={escalating}
          isDark={isDark}
          orgName={orgName}
          patientName={patientData?.full_name}
        />
      )}
      {/* HEADER */}
      <header className={`${colors.bgSecondary} border-b ${colors.border} flex-shrink-0`}>
        <div className="px-4 py-3 flex items-center justify-between relative">
          <h1 className={`text-lg font-bold ${colors.text}`}>MediBridge</h1>
          <h2 className="text-lg font-bold text-cyan-500 absolute left-1/2 transform -translate-x-1/2">
            {orgName || 'Loading...'}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-yellow-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
            <button
              onClick={goToDashboard}
              className="text-cyan-500 hover:text-cyan-400 flex items-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className={`w-[40%] flex flex-col ${colors.bgTertiary}`}>
          <div className={`p-4 border-b ${colors.border} flex-shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`${colors.text} font-semibold text-sm`}>Prescription Details</h2>
                <p className={`${colors.textSecondary} text-xs`}>AI-powered insights</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            {prescription && !isProcessingComplete ? (
              <div className={`${colors.bgCard} rounded-xl border ${colors.borderLight} p-6 text-center`}>
                <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
                <p className={`${colors.text} text-sm font-medium`}>Analyzing prescription...</p>
                <p className={`${colors.textSecondary} text-xs mt-2`}>{processingProgress || 'Please wait'}</p>
                
                {elapsedTime > 0 && (
                  <p className={`${colors.textMuted} text-xs mt-2`}>
                    Time elapsed: {elapsedTime}s
                  </p>
                )}
                
                <button
                  onClick={refreshPrescriptionStatus}
                  disabled={isRefreshing}
                  className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showRefreshHint
                      ? 'bg-cyan-500 text-white animate-pulse'
                      : isDark 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  {isRefreshing ? 'Checking...' : 'Check Status'}
                </button>
              </div>
            ) : prescription ? (
              <PrescriptionDetails
                prescription={prescription}
                medicines={medicines}
                tests={tests}
                precautions={precautions}
                followUp={followUp}
                formatDate={formatDate}
                getAiSummary={getAiSummary}
                isDark={isDark}
              />
            ) : (
              <div className={`${colors.bgCard} rounded-xl border ${colors.borderLight} p-6 text-center`}>
                <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                <p className={`${colors.text} text-sm font-medium`}>No Prescription Yet</p>
                <p className={`${colors.textSecondary} text-xs mt-2`}>
                  Upload a prescription to see detailed analysis here
                </p>
              </div>
            )}
          </div>
          
          <div className={`border-t ${colors.border} p-3 flex-shrink-0 ${isDark ? 'bg-slate-900/80' : 'bg-white'}`}>
            <p className="text-green-500 text-sm font-medium text-center">सर्वे सन्तु निरामया:</p>
            <p className="text-orange-500 text-xs text-center mt-0.5">"May all be free from illness"</p>
          </div>
        </div>

        {/* RIGHT PANEL - CHAT */}
        <div className={`w-[60%] flex flex-col ${colors.bg}`}>
          
          {/* Chat Header */}
          <div className={`p-4 border-b ${colors.border} flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`${colors.text} font-semibold text-sm`}>Dr. Bridge</h2>
                  <p className="text-green-500 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Online • Ready to help
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
              <button
                  onClick={() => !escalated && setShowEscalationModal(true)}
                  disabled={escalating || escalated}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    escalated
                      ? 'bg-green-500/20 text-green-400 cursor-default'
                      : escalating
                      ? 'bg-orange-500/20 text-orange-400 cursor-wait'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-105'
                  }`}
                >
                  {escalated ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Request Sent</span>
                    </>
                  ) : escalating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Connect to Doctor</span>
                    </>
                  )}
                </button>

                {patientData && (
                  <div className={`flex items-center gap-2 ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'} pl-2 pr-3 py-1.5 rounded-full`}>
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {patientData.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className={`${colors.text} text-xs font-medium leading-tight`}>{patientData.full_name}</p>
                      <p className={`${colors.textSecondary} text-[10px] leading-tight`}>
                        Patient
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <div className="max-w-3xl mx-auto space-y-4">
              
              {prescription && !isProcessingComplete && (
                <ProcessingStatus 
                  status={processingStatus} 
                  progress={processingProgress}
                  isDark={isDark}
                  onRefresh={refreshPrescriptionStatus}
                  isRefreshing={isRefreshing}
                  showRefreshHint={showRefreshHint}
                  elapsedTime={elapsedTime}
                />
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-br-md'
                        : message.type === 'error'
                          ? `${colors.bgMessage} ${colors.text} rounded-2xl rounded-bl-md border border-red-500/30`
                          : `${colors.bgMessage} ${colors.text} rounded-2xl rounded-bl-md border ${colors.borderLight}`
                    } px-4 py-3 shadow-lg`}
                  >
                    {message.role === 'user' && message.type === 'question' && (
                      <p className="text-cyan-200 font-semibold text-[10px] uppercase tracking-wide mb-1">Your Question</p>
                    )}
                    {message.role === 'user' && message.type === 'upload' && (
                      <p className="text-cyan-200 font-semibold text-[10px] uppercase tracking-wide mb-1">File Upload</p>
                    )}
                    {message.role === 'user' && message.type === 'voice' && (
                      <p className="text-cyan-200 font-semibold text-[10px] uppercase tracking-wide mb-1">Voice Message</p>
                    )}
                    {message.role === 'assistant' && message.type === 'answer' && (
                      <p className="text-cyan-500 font-semibold text-[10px] uppercase tracking-wide mb-2">Answer to Your Question</p>
                    )}
                    {message.role === 'assistant' && message.type === 'error' && (
                      <p className="text-red-400 font-semibold text-[10px] uppercase tracking-wide mb-2">Error</p>
                    )}
                    
                    <div className="text-sm leading-relaxed">
                      {/* Voice Note Message */}
                      {message.type === 'voice' && message.audioUrl ? (
                        <VoiceNotePlayer
                          audioUrl={message.audioUrl}
                          duration={message.audioDuration}
                          transcription={message.transcription || message.content}
                          isUserMessage={message.role === 'user'}
                        />
                      ) : message.type === 'progress' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          <span className={colors.textSecondary}>{message.content}</span>
                        </div>
                      ) : message.content === '...' ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className={colors.textSecondary + ' text-xs'}>Thinking...</span>
                        </div>
                      ) : message.role === 'assistant' ? (
                        <>
                          <RenderMarkdown text={message.content} isDark={isDark} />
                          {/* Audio Response Player for AI messages */}
                          {message.audioResponseUrl && (
                            <AudioResponsePlayer audioUrl={message.audioResponseUrl} />
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    
                    <p className={`text-[10px] mt-2 ${message.role === 'user' ? 'text-cyan-200/70' : colors.textMuted}`}>
                      {message.timestamp.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className={`border-t ${colors.border} flex-shrink-0 ${colors.bg}`}>
            <ChatInputActions
              onUploadClick={() => setShowFileModal(true)}
              onCameraClick={() => setShowCamera(true)}
              disabled={isInputDisabled}
              isDark={isDark}
            />
            
            <div className="p-4 pt-2">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask anything about your prescription..."
                      disabled={isInputDisabled}
                      className={`w-full px-4 py-3 ${colors.bgInput} border ${colors.borderInput} rounded-2xl ${colors.text} ${colors.placeholder} focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 disabled:opacity-50 transition-all resize-none text-sm`}
                      rows={1}
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                  </div>
                  
                  {/* Voice Note Recorder - Hold to Record */}
                  <VoiceNoteRecorder
                    disabled={isInputDisabled}
                    onRecordingComplete={handleVoiceMessage}
                    onRecordingStart={() => setIsRecording(true)}
                  />
                  
                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={sending || !inputValue.trim() || isInputDisabled}
                    className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 pb-2">
              <div className="max-w-3xl mx-auto flex gap-1.5 overflow-x-auto scrollbar-hide">
                {suggestedQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    disabled={isInputDisabled}
                    className={`flex-shrink-0 px-2.5 py-1 ${colors.cyanBg} hover:bg-cyan-500/20 text-cyan-500 hover:text-cyan-400 text-[11px] rounded-full border ${colors.cyanBorder} hover:border-cyan-400/50 transition-all duration-200 disabled:opacity-50 whitespace-nowrap`}
                  >
                    {question.length > 35 ? question.substring(0, 35) + '...' : question}
                  </button>
                ))}
              </div>
            </div>

            <div className="pb-3">
              <p className={`text-center ${colors.textMuted} text-xs`}>
                Press Enter to send • Shift+Enter for new line • Hold mic to record
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          
          <div className={`${colors.bgCard} rounded-xl p-3 border ${colors.borderLight}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`${colors.text} font-semibold text-sm`}>Dr. Bridge</h2>
                  <p className="text-green-500 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              {patientData && (
                <div className={`flex items-center gap-2 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'} pl-2 pr-3 py-1.5 rounded-full`}>
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {patientData.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className={`${colors.text} text-xs font-medium`}>{patientData.full_name.split(' ')[0]}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => !escalated && setShowEscalationModal(true)}
              disabled={escalating || escalated}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                escalated
                  ? 'bg-green-500/20 text-green-400 cursor-default'
                  : escalating
                  ? 'bg-orange-500/20 text-orange-400 cursor-wait'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
              }`}
            >
              {escalated ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Request Sent to Clinic</span>
                </>
              ) : escalating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Connect to Doctor</span>
                </>
              )}
            </button>
          </div>

          {prescription && !isProcessingComplete && (
            <ProcessingStatus 
              status={processingStatus} 
              progress={processingProgress}
              isDark={isDark}
              onRefresh={refreshPrescriptionStatus}
              isRefreshing={isRefreshing}
              showRefreshHint={showRefreshHint}
              elapsedTime={elapsedTime}
            />
          )}

          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl rounded-br-md'
                      : message.type === 'error'
                        ? `${colors.bgMessage} ${colors.text} rounded-2xl rounded-bl-md border border-red-500/30`
                        : `${colors.bgMessage} ${colors.text} rounded-2xl rounded-bl-md border ${colors.borderLight}`
                  } px-3 py-2.5 shadow-lg`}
                >
                  {message.role === 'user' && message.type === 'question' && (
                    <p className="text-cyan-200 font-semibold text-[9px] uppercase tracking-wide mb-1">Your Question</p>
                  )}
                  {message.role === 'user' && message.type === 'upload' && (
                    <p className="text-cyan-200 font-semibold text-[9px] uppercase tracking-wide mb-1">File Upload</p>
                  )}
                  {message.role === 'user' && message.type === 'voice' && (
                    <p className="text-cyan-200 font-semibold text-[9px] uppercase tracking-wide mb-1">Voice Message</p>
                  )}
                  {message.role === 'assistant' && message.type === 'answer' && (
                    <p className="text-cyan-500 font-semibold text-[9px] uppercase tracking-wide mb-1.5">Answer to Your Question</p>
                  )}
                  
                  <div className="text-sm leading-relaxed">
                    {/* Voice Note Message */}
                    {message.type === 'voice' && message.audioUrl ? (
                      <VoiceNotePlayer
                        audioUrl={message.audioUrl}
                        duration={message.audioDuration}
                        transcription={message.transcription || message.content}
                        isUserMessage={message.role === 'user'}
                      />
                    ) : message.type === 'progress' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span className={colors.textSecondary}>{message.content}</span>
                      </div>
                    ) : message.content === '...' ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className={colors.textSecondary + ' text-xs'}>Thinking...</span>
                      </div>
                    ) : message.role === 'assistant' ? (
                      <>
                        <RenderMarkdown text={message.content} isDark={isDark} />
                        {message.audioResponseUrl && (
                          <AudioResponsePlayer audioUrl={message.audioResponseUrl} />
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  
                  <p className={`text-[9px] mt-1.5 ${message.role === 'user' ? 'text-cyan-200/70' : colors.textMuted}`}>
                    {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={`${isDark ? 'bg-slate-900/80' : 'bg-white'} rounded-xl p-3 border ${colors.borderLight}`}>
            <div className={`flex items-center gap-1 mb-2 pb-2 border-b ${colors.borderLight}`}>
              <button
                onClick={() => setShowFileModal(true)}
                disabled={isInputDisabled}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] ${colors.textSecondary} hover:text-cyan-500 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => setShowCamera(true)}
                disabled={isInputDisabled}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] ${colors.textSecondary} hover:text-cyan-500 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} rounded-lg transition-colors disabled:opacity-50`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>
            </div>
            
            <div className="flex gap-2 items-end">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask anything..."
                disabled={isInputDisabled}
                className={`flex-1 px-3 py-2 ${colors.bgInput} border ${colors.borderInput} rounded-xl ${colors.text} ${colors.placeholder} focus:outline-none focus:border-cyan-500 disabled:opacity-50 resize-none text-sm`}
                rows={1}
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              
              {/* Voice Note Recorder for Mobile */}
              <VoiceNoteRecorder
                disabled={isInputDisabled}
                onRecordingComplete={handleVoiceMessage}
                onRecordingStart={() => setIsRecording(true)}
              />
              
              <button
                onClick={() => handleSendMessage()}
                disabled={sending || !inputValue.trim() || isInputDisabled}
                className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl disabled:opacity-50 flex-shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pt-2 scrollbar-hide">
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  disabled={isInputDisabled}
                  className={`flex-shrink-0 px-2 py-1 ${colors.cyanBg} text-cyan-500 text-[10px] rounded-full border ${colors.cyanBorder} whitespace-nowrap`}
                >
                  {question.length > 25 ? question.substring(0, 25) + '...' : question}
                </button>
              ))}
            </div>
            
            <p className={`text-center ${colors.textMuted} text-[10px] mt-2`}>
              Press Enter to send • Hold mic to record
            </p>
          </div>

          <div className={`pt-4 border-t ${colors.border}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className={`${colors.text} font-semibold text-sm`}>Prescription Details</h2>
                <p className={`${colors.textSecondary} text-xs`}>AI-powered insights</p>
              </div>
            </div>
            
            {prescription && !isProcessingComplete ? (
              <div className={`${colors.bgCard} rounded-xl border ${colors.borderLight} p-6 text-center`}>
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                <p className={`${colors.text} text-sm`}>Analyzing prescription...</p>
                <p className={`${colors.textSecondary} text-xs mt-1`}>{processingProgress || 'Please wait'}</p>
                <button
                  onClick={refreshPrescriptionStatus}
                  disabled={isRefreshing}
                  className={`mt-3 px-3 py-1.5 rounded-lg text-xs ${
                    isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'
                  } disabled:opacity-50`}
                >
                  {isRefreshing ? 'Checking...' : 'Check Status'}
                </button>
              </div>
            ) : prescription ? (
              <PrescriptionDetails
                prescription={prescription}
                medicines={medicines}
                tests={tests}
                precautions={precautions}
                followUp={followUp}
                formatDate={formatDate}
                getAiSummary={getAiSummary}
                isDark={isDark}
              />
            ) : (
              <div className={`${colors.bgCard} rounded-xl border ${colors.borderLight} p-6 text-center`}>
                <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p className={`${colors.text} text-sm`}>No Prescription Yet</p>
                <p className={`${colors.textSecondary} text-xs mt-1`}>
                  Upload a prescription to see analysis
                </p>
              </div>
            )}

            <div className="text-center py-4 mt-4">
              <p className="text-green-500 text-sm font-medium">सर्वे सन्तु निरामया:</p>
              <p className="text-orange-500 text-xs mt-1">"May all be free from illness"</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}