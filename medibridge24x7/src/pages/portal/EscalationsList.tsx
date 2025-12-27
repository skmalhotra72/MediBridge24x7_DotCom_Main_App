import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import {
  Search,
  Calendar,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MessageSquare,
  X,
  Phone,
  Sparkles,
  Eye,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Timer,
  PhoneCall,
  UserCheck
} from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Escalation {
  id: string;
  created_at: string;
  chat_session_id: string | null;
  escalation_type: string | null;
  severity: string | null;
  status: string | null;
  priority: string | null;
  reason: string | null;
  escalation_summary: string | null;
  ai_recommendation: string | null;
  response_deadline: string | null;
  responded_at: string | null;
  assigned_to: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  clinic_name: string | null;
  patient: {
    id: string;
    name: string;
    gender: string | null;
    age: number | null;
    phone: string | null;
    email?: string | null;
  } | null;
  chat_session: {
    id: string;
    status: string | null;
    summary: string | null;
    chat_summary: string | null;
    prescription_id?: string | null;
  } | null;
}

interface EscalationListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: Escalation[];
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
}

// ============================================
// SEVERITY BADGE COMPONENT
// ============================================

function SeverityBadge({ severity, size = 'sm' }: { severity: string | null; size?: 'sm' | 'md' }) {
  const config: Record<string, { bg: string; text: string; border: string; icon: any; pulse: boolean }> = {
    critical: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: AlertOctagon,
      pulse: true
    },
    high: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      icon: AlertTriangle,
      pulse: false
    },
    medium: {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      icon: AlertCircle,
      pulse: false
    },
    low: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      icon: AlertCircle,
      pulse: false
    }
  };

  const severityKey = (severity || 'low').toLowerCase();
  const { bg, text, border, icon: Icon, pulse } = config[severityKey] || config.low;

  const sizeClasses = size === 'md' 
    ? 'px-3 py-1.5 text-sm' 
    : 'px-2.5 py-1 text-xs';

  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full ${bg} ${text} border ${border} ${sizeClasses}`}>
      <Icon className={`${iconSize} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="font-medium capitalize">{severity || 'Unknown'}</span>
    </div>
  );
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

function StatusBadge({ status, size = 'sm' }: { status: string | null; size?: 'sm' | 'md' }) {
  const config: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    open: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    resolved: { bg: 'bg-green-500/20', text: 'text-green-400' },
    closed: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };

  const statusKey = (status || 'pending').toLowerCase();
  const { bg, text } = config[statusKey] || config.pending;

  const sizeClasses = size === 'md' 
    ? 'px-3 py-1.5 text-sm' 
    : 'px-2 py-0.5 text-xs';

  return (
    <span className={`rounded-full ${bg} ${text} ${sizeClasses} capitalize`}>
      {status?.replace('_', ' ') || 'Pending'}
    </span>
  );
}

// ============================================
// DEADLINE TIMER COMPONENT
// ============================================

interface DeadlineTimerProps {
  deadline: string | null;
  status: string | null;
}

function DeadlineTimer({ deadline, status }: DeadlineTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical' | 'overdue'>('normal');

  useEffect(() => {
    if (!deadline || status === 'resolved' || status === 'closed') {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diffMs = deadlineDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setUrgency('overdue');
        const overdueMs = Math.abs(diffMs);
        const overdueMins = Math.floor(overdueMs / 60000);
        const overdueHours = Math.floor(overdueMins / 60);
        if (overdueHours > 0) {
          setTimeLeft(`${overdueHours}h ${overdueMins % 60}m overdue`);
        } else {
          setTimeLeft(`${overdueMins}m overdue`);
        }
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;

      if (diffMins <= 30) {
        setUrgency('critical');
      } else if (diffMins <= 60) {
        setUrgency('warning');
      } else {
        setUrgency('normal');
      }

      if (diffHours > 0) {
        setTimeLeft(`${diffHours}h ${remainingMins}m left`);
      } else {
        setTimeLeft(`${remainingMins}m left`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [deadline, status]);

  if (!timeLeft) return null;

  const urgencyStyles = {
    normal: 'bg-slate-700/50 text-slate-300',
    warning: 'bg-orange-500/20 text-orange-400 animate-pulse',
    critical: 'bg-red-500/20 text-red-400 animate-pulse',
    overdue: 'bg-red-600/30 text-red-300 border border-red-500/50'
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${urgencyStyles[urgency]}`}>
      <Timer className="w-3 h-3" />
      <span>{timeLeft}</span>
    </div>
  );
}

// ============================================
// QUICK RESOLVE MODAL COMPONENT
// ============================================

interface QuickResolveModalProps {
  escalation: Escalation | null;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isLoading: boolean;
}

function QuickResolveModal({ escalation, onClose, onConfirm, isLoading }: QuickResolveModalProps) {
  const [notes, setNotes] = useState('');

  if (!escalation) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Resolve Escalation</h3>
              <p className="text-sm text-slate-400">
                For {escalation.patient?.name || 'patient'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Resolution Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Spoke with patient, issue resolved..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
            rows={3}
          />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ASSIGN MODAL COMPONENT
// ============================================

interface AssignModalProps {
  escalation: Escalation | null;
  doctors: Doctor[];
  onClose: () => void;
  onConfirm: (doctorId: string) => void;
  isLoading: boolean;
}

function AssignModal({ escalation, doctors, onClose, onConfirm, isLoading }: AssignModalProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Reset selection when modal opens
  useEffect(() => {
    if (escalation) {
      setSelectedDoctorId('');
    }
  }, [escalation]);

  if (!escalation) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Assign Escalation</h3>
              <p className="text-sm text-slate-400">
                For {escalation.patient?.name || 'patient'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Doctor
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">-- Select a doctor --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name} {doctor.specialization ? `(${doctor.specialization})` : ''}
              </option>
            ))}
          </select>

          {/* Selected Doctor Preview */}
          {selectedDoctorId && (
            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <p className="text-sm text-purple-300">
                <span className="font-medium">Assigning to:</span>{' '}
                {doctors.find(d => d.id === selectedDoctorId)?.full_name}
              </p>
              {doctors.find(d => d.id === selectedDoctorId)?.specialization && (
                <p className="text-xs text-purple-400 mt-1">
                  {doctors.find(d => d.id === selectedDoctorId)?.specialization}
                </p>
              )}
            </div>
          )}

          {doctors.length === 0 && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-yellow-400">
                No doctors available. Please add doctors to your organization first.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedDoctorId && onConfirm(selectedDoctorId)}
            disabled={isLoading || !selectedDoctorId}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            Assign Doctor
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ESCALATION DETAIL MODAL
// ============================================

interface EscalationDetailModalProps {
  escalation: Escalation;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
}

function EscalationDetailModal({ escalation, onClose, onStatusUpdate }: EscalationDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('escalations')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', escalation.id);

      if (!error) {
        onStatusUpdate(escalation.id, newStatus);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleViewChat = () => {
    if (escalation.chat_session_id) {
      navigate(`/portal/chat?session=${escalation.chat_session_id}`);
    }
  };

  const handleViewPatient = () => {
    if (escalation.patient?.id) {
      navigate(`/portal/patients/${escalation.patient.id}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Escalation Details</h2>
              <p className="text-sm text-slate-400">ID: {escalation.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status & Severity */}
          <div className="flex items-center gap-3 flex-wrap">
            <SeverityBadge severity={escalation.severity} size="md" />
            <StatusBadge status={escalation.status} size="md" />
            <DeadlineTimer deadline={escalation.response_deadline} status={escalation.status} />
            <span className="text-sm text-slate-500">
              <Clock className="w-4 h-4 inline mr-1" />
              {formatDate(escalation.created_at)}
            </span>
          </div>

          {/* Patient's Reason - Highlighted */}
          {escalation.reason && (
            <div className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <h3 className="text-sm font-medium text-cyan-400 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Patient's Reason
              </h3>
              <p className="text-cyan-100 text-base leading-relaxed">
                "{escalation.reason}"
              </p>
            </div>
          )}

          {/* Summary */}
          {escalation.escalation_summary && escalation.escalation_summary !== escalation.reason && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Escalation Summary</h3>
              <p className="text-white">
                {escalation.escalation_summary}
              </p>
            </div>
          )}

          {/* Patient Information */}
          {escalation.patient && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Patient Information
                </h3>
                <button
                  onClick={handleViewPatient}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View Profile
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-lg font-semibold">
                  {escalation.patient.name?.charAt(0) || 'P'}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{escalation.patient.name}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                    {escalation.patient.gender && (
                      <span>{escalation.patient.gender}</span>
                    )}
                    {escalation.patient.age && (
                      <span>{escalation.patient.age} years</span>
                    )}
                    {escalation.patient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {escalation.patient.phone}
                      </span>
                    )}
                    {escalation.patient.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {escalation.patient.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Doctor */}
          {escalation.doctor_name && (
            <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
              <h3 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Assigned Doctor
              </h3>
              <p className="text-purple-100">Dr. {escalation.doctor_name}</p>
            </div>
          )}

          {/* AI Recommendation */}
          {escalation.ai_recommendation && (
            <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
              <h3 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Recommendation
              </h3>
              <p className="text-slate-300">{escalation.ai_recommendation}</p>
            </div>
          )}

          {/* Chat Context */}
          {escalation.chat_session && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat Context
                </h3>
                <button
                  onClick={handleViewChat}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View Chat
                </button>
              </div>
              <p className="text-slate-300">
                {escalation.chat_session.chat_summary || escalation.chat_session.summary || 'No chat summary available'}
              </p>
            </div>
          )}

          {/* Type & Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Escalation Type</h3>
              <p className="text-white capitalize">
                {escalation.escalation_type?.replace('_', ' ') || 'General'}
              </p>
            </div>
            {escalation.doctor_name && (
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <h3 className="text-sm font-medium text-slate-400 mb-1">Assigned Doctor</h3>
                <p className="text-white">Dr. {escalation.doctor_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Update Status:</span>
              <select
                value={escalation.status || 'pending'}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              {updating && <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />}
            </div>
            <div className="flex items-center gap-3">
              {escalation.patient?.phone && (
                <a
                  href={`tel:${escalation.patient.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Patient
                </a>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ESCALATION CARD COMPONENT (ENHANCED)
// ============================================

interface EscalationCardProps {
  escalation: Escalation;
  onClick: () => void;
  onQuickResolve: (escalation: Escalation) => void;
  onAssign: (escalation: Escalation) => void;
}

function EscalationCard({ escalation, onClick, onQuickResolve, onAssign }: EscalationCardProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} min ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const isUrgent = escalation.severity === 'critical' || escalation.severity === 'high';
  const isResolved = escalation.status === 'resolved' || escalation.status === 'closed';

  return (
    <div 
      className={`
        rounded-2xl border p-5 transition-all duration-200
        hover:scale-[1.01] hover:shadow-lg
        ${isUrgent 
          ? 'bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/30 hover:border-red-500/50 hover:shadow-red-500/10' 
          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <SeverityBadge severity={escalation.severity} />
          <StatusBadge status={escalation.status} />
        </div>
        <div className="flex items-center gap-2">
          <DeadlineTimer deadline={escalation.response_deadline} status={escalation.status} />
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(escalation.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Summary Title */}
      <p className="text-white font-medium mb-3 line-clamp-2">
        {escalation.escalation_summary || 'Escalation needs attention'}
      </p>

      {/* Patient's Reason - Highlighted Cyan Box */}
      {escalation.reason && (
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Patient's Reason</span>
          </div>
          <p className="text-sm text-cyan-100 line-clamp-2">
            "{escalation.reason}"
          </p>
        </div>
      )}

      {/* Patient Info */}
      {escalation.patient && (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-sm font-semibold">
              {escalation.patient.name?.charAt(0) || 'P'}
            </div>
            <div>
              <p className="text-sm text-white">{escalation.patient.name}</p>
              <p className="text-xs text-slate-500">
                {escalation.patient.gender} • {escalation.patient.age ? `${escalation.patient.age}y` : 'N/A'}
              </p>
            </div>
          </div>
          {escalation.patient.phone && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Phone className="w-3 h-3" />
              <span>{escalation.patient.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Assigned Doctor Badge */}
      {escalation.doctor_name && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <UserCheck className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-purple-300">Assigned to Dr. {escalation.doctor_name}</span>
        </div>
      )}

      {/* AI Recommendation */}
      {escalation.ai_recommendation && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">AI Recommendation</span>
          </div>
          <p className="text-sm text-slate-300 line-clamp-2">
            {escalation.ai_recommendation}
          </p>
        </div>
      )}

      {/* Chat Summary */}
      {escalation.chat_session && (escalation.chat_session.summary || escalation.chat_session.chat_summary) && (
        <div className="p-3 rounded-xl bg-slate-800/50 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-slate-400">Chat Context</span>
          </div>
          <p className="text-sm text-slate-300 line-clamp-2">
            {escalation.chat_session.chat_summary || escalation.chat_session.summary}
          </p>
        </div>
      )}

      {/* Type Tag */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        {escalation.escalation_type && (
          <span className="px-2 py-0.5 bg-slate-700/50 rounded-full capitalize">
            {escalation.escalation_type.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
        {/* Call Patient */}
        {escalation.patient?.phone && (
          <a
            href={`tel:${escalation.patient.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
        )}

        {/* Quick Resolve */}
        {!isResolved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickResolve(escalation);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Resolve</span>
          </button>
        )}

        {/* Assign */}
        {!escalation.assigned_to && !isResolved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssign(escalation);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assign</span>
          </button>
        )}

        {/* View Details - pushed to right */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex items-center gap-1 ml-auto text-xs text-teal-400 hover:text-teal-300 cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN ESCALATIONS LIST COMPONENT
// ============================================

export function EscalationsList() {
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  
  // Quick resolve state
  const [resolveModalEscalation, setResolveModalEscalation] = useState<Escalation | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Assign modal state
  const [assignModalEscalation, setAssignModalEscalation] = useState<Escalation | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const pageSize = 12;

  const fetchEscalations = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_escalations_list', {
        org_id: organization.id,
        search_term: searchTerm || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        status_filter: statusFilter || null,
        severity_filter: severityFilter || null,
        page_num: currentPage,
        page_size: pageSize
      });

      if (!error && data) {
        const response = data as EscalationListResponse;
        setEscalations(response.data || []);
        setTotalCount(response.total || 0);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching escalations:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, searchTerm, dateFrom, dateTo, statusFilter, severityFilter, currentPage]);

  // Fetch doctors for assignment dropdown
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!organization?.id) return;
      try {
        const { data, error } = await supabase
          .from('org_staff_extended')
          .select('id, full_name, specialization')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .eq('can_handle_escalations', true)
          .order('full_name');
        
        if (!error && data) {
          setDoctors(data);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };
    
    fetchDoctors();
  }, [organization?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEscalations();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(timer);
  }, [fetchEscalations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo, statusFilter, severityFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setSeverityFilter('');
    setCurrentPage(1);
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setEscalations(prev => 
      prev.map(e => e.id === id ? { ...e, status: newStatus } : e)
    );
    if (selectedEscalation?.id === id) {
      setSelectedEscalation(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Handle Quick Resolve
  const handleQuickResolve = async (notes: string) => {
    if (!resolveModalEscalation) return;

    setIsResolving(true);
    try {
      const { error } = await supabase
        .from('escalations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', resolveModalEscalation.id);

      if (!error) {
        handleStatusUpdate(resolveModalEscalation.id, 'resolved');
        setResolveModalEscalation(null);
      } else {
        console.error('Error resolving escalation:', error);
        alert('Failed to resolve escalation. Please try again.');
      }
    } catch (err) {
      console.error('Error resolving escalation:', err);
      alert('Failed to resolve escalation. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Assign to Doctor
  const handleAssign = async (doctorId: string) => {
    if (!assignModalEscalation) return;

    setIsAssigning(true);
    try {
      // Get doctor name for display
      const doctor = doctors.find(d => d.id === doctorId);
      
      const { error } = await supabase
        .from('escalations')
        .update({
          assigned_to: doctorId,
          doctor_id: doctorId,
          status: 'in_progress'
        })
        .eq('id', assignModalEscalation.id);

      if (!error) {
        // Update local state
        setEscalations(prev =>
          prev.map(e =>
            e.id === assignModalEscalation.id
              ? { ...e, assigned_to: doctorId, doctor_id: doctorId, doctor_name: doctor?.full_name || null, status: 'in_progress' }
              : e
          )
        );
        setAssignModalEscalation(null);
      } else {
        console.error('Error assigning escalation:', error);
        alert('Failed to assign escalation. Please try again.');
      }
    } catch (err) {
      console.error('Error assigning escalation:', err);
      alert('Failed to assign escalation. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const hasFilters = searchTerm || dateFrom || dateTo || statusFilter || severityFilter;

  // Count by severity
  const criticalCount = escalations.filter(e => e.severity === 'critical').length;
  const highCount = escalations.filter(e => e.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Escalations</h1>
          <p className="text-slate-400 text-sm">Clinic-in-loop cases requiring attention</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
              <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm text-red-400">{criticalCount} Critical</span>
            </div>
          )}
          {highCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-400">{highCount} High</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by patient name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Date Filters */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">Clear</span>
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-sm text-slate-500">
            Found <span className="text-white font-medium">{totalCount}</span> escalations
          </p>
        </div>
      </div>

      {/* Escalations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : escalations.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No escalations found</p>
          {hasFilters && (
            <button onClick={handleClearFilters} className="mt-2 text-sm text-teal-400 hover:text-teal-300">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escalations.map((escalation) => (
              <EscalationCard
                key={escalation.id}
                escalation={escalation}
                onClick={() => setSelectedEscalation(escalation)}
                onQuickResolve={(e) => setResolveModalEscalation(e)}
                onAssign={(e) => setAssignModalEscalation(e)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedEscalation && (
        <EscalationDetailModal
          escalation={selectedEscalation}
          onClose={() => setSelectedEscalation(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Quick Resolve Modal */}
      <QuickResolveModal
        escalation={resolveModalEscalation}
        onClose={() => setResolveModalEscalation(null)}
        onConfirm={handleQuickResolve}
        isLoading={isResolving}
      />

      {/* Assign Modal */}
      <AssignModal
        escalation={assignModalEscalation}
        doctors={doctors}
        onClose={() => setAssignModalEscalation(null)}
        onConfirm={handleAssign}
        isLoading={isAssigning}
      />
    </div>
  );
}