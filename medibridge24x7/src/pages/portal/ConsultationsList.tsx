import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { 
  Calendar, 
  Clock, 
  Phone, 
  Video, 
  Building,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Consultation {
  id: string;
  organization_id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  consultation_type: string;
  consultation_status: string;
  chief_complaint: string;
  notes: string;
  is_followup: boolean;
  created_at: string;
  patient?: {
    id: string;
    full_name: string;
    gender: string;
    age: number;
    phone: string;
    email: string;
  };
  doctor?: {
    id: string;
    full_name: string;
  };
}

export const ConsultationsList = () => {
  const { organization } = useAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (organization?.id) {
      fetchConsultations();
    }
  }, [organization?.id]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(id, full_name, gender, age, phone, email),
          doctor:users(id, full_name)
        `)
        .eq('organization_id', organization?.id)
        .order('consultation_date', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const safeStatus = status || 'unknown';
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Clock className="w-3 h-3" /> },
      in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <AlertCircle className="w-3 h-3" /> },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <XCircle className="w-3 h-3" /> },
      no_show: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <XCircle className="w-3 h-3" /> },
      unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <AlertCircle className="w-3 h-3" /> }
    };
    const config = statusConfig[safeStatus] || statusConfig.unknown;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {safeStatus.replace(/_/g, ' ')}
      </span>
    );
  };

  const getTypeIcon = (type: string | null | undefined) => {
    const safeType = type || 'in_clinic';
    switch (safeType) {
      case 'video_conference':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'virtual_call':
        return <Phone className="w-4 h-4 text-blue-400" />;
      default:
        return <Building className="w-4 h-4 text-cyan-400" />;
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = 
      (consultation.patient?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consultation.chief_complaint || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || consultation.consultation_status === statusFilter;
    const matchesType = typeFilter === 'all' || consultation.consultation_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Consultations</h1>
        <p className="text-slate-400 text-sm">Manage patient consultations and appointments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name or complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Types</option>
          <option value="in_clinic">In Clinic</option>
          <option value="video_conference">Video Conference</option>
          <option value="virtual_call">Virtual Call</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{consultations.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-blue-400 text-xs mb-1">Scheduled</p>
          <p className="text-2xl font-bold text-white">
            {consultations.filter(c => c.consultation_status === 'scheduled').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-green-400 text-xs mb-1">Completed</p>
          <p className="text-2xl font-bold text-white">
            {consultations.filter(c => c.consultation_status === 'completed').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <p className="text-yellow-400 text-xs mb-1">In Progress</p>
          <p className="text-2xl font-bold text-white">
            {consultations.filter(c => c.consultation_status === 'in_progress').length}
          </p>
        </div>
      </div>

      {/* Consultations List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Chief Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No consultations found
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-white text-sm">{formatDate(consultation.consultation_date)}</p>
                          <p className="text-slate-500 text-xs">{formatTime(consultation.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                          <span className="text-cyan-400 text-sm font-medium">
                            {(consultation.patient?.full_name || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{consultation.patient?.full_name || 'Unknown'}</p>
                          <p className="text-slate-500 text-xs">
                            {consultation.patient?.gender || ''} {consultation.patient?.age ? `• ${consultation.patient.age}y` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(consultation.consultation_type)}
                        <span className="text-slate-300 text-sm capitalize">
                          {(consultation.consultation_type || 'in_clinic').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-sm max-w-[200px] truncate">
                        {consultation.chief_complaint || 'No complaint specified'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(consultation.consultation_status)}
                    </td>
                    <td className="px-4 py-3">
                      {consultation.is_followup ? (
                        <span className="text-cyan-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-slate-500 text-xs">No</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};