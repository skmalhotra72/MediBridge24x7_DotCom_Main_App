import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ChatViewModal } from '../../components/admin/ChatViewModal';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface EscalationWithDetails {
  id: string;
  chat_session_id: string;
  organization_id: string;
  reason?: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  org_name: string;
  patient_name: string;
  assigned_name?: string;
}

interface Organization {
  id: string;
  name: string;
}

export const GlobalEscalations = () => {
  const [escalations, setEscalations] = useState<EscalationWithDetails[]>([]);
  const [filteredEscalations, setFilteredEscalations] = useState<EscalationWithDetails[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState<{
    id: string;
    patientName: string;
  } | null>(null);

  const [filters, setFilters] = useState({
    organization: '',
    priority: '',
    status: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterEscalations();
  }, [escalations, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [orgsResult, escalationsResult] = await Promise.all([
        supabase.from('organizations').select('id, name').order('name'),
        supabase.from('escalations').select('*').order('created_at', { ascending: false }),
      ]);

      if (orgsResult.error) throw orgsResult.error;
      if (escalationsResult.error) throw escalationsResult.error;

      setOrganizations(orgsResult.data || []);

      const escalationsWithDetails = await Promise.all(
        (escalationsResult.data || []).map(async (escalation) => {
          const [chatSession, org] = await Promise.all([
            supabase
              .from('chat_sessions')
              .select('patient_id, organization_id')
              .eq('id', escalation.chat_session_id)
              .maybeSingle(),
            supabase
              .from('organizations')
              .select('name')
              .eq('id', escalation.organization_id)
              .maybeSingle(),
          ]);

          let patientName = 'Unknown Patient';
          if (chatSession.data?.patient_id) {
            const patient = await supabase
              .from('patients')
              .select('full_name')
              .eq('id', chatSession.data.patient_id)
              .maybeSingle();
            patientName = patient.data?.full_name || 'Unknown Patient';
          }

          let assignedName: string | undefined;
          if (escalation.assigned_to) {
            const assignedUser = await supabase
              .from('org_staff')
              .select('user_id')
              .eq('id', escalation.assigned_to)
              .maybeSingle();

            if (assignedUser.data?.user_id) {
              const userProfile = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', assignedUser.data.user_id)
                .maybeSingle();
              assignedName = userProfile.data?.email;
            }
          }

          return {
            ...escalation,
            org_name: org.data?.name || 'Unknown Organization',
            patient_name: patientName,
            assigned_name: assignedName,
          };
        })
      );

      setEscalations(escalationsWithDetails);
    } catch (error: any) {
      console.error('Error loading escalations:', error);
      toast.error(error.message || 'Failed to load escalations');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEscalations = () => {
    let filtered = escalations;

    if (filters.organization) {
      filtered = filtered.filter((esc) => esc.organization_id === filters.organization);
    }

    if (filters.priority) {
      filtered = filtered.filter((esc) => esc.priority === filters.priority);
    }

    if (filters.status) {
      filtered = filtered.filter((esc) => esc.status === filters.status);
    }

    setFilteredEscalations(filtered);
  };

  const openChatView = (chatSessionId: string, patientName: string) => {
    setSelectedChatSession({ id: chatSessionId, patientName });
    setIsChatModalOpen(true);
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-blue-900 text-blue-300 border-blue-700',
      medium: 'bg-amber-900 text-amber-300 border-amber-700',
      high: 'bg-red-900 text-red-300 border-red-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[priority as keyof typeof styles] || styles.medium
        }`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-slate-700 text-slate-300 border-slate-600',
      in_progress: 'bg-primary-900 text-primary-300 border-primary-700',
      resolved: 'bg-secondary-900 text-secondary-300 border-secondary-700',
    };

    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Global Escalations</h1>
          <p className="text-slate-400">
            Monitor and manage escalated cases across all organizations
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Organization
            </label>
            <select
              value={filters.organization}
              onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading escalations...</p>
          </div>
        </div>
      ) : filteredEscalations.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">
            {Object.values(filters).some((f) => f)
              ? 'No escalations match your filters'
              : 'No escalations found'}
          </p>
          <p className="text-sm text-slate-500">
            Escalated cases will appear here when they need attention
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredEscalations.map((escalation) => (
                  <tr key={escalation.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">
                        {escalation.org_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{escalation.patient_name}</span>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(escalation.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(escalation.status)}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">
                        {escalation.assigned_name || (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">
                        {new Date(escalation.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() =>
                            openChatView(escalation.chat_session_id, escalation.patient_name)
                          }
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-300 bg-primary-900 hover:bg-primary-800 border border-primary-700 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          View Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isChatModalOpen && selectedChatSession && (
        <ChatViewModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setSelectedChatSession(null);
          }}
          chatSessionId={selectedChatSession.id}
          patientName={selectedChatSession.patientName}
        />
      )}
    </div>
  );
};
