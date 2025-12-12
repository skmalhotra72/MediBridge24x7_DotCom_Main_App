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
  Eye
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
  } | null;
  chat_session: {
    id: string;
    status: string | null;
    summary: string | null;
    chat_summary: string | null;
  } | null;
}

interface EscalationListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: Escalation[];
}

// ============================================
// SEVERITY BADGE COMPONENT
// ============================================

function SeverityBadge({ severity }: { severity: string | null }) {
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

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${text} border ${border}`}>
      <Icon className={`w-3.5 h-3.5 ${pulse ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-medium capitalize">{severity || 'Unknown'}</span>
    </div>
  );
}

// ============================================
// ESCALATION CARD COMPONENT
// ============================================

function EscalationCard({ escalation, onClick }: { escalation: Escalation; onClick: () => void }) {
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

  return (
    <div 
      onClick={onClick}
      className={`
        rounded-2xl border p-5 cursor-pointer transition-all duration-200
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
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            escalation.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
            escalation.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
            escalation.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {escalation.status || 'Unknown'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{formatDate(escalation.created_at)}</span>
        </div>
      </div>

      {/* Reason/Summary */}
      <p className="text-white font-medium mb-3 line-clamp-2">
        {escalation.reason || escalation.escalation_summary || 'Escalation needs attention'}
      </p>

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

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {escalation.escalation_type && (
            <span className="px-2 py-0.5 bg-slate-700/50 rounded-full capitalize">
              {escalation.escalation_type.replace('_', ' ')}
            </span>
          )}
          {escalation.doctor_name && (
            <span>Dr. {escalation.doctor_name}</span>
          )}
        </div>
        <button className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
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
                onClick={() => {/* TODO: Open escalation detail modal */}}
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
    </div>
  );
}
