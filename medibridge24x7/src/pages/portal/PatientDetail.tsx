import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Stethoscope,
  FileText,
  MessageSquare,
  FlaskConical,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Pill,
  Activity,
  Heart,
  RefreshCw
} from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface PatientDetails {
  patient: {
    id: string;
    full_name: string;
    gender: string | null;
    age: number | null;
    date_of_birth: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    blood_group: string | null;
    known_allergies: string[] | null;
    chronic_conditions: string[] | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    created_at: string;
    last_visit_date: string | null;
    total_visits: number;
  };
  consultations: Array<{
    id: string;
    consultation_date: string;
    time_slot: string | null;
    consultation_type: string | null;
    consultation_status: string | null;
    is_followup: boolean | null;
    doctor_id: string | null;
    chief_complaint: string | null;
    diagnosis_summary: string | null;
    notes: string | null;
  }>;
  prescriptions: Array<{
    id: string;
    created_at: string;
    processing_status: string | null;
    status: string | null;
    total_medicines: number | null;
    total_tests: number | null;
    doctor_name: string | null;
    clinic_name: string | null;
    ai_summary: string | null;
    file_url: string | null;
  }>;
  lab_orders: Array<{
    id: string;
    order_date: string;
    status: string | null;
    report_status: string | null;
    booking_type: string | null;
    total_amount: number | null;
    test_ids: any;
  }>;
  chat_history: Array<{
    session_id: string;
    created_at: string;
    status: string | null;
    summary: string | null;
    chat_summary: string | null;
    message_count: number | null;
    prescription_id: string | null;
    topics: string[] | null;
  }>;
  comprehensive_analysis: {
    id: string;
    analysis_content: string;
    key_findings: any;
    recommendations: any;
    generated_at: string;
    version: number;
    status: string;
  } | null;
  escalations: Array<{
    id: string;
    created_at: string;
    severity: string | null;
    status: string | null;
    reason: string | null;
  }>;
}

type TabType = 'consultations' | 'prescriptions' | 'chats' | 'lab_orders' | 'escalations';

// ============================================
// TAB BUTTON COMPONENT
// ============================================

function TabButton({ 
  active, 
  onClick, 
  children, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all
        ${active 
          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}
      `}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
          active ? 'bg-teal-500/30' : 'bg-slate-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================
// INFO CARD COMPONENT
// ============================================

function InfoCard({ icon: Icon, label, value, color = 'slate' }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number | null;
  color?: string;
}) {
  if (!value) return null;
  
  const colorClasses: Record<string, string> = {
    slate: 'text-slate-400',
    teal: 'text-teal-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30">
      <Icon className={`w-4 h-4 ${colorClasses[color]} mt-0.5 flex-shrink-0`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

// ============================================
// CONSULTATION CARD COMPONENT
// ============================================

function ConsultationCard({ consultation }: { consultation: PatientDetails['consultations'][0] }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-teal-400" />
          <span className="text-white font-medium">{formatDate(consultation.consultation_date)}</span>
          {consultation.time_slot && (
            <span className="text-slate-500 text-sm">at {consultation.time_slot}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {consultation.is_followup && (
            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
              Follow-up
            </span>
          )}
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            consultation.consultation_status === 'completed' ? 'bg-green-500/20 text-green-400' :
            consultation.consultation_status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
            consultation.consultation_status === 'confirmed' ? 'bg-teal-500/20 text-teal-400' :
            consultation.consultation_status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {consultation.consultation_status || 'Pending'}
          </span>
        </div>
      </div>
      
      {consultation.chief_complaint && (
        <p className="text-sm text-slate-400 mb-2">
          <span className="text-slate-500">Chief Complaint:</span> {consultation.chief_complaint}
        </p>
      )}
      
      {consultation.diagnosis_summary && (
        <p className="text-sm text-slate-400">
          <span className="text-slate-500">Diagnosis:</span> {consultation.diagnosis_summary}
        </p>
      )}
      
      {consultation.consultation_type && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-500">
          <span className="capitalize">{consultation.consultation_type.replace('_', ' ')}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// PRESCRIPTION CARD COMPONENT
// ============================================

function PrescriptionCard({ prescription, orgSubdomain }: { prescription: PatientDetails['prescriptions'][0]; orgSubdomain?: string }) {
  const navigate = useNavigate();
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewDetails = () => {
    // Navigate to prescription chat page on patient app (port 3000)
    const patientAppUrl = import.meta.env.VITE_PATIENT_APP_URL || 'http://localhost:3000';
    window.open(`${patientAppUrl}/${orgSubdomain}/chat?prescription_id=${prescription.id}`, '_blank');
  };

  return (
    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">{formatDate(prescription.created_at)}</span>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          prescription.status === 'analyzed' || prescription.processing_status === 'completed' 
            ? 'bg-green-500/20 text-green-400' :
          prescription.processing_status === 'processing' 
            ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          {prescription.status || prescription.processing_status || 'Pending'}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1 text-sm">
          <Pill className="w-3 h-3 text-green-400" />
          <span className="text-white">{prescription.total_medicines || 0}</span>
          <span className="text-slate-500">medicines</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <FlaskConical className="w-3 h-3 text-purple-400" />
          <span className="text-white">{prescription.total_tests || 0}</span>
          <span className="text-slate-500">tests</span>
        </div>
      </div>

      {prescription.ai_summary && (
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
          {prescription.ai_summary}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        {prescription.doctor_name && (
          <span className="text-xs text-slate-500">Dr. {prescription.doctor_name}</span>
        )}
        <button 
          onClick={handleViewDetails}
          className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
        >
          <ExternalLink className="w-3 h-3" />
          View Details
        </button>
      </div>
    </div>
  );
}

// ============================================
// CHAT SESSION CARD COMPONENT
// ============================================

function ChatCard({ chat }: { chat: PatientDetails['chat_history'][0] }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">{formatDate(chat.created_at)}</span>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          chat.status === 'active' ? 'bg-green-500/20 text-green-400' :
          chat.status === 'ended' ? 'bg-slate-500/20 text-slate-400' :
          chat.status === 'escalated' ? 'bg-orange-500/20 text-orange-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {chat.status || 'Unknown'}
        </span>
      </div>

      {(chat.summary || chat.chat_summary) && (
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
          {chat.chat_summary || chat.summary}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 text-xs text-slate-500">
        <span>{chat.message_count || 0} messages</span>
        {chat.topics && chat.topics.length > 0 && (
          <div className="flex items-center gap-1">
            {chat.topics.slice(0, 2).map((topic, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded-full">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// LAB ORDER CARD COMPONENT
// ============================================

function LabOrderCard({ order }: { order: PatientDetails['lab_orders'][0] }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const testCount = Array.isArray(order.test_ids) ? order.test_ids.length : 0;

  return (
    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-400" />
          <span className="text-white font-medium">{formatDate(order.order_date)}</span>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
          order.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
          order.status === 'sample_collected' ? 'bg-blue-500/20 text-blue-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          {order.status || 'Pending'}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <span className="text-sm text-slate-400">{testCount} test(s)</span>
        {order.booking_type && (
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            order.booking_type === 'home_collection' ? 'bg-purple-500/20 text-purple-400' :
            'bg-teal-500/20 text-teal-400'
          }`}>
            {order.booking_type === 'home_collection' ? 'Home Collection' : 'In-Clinic'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 text-xs">
        {order.total_amount ? (
          <span className="text-white">₹{order.total_amount.toLocaleString()}</span>
        ) : (
          <span className="text-slate-500">Amount TBD</span>
        )}
        {order.report_status && (
          <span className={`px-2 py-0.5 rounded-full ${
            order.report_status === 'ready' ? 'bg-green-500/20 text-green-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            Report: {order.report_status}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// ESCALATION CARD COMPONENT
// ============================================

function EscalationCard({ escalation }: { escalation: PatientDetails['escalations'][0] }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-4 rounded-xl border transition-colors ${
      escalation.severity === 'critical' || escalation.severity === 'high'
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-slate-800/30 border-slate-700/50'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${
            escalation.severity === 'critical' ? 'text-red-400' :
            escalation.severity === 'high' ? 'text-orange-400' :
            'text-yellow-400'
          }`} />
          <span className="text-white font-medium">{formatDate(escalation.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            escalation.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
            escalation.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
            escalation.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {escalation.severity || 'medium'}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            escalation.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
            escalation.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {escalation.status || 'open'}
          </span>
        </div>
      </div>

      {escalation.reason && (
        <p className="text-sm text-slate-400">{escalation.reason}</p>
      )}
    </div>
  );
}

// ============================================
// MAIN PATIENT DETAIL COMPONENT
// ============================================

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, organization } = useAuthStore();

  const [details, setDetails] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('consultations');
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  const fetchPatientDetails = async () => {
    if (!id || !organization?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_patient_details', {
        patient_uuid: id,
        org_id: organization.id
      });

      if (!error && data) {
        setDetails(data as PatientDetails);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [id, organization?.id]);

  const handleGenerateAnalysis = async () => {
    if (!details?.patient || !organization?.id || !user?.id) {
      alert('Missing required information. Please try again.');
      return;
    }

    setGeneratingAnalysis(true);
    
    try {
      const webhookUrl = import.meta.env.VITE_N8N_ANALYSIS_WEBHOOK_URL || 
        'https://n8n.nhcare.in/webhook/patient-comprehensive-analysis';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: details.patient.id,
          org_id: organization.id,
          requested_by: 'clinic_staff',
          requester_id: user.id,
          requester_name: user.email || 'Clinic Staff',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh patient details to show the new analysis
        await fetchPatientDetails();
        alert('✅ Comprehensive analysis generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate analysis');
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      alert('❌ Failed to generate analysis. Please try again.');
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-slate-800 rounded" />
        <div className="h-48 bg-slate-800 rounded-2xl" />
        <div className="h-64 bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!details || !details.patient) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">Patient not found</p>
        <button
          onClick={() => navigate('/portal/patients')}
          className="mt-4 text-teal-400 hover:text-teal-300"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  const { patient, consultations, prescriptions, lab_orders, chat_history, comprehensive_analysis, escalations } = details;

  const fullAddress = [patient.address_line1, patient.address_line2, patient.city, patient.state, patient.pincode]
    .filter(Boolean)
    .join(', ') || patient.address;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/portal/patients')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Patients</span>
      </button>

      {/* Patient Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-slate-700/50 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/25">
              {patient.full_name?.charAt(0) || 'P'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{patient.full_name}</h1>
              <p className="text-slate-400">
                {patient.gender || 'N/A'} • {patient.age ? `${patient.age} years` : 'Age N/A'}
                {patient.blood_group && ` • Blood: ${patient.blood_group}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Registered: {new Date(patient.created_at).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 lg:justify-end">
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className="text-2xl font-bold text-white">{patient.total_visits || 0}</p>
              <p className="text-xs text-slate-500">Total Visits</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className="text-2xl font-bold text-white">{prescriptions?.length || 0}</p>
              <p className="text-xs text-slate-500">Prescriptions</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className="text-2xl font-bold text-white">{chat_history?.length || 0}</p>
              <p className="text-xs text-slate-500">Chat Sessions</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className="text-2xl font-bold text-white">{lab_orders?.length || 0}</p>
              <p className="text-xs text-slate-500">Lab Orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info */}
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
            <h3 className="text-white font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              <InfoCard icon={Phone} label="Phone" value={patient.phone} color="teal" />
              <InfoCard icon={Mail} label="Email" value={patient.email} color="blue" />
              <InfoCard icon={MapPin} label="Address" value={fullAddress} color="purple" />
            </div>
          </div>

          {/* Medical Info */}
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
            <h3 className="text-white font-semibold mb-4">Medical Information</h3>
            <div className="space-y-3">
              {patient.known_allergies && patient.known_allergies.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 mb-1">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.known_allergies.map((allergy, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded-full">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400 mb-1">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.chronic_conditions.map((condition, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded-full">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!patient.known_allergies?.length && !patient.chronic_conditions?.length && (
                <p className="text-sm text-slate-500">No medical information recorded</p>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.emergency_contact_name && (
            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
              <h3 className="text-white font-semibold mb-4">Emergency Contact</h3>
              <div className="space-y-3">
                <InfoCard icon={User} label="Name" value={patient.emergency_contact_name} />
                <InfoCard icon={Phone} label="Phone" value={patient.emergency_contact_phone} />
              </div>
            </div>
          )}

          {/* Generate Analysis Button */}
          <button
            onClick={handleGenerateAnalysis}
            disabled={generatingAnalysis}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {generatingAnalysis ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Comprehensive Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column - History Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            <TabButton 
              active={activeTab === 'consultations'} 
              onClick={() => setActiveTab('consultations')}
              count={consultations?.length}
            >
              <Stethoscope className="w-4 h-4" />
              Consultations
            </TabButton>
            <TabButton 
              active={activeTab === 'prescriptions'} 
              onClick={() => setActiveTab('prescriptions')}
              count={prescriptions?.length}
            >
              <FileText className="w-4 h-4" />
              Prescriptions
            </TabButton>
            <TabButton 
              active={activeTab === 'chats'} 
              onClick={() => setActiveTab('chats')}
              count={chat_history?.length}
            >
              <MessageSquare className="w-4 h-4" />
              Chat History
            </TabButton>
            <TabButton 
              active={activeTab === 'lab_orders'} 
              onClick={() => setActiveTab('lab_orders')}
              count={lab_orders?.length}
            >
              <FlaskConical className="w-4 h-4" />
              Lab Orders
            </TabButton>
            <TabButton 
              active={activeTab === 'escalations'} 
              onClick={() => setActiveTab('escalations')}
              count={escalations?.length}
            >
              <AlertTriangle className="w-4 h-4" />
              Escalations
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'consultations' && (
              consultations?.length > 0 ? (
                consultations.map((c) => <ConsultationCard key={c.id} consultation={c} />)
              ) : (
                <div className="text-center py-8 text-slate-500 rounded-2xl bg-slate-800/20 border border-slate-700/50">
                  No consultations found
                </div>
              )
            )}

            {activeTab === 'prescriptions' && (
              prescriptions?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescriptions.map((p) => (
                    <PrescriptionCard 
                      key={p.id} 
                      prescription={p} 
                      orgSubdomain={organization?.subdomain}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 rounded-2xl bg-slate-800/20 border border-slate-700/50">
                  No prescriptions found
                </div>
              )
            )}

            {activeTab === 'chats' && (
              chat_history?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chat_history.map((c) => <ChatCard key={c.session_id} chat={c} />)}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 rounded-2xl bg-slate-800/20 border border-slate-700/50">
                  No chat history found
                </div>
              )
            )}

            {activeTab === 'lab_orders' && (
              lab_orders?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lab_orders.map((o) => <LabOrderCard key={o.id} order={o} />)}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 rounded-2xl bg-slate-800/20 border border-slate-700/50">
                  No lab orders found
                </div>
              )
            )}

            {activeTab === 'escalations' && (
              escalations?.length > 0 ? (
                <div className="space-y-4">
                  {escalations.map((e) => <EscalationCard key={e.id} escalation={e} />)}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 rounded-2xl bg-slate-800/20 border border-slate-700/50">
                  No escalations found
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      {comprehensive_analysis && (
        <div className="rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI-Generated Comprehensive Analysis</h3>
              <p className="text-xs text-slate-500">
                Generated: {new Date(comprehensive_analysis.generated_at).toLocaleDateString('en-IN')} • 
                Version {comprehensive_analysis.version}
              </p>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none text-sm text-slate-300 whitespace-pre-wrap">
            {comprehensive_analysis.analysis_content}
          </div>
        </div>
      )}
    </div>
  );
}