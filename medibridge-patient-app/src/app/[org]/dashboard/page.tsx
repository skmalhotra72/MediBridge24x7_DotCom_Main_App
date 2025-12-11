'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  FileText, 
  FlaskConical, 
  MessageCircle, 
  Mic, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
  Camera,
  File
} from 'lucide-react';

interface Prescription {
  id: string;
  created_at: string;
  status: string;
  chief_complaint: string | null;
  file_url: string | null;
  doctor_name: string | null;
  total_medicines: number | null;
  total_tests: number | null;
  document_type?: string;
}

interface UploadOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  enabled: boolean;
  comingSoon?: boolean;
}

// ========================================
// Type for Organization Data
// ========================================
interface OrganizationData {
  id: string;
  name: string;
  subdomain: string;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const org = params.org as string;
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [orgName, setOrgName] = useState<string>('');
  
  // ========================================
  // NEW: Organization and Patient State
  // ========================================
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    successRate: 98
  });

  const supabase = createClient();

  // Upload options configuration
  const uploadOptions: UploadOption[] = [
    {
      id: 'prescription',
      title: "Doctor's Prescription",
      description: 'Upload your prescription for medicine analysis, dosage explanations, and precautions',
      icon: <FileText className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200 hover:border-blue-400',
      enabled: true
    },
    {
      id: 'lab_report',
      title: 'Lab Report',
      description: 'Upload your lab test results for detailed analysis and health insights',
      icon: <FlaskConical className="w-8 h-8" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      enabled: true
    },
    {
      id: 'chat',
      title: 'Chat Only',
      description: 'Ask health questions directly without uploading any documents',
      icon: <MessageCircle className="w-8 h-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-200 hover:border-purple-400',
      enabled: true
    },
    {
      id: 'voice',
      title: 'Voice Chat',
      description: 'Speak your questions and get audio responses',
      icon: <Mic className="w-8 h-8" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      borderColor: 'border-orange-200 hover:border-orange-400',
      enabled: false,
      comingSoon: true
    }
  ];

  // ========================================
  // NEW: Helper Function - Get or Create Patient
  // ========================================
  const getOrCreatePatient = async (
    userId: string,
    organizationId: string,
    userMetadata: { full_name?: string; email?: string; phone?: string }
  ): Promise<string> => {
    // First, try to find existing patient by auth_user_id and organization
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('auth_user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (existingPatient) {
      console.log('[Dashboard] Found existing patient:', existingPatient.id);
      return existingPatient.id;
    }

    // No existing patient, create one
    console.log('[Dashboard] Creating new patient record for user:', userId);
    
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({
        organization_id: organizationId,
        auth_user_id: userId,
        full_name: userMetadata?.full_name || 'Patient',
        email: userMetadata?.email,
        phone: userMetadata?.phone,
        preferred_language: 'en',
        app_onboarded: true,
        onboarding_completed_at: new Date().toISOString(),
        status: 'active'
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[Dashboard] Error creating patient:', createError);
      throw new Error('Failed to create patient record');
    }

    console.log('[Dashboard] Created new patient:', newPatient.id);
    return newPatient.id;
  };

  // ========================================
  // Fetch user, organization, patient, and prescriptions
  // ========================================
  useEffect(() => {
    async function fetchData() {
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (!user) {
          console.log('[Dashboard] No user found, redirecting to login');
          router.push(`/${org}/login`);
          return;
        }

        // ========================================
        // NEW: Get organization data (includes UUID)
        // ========================================
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, subdomain')
          .eq('subdomain', org)
          .single();

        if (orgError || !orgData) {
          console.error('[Dashboard] Organization not found:', orgError);
          // Fallback to formatted name
          const orgNameFormatted = org
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          setOrgName(orgNameFormatted);
        } else {
          console.log('[Dashboard] Organization found:', orgData.id, orgData.name);
          setOrganizationData(orgData);
          setOrgName(orgData.name);

          // ========================================
          // NEW: Get or create patient record
          // ========================================
          try {
            const resolvedPatientId = await getOrCreatePatient(
              user.id,
              orgData.id,
              {
                full_name: user.user_metadata?.full_name,
                email: user.email,
                phone: user.user_metadata?.phone
              }
            );
            setPatientId(resolvedPatientId);
            console.log('[Dashboard] Patient ID resolved:', resolvedPatientId);
          } catch (patientError) {
            console.error('[Dashboard] Patient creation error:', patientError);
            // Continue without patient_id - workflow will use fallback
          }
        }

        // Fetch prescriptions
        const { data: prescriptionData, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && prescriptionData) {
          setPrescriptions(prescriptionData);
          
          // Calculate stats
          const total = prescriptionData.length;
          const completed = prescriptionData.filter(p => 
            p.status === 'completed' || p.status === 'analyzed'
          ).length;
          const processing = prescriptionData.filter(p => 
            p.status === 'pending' || p.status === 'processing'
          ).length;
          
          setStats({
            total,
            completed,
            processing,
            successRate: total > 0 ? Math.round((completed / total) * 100) : 98
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [org, supabase, router]);

  // Handle option click
  const handleOptionClick = (option: UploadOption) => {
    if (!option.enabled) return;
    
    if (option.id === 'chat') {
      // Navigate directly to chat without document
      router.push(`/${org}/chat?mode=chat_only`);
      return;
    }
    
    setSelectedUploadType(option.id);
    setShowUploadModal(true);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  // ========================================
  // UPDATED: Handle upload and analyze
  // Now includes organization_id and patient_id
  // ========================================
  const handleUploadAndAnalyze = async () => {
    if (!uploadFile || !user || !selectedUploadType) return;
    
    setUploading(true);
    
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, uploadFile);
      
      if (uploadError) throw uploadError;
      
      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(filePath);
      
      // ========================================
      // 3. UPDATED: Create prescription record with organization_id and patient_id
      // ========================================
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: user.id,
          organization_id: organizationData?.id || null,  // NEW: Organization UUID
          patient_id: patientId || null,                   // NEW: Patient UUID
          file_url: publicUrl,
          file_type: uploadFile.type,
          chief_complaint: chiefComplaint || (selectedUploadType === 'prescription' 
            ? 'Analyze my prescription' 
            : 'Analyze my lab report'),
          status: 'pending',
          document_type: selectedUploadType,
          organization_slug: org
        })
        .select()
        .single();
      
      if (prescriptionError) throw prescriptionError;

      console.log('[Dashboard] Prescription created:', prescriptionData.id);
      
      // ========================================
      // 4. UPDATED: Trigger n8n webhook with organization_id and patient_id
      // ========================================
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
        'https://n8n.nhcare.in/webhook/28465002-1451-4336-8fc7-eb333dec1ef3';

      const webhookPayload = {
        prescription_id: prescriptionData.id,
        file_url: publicUrl,
        file_type: uploadFile.type,
        
        // User information
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email,
        user_email: user.email,
        
        // ========================================
        // KEY FIELDS - Now properly included
        // ========================================
        organization_id: organizationData?.id || null,  // NEW: UUID for database FK
        patient_id: patientId || null,                   // NEW: UUID for database FK
        organization: org,                               // Slug - kept for backward compatibility
        clinic_name: organizationData?.name || orgName,
        
        // Document and session info
        chief_complaint: chiefComplaint || (selectedUploadType === 'prescription' 
          ? 'Analyze my prescription' 
          : 'Analyze my lab report'),
        query: chiefComplaint || (selectedUploadType === 'prescription' 
          ? 'Analyze my prescription' 
          : 'Analyze my lab report'),
        channel: 'web',
        document_type: selectedUploadType,
        chat_session_id: prescriptionData.id  // Using prescription ID as session ID
      };

      console.log('[Dashboard] Sending webhook with payload:', {
        prescription_id: webhookPayload.prescription_id,
        organization_id: webhookPayload.organization_id,
        patient_id: webhookPayload.patient_id,
        document_type: webhookPayload.document_type
      });
      
      // Fire webhook directly (not through API route)
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      }).catch(err => console.error('[Dashboard] Webhook error:', err));
      
      // 5. Navigate to chat page
      router.push(`/${org}/chat?prescription_id=${prescriptionData.id}&session=${prescriptionData.id}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Close modal and reset
  const closeModal = () => {
    setShowUploadModal(false);
    setSelectedUploadType(null);
    setUploadFile(null);
    setChiefComplaint('');
  };

  // Get selected option details
  const selectedOption = uploadOptions.find(o => o.id === selectedUploadType);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MediBridge</h1>
                <p className="text-xs text-cyan-400">{orgName || 'Healthcare Intelligence'}</p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">
                Dashboard
              </button>
              <button 
                onClick={() => router.push(`/${org}/prescriptions`)}
                className="text-slate-300 hover:text-white text-sm"
              >
                Prescriptions
              </button>
              <button className="text-slate-300 hover:text-white text-sm">Profile</button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded-lg">
                <span className="text-white text-sm font-medium">
                  {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                </span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Healthcare That
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Never Sleeps
            </span>
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Your 24/7 AI-powered healthcare companion. Get instant prescription analysis, 
            medicine information, and personalized health guidance in your preferred language.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <p className="text-cyan-400 text-xs font-medium mb-1">Total Uploads</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-slate-400 text-xs">Documents analyzed</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <p className="text-green-400 text-xs font-medium mb-1">Completed</p>
            <p className="text-3xl font-bold text-white">{stats.completed}</p>
            <p className="text-slate-400 text-xs">Ready to view</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <p className="text-orange-400 text-xs font-medium mb-1">Processing</p>
            <p className="text-3xl font-bold text-white">{stats.processing}</p>
            <p className="text-slate-400 text-xs">In queue</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <p className="text-purple-400 text-xs font-medium mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-white">{stats.successRate}%</p>
            <p className="text-slate-400 text-xs">Accuracy score</p>
          </div>
        </div>

        {/* Upload Options - 4 Cards */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full">
              AI Ready • 8+ Languages
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">How can we help you today?</h3>
          <p className="text-slate-400 mb-8">
            Choose an option below to get started with your health query
          </p>

          {/* 4 Option Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {uploadOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                disabled={!option.enabled}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left
                  ${option.enabled 
                    ? `${option.bgColor} ${option.borderColor} cursor-pointer transform hover:scale-[1.02]` 
                    : 'bg-slate-800/50 border-slate-700 cursor-not-allowed opacity-60'
                  }`}
              >
                {option.comingSoon && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                )}
                <div className={`${option.color} mb-4`}>
                  {option.icon}
                </div>
                <h4 className={`font-semibold mb-2 ${option.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                  {option.title}
                </h4>
                <p className={`text-sm ${option.enabled ? 'text-slate-600' : 'text-slate-500'}`}>
                  {option.description}
                </p>
                {option.enabled && !option.comingSoon && (
                  <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${option.color}`}>
                    Get Started <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {prescriptions.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {prescriptions.slice(0, 5).map((prescription) => (
                <button
                  key={prescription.id}
                  onClick={() => router.push(`/${org}/chat?prescription_id=${prescription.id}&session=${prescription.id}`)}
                  className="w-full flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      prescription.document_type === 'lab_report' 
                        ? 'bg-emerald-500/20' 
                        : 'bg-blue-500/20'
                    }`}>
                      {prescription.document_type === 'lab_report' 
                        ? <FlaskConical className="w-5 h-5 text-emerald-400" />
                        : <FileText className="w-5 h-5 text-blue-400" />
                      }
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {prescription.chief_complaint || 'Document Analysis'}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(prescription.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {prescription.status === 'completed' || prescription.status === 'analyzed' ? (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Analyzed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-400 text-sm">
                        <Clock className="w-4 h-4" /> Processing
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && selectedOption && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`p-6 border-b ${selectedOption.bgColor.replace('hover:bg-', '')}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={selectedOption.color}>
                    {selectedOption.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Upload {selectedOption.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {selectedUploadType === 'prescription' 
                        ? 'Get medicine analysis and dosage guidance'
                        : 'Get detailed lab result interpretation'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* File Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
                  ${dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : uploadFile 
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
              >
                {uploadFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="font-medium text-slate-800">{uploadFile.name}</p>
                    <p className="text-sm text-slate-500">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        Drag & drop your file here
                      </p>
                      <p className="text-sm text-slate-500">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <label
                        htmlFor="file-upload"
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 cursor-pointer transition-colors"
                      >
                        <File className="w-4 h-4 inline mr-2" />
                        Browse Files
                      </label>
                      <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                        <Camera className="w-4 h-4 inline mr-2" />
                        Take Photo
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Supported: PDF, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Question/Concern Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What would you like to know? (Optional)
                </label>
                <textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder={selectedUploadType === 'prescription'
                    ? "e.g., Explain my medicines and their side effects..."
                    : "e.g., Are my test results normal? What should I be concerned about?"
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleUploadAndAnalyze}
                disabled={!uploadFile || uploading}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all
                  ${!uploadFile || uploading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : selectedUploadType === 'prescription'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600'
                  }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Analyze {selectedUploadType === 'prescription' ? 'Prescription' : 'Lab Report'}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}