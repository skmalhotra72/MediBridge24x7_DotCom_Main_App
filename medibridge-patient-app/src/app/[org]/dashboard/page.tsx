'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, FileText, FlaskConical, MessageCircle, Mic, Upload, Camera, X, Check, Loader2, User, Sparkles, LogOut } from 'lucide-react';
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

// ============================================================
// SERVICE CARDS COMPONENT
// ============================================================

const ServiceCards = ({ 
  onPrescriptionClick, 
  onLabReportClick, 
  onChatClick 
}: {
  onPrescriptionClick: () => void;
  onLabReportClick: () => void;
  onChatClick: () => void;
}) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-medium mb-4">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
        AI Ready • 8+ Languages
      </div>
      
      <h2 className="text-white text-xl font-bold mb-2">How can we help you today?</h2>
      <p className="text-slate-400 text-sm mb-6">Choose an option below to get started with your health query</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Doctor's Prescription - Sky Blue */}
        <button
          onClick={onPrescriptionClick}
          className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 
                     border border-cyan-500/30 hover:border-cyan-400/60
                     rounded-xl p-5 text-left transition-all duration-300
                     hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02]"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl 
                          flex items-center justify-center mb-4 
                          group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-cyan-400 font-semibold text-base mb-2">Doctor's Prescription</h3>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            Upload your prescription for medicine analysis, dosage explanations, and precautions
          </p>
          <span className="inline-flex items-center text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
            Get Started 
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Lab Report - Orange */}
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

        {/* Chat Only - Neon Green */}
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

        {/* Voice Chat - Purple (Coming Soon) */}
        <div className="group relative bg-gradient-to-br from-purple-500/5 to-violet-500/5 
                        border border-purple-500/20 rounded-xl p-5 text-left opacity-60">
          <div className="absolute top-3 right-3">
            <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-medium">
              Coming Soon
            </span>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400/50 to-violet-500/50 rounded-xl 
                          flex items-center justify-center mb-4">
            <Mic className="w-6 h-6 text-white/70" />
          </div>
          <h3 className="text-purple-400/70 font-semibold text-base mb-2">Voice Chat</h3>
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
}

const UploadModal = ({ isOpen, onClose, onSubmit, isUploading, type, selectedPatient }: UploadModalProps) => {
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
  const themeColor = isPrescription ? 'cyan' : 'orange';
  const gradientFrom = isPrescription ? 'from-cyan-400' : 'from-orange-400';
  const gradientTo = isPrescription ? 'to-blue-500' : 'to-amber-500';
  const borderColor = isPrescription ? 'border-cyan-500/30' : 'border-orange-500/30';
  const shadowColor = isPrescription ? 'shadow-cyan-500/10' : 'shadow-orange-500/10';
  const headerGradient = isPrescription 
    ? 'from-cyan-500/20 to-blue-500/20' 
    : 'from-orange-500/20 to-amber-500/20';
  const headerBorder = isPrescription ? 'border-cyan-500/20' : 'border-orange-500/20';
  const textColor = isPrescription ? 'text-cyan-300' : 'text-orange-300';
  const iconBg = isPrescription ? 'bg-cyan-500/20' : 'bg-orange-500/20';
  const iconColor = isPrescription ? 'text-cyan-400' : 'text-orange-400';
  const focusRing = isPrescription ? 'focus:ring-cyan-500/50 focus:border-cyan-500' : 'focus:ring-orange-500/50 focus:border-orange-500';
  const buttonGradient = isPrescription 
    ? 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25' 
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
              <div className={`w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center`}>
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
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm">Patient:</span>
              <span className="text-white text-sm font-medium">{selectedPatient.full_name}</span>
              {selectedPatient.gender && (
                <span className="text-blue-400 text-xs">({selectedPatient.gender})</span>
              )}
              {selectedPatient.age && (
                <span className="text-blue-400 text-xs">{selectedPatient.age}Y</span>
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
                          ? `border-${themeColor}-400 bg-${themeColor}-500/10` 
                          : file 
                            ? 'border-green-400 bg-green-500/10' 
                            : `border-slate-600 hover:border-${themeColor}-400/50 bg-slate-800/50`
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
            <label className="block text-slate-300 text-sm font-medium mb-2">
              What would you like to know? <span className="text-slate-500">(Optional)</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={isPrescription 
                ? "e.g., Explain my medicines and their side effects..." 
                : "e.g., Are my test results normal? What should I be concerned about?"}
              rows={3}
              className={`w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white 
                         placeholder-slate-500 text-sm resize-none
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

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Get organization
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('subdomain', org)
          .single();
        
        if (orgData) {
          setOrgName(orgData.name);
          setOrgId(orgData.id);
        }

        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/${org}/auth`);
          return;
        }
        setUserId(user.id);
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'User');

        // Auto-load primary patient (self) for Health Summary
        const { data: primaryPatient } = await supabase
          .from('patients')
          .select('*')
          .eq('auth_user_id', user.id)
          .eq('relationship', 'self')
          .single();

        if (primaryPatient) {
          setSelectedPatient(primaryPatient as Patient);
        } else {
          // If no "self" patient, get the first patient linked to this user
          const { data: anyPatient } = await supabase
            .from('patients')
            .select('*')
            .eq('auth_user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
          
          if (anyPatient) {
            setSelectedPatient(anyPatient as Patient);
          }
        }

        // Get prescriptions
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
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [org, router, supabase]);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${org}/auth`);
  };

  // Handle action that requires patient selection
  const handleActionWithPatient = (action: 'prescription' | 'lab' | 'chat') => {
    setPendingAction(action);
    setShowPatientSelector(true);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
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
          user_id: user.id,
          organization_id: orgId,
          patient_id: selectedPatient.id,  // Link to selected patient
          file_url: publicUrl,
          file_type: file.type,
          chief_complaint: question || 'Please analyze this document',
          status: 'pending',
          document_type: documentType,
          patient_name: selectedPatient.full_name,  // Store for easy access
          patient_gender: selectedPatient.gender,
          patient_age: selectedPatient.age ? `${selectedPatient.age}` : null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send to n8n webhook
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
        'https://n8n.nhcare.in/webhook/28465002-1451-4336-8fc7-eb333dec1ef3';

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: prescription.id,
          file_url: publicUrl,
          file_type: file.type,
          user_id: user.id,
          user_name: user.user_metadata?.name || 'User',
          user_email: user.email,
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
          chat_session_id: prescription.id
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
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
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
                onClick={() => setShowPatientSelector(true)}
                className="hidden sm:flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 
                         rounded-full px-3 py-1.5 hover:bg-blue-500/30 transition-colors"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">{selectedPatient.full_name}</span>
                <span className="text-blue-400/70 text-xs">Change</span>
              </button>
            )}
            
            <button className="text-cyan-400 text-sm font-medium">Dashboard</button>
            <button 
              onClick={() => router.push(`/${org}/prescriptions`)}
              className="text-slate-400 hover:text-white text-sm"
            >
              Prescriptions
            </button>
            <button className="text-slate-400 hover:text-white text-sm">Profile</button>
            
            {/* User Info & Logout */}
            <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-700">
              <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-emerald-300 text-sm font-medium hidden sm:inline">{userName}</span>
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
          <h2 className="text-4xl font-bold text-cyan-400 mb-4">
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
            <p className="text-cyan-400 text-xs font-medium mb-1">Total Uploads</p>
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
            <p className="text-purple-400 text-xs font-medium mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-white">{stats.accuracy}%</p>
            <p className="text-slate-500 text-xs">Accuracy score</p>
          </div>
        </div>

        {/* Service Cards - Now require patient selection first */}
        <ServiceCards
          onPrescriptionClick={() => handleActionWithPatient('prescription')}
          onLabReportClick={() => handleActionWithPatient('lab')}
          onChatClick={() => handleActionWithPatient('chat')}
        />

        {/* ============================================================ */}
        {/* PATIENT HEALTH SUMMARY - Shows automatically for logged-in user */}
        {/* ============================================================ */}
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
                        : 'bg-cyan-500/20'
                    }`}>
                      {prescription.document_type === 'lab_report' ? (
                        <FlaskConical className={`w-5 h-5 text-orange-400`} />
                      ) : (
                        <FileText className={`w-5 h-5 text-cyan-400`} />
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

      {/* Patient Selector Modal */}
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

      {/* Upload Modals */}
      <UploadModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onSubmit={(file, question) => handleUpload(file, question, 'prescription')}
        isUploading={isUploading}
        type="prescription"
        selectedPatient={selectedPatient}
      />

      <UploadModal
        isOpen={showLabReportModal}
        onClose={() => setShowLabReportModal(false)}
        onSubmit={(file, question) => handleUpload(file, question, 'lab_report')}
        isUploading={isUploading}
        type="lab"
        selectedPatient={selectedPatient}
      />
    </div>
  );
}