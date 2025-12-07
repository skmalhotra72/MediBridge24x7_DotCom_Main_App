import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import {
  AlertTriangle,
  UserPlus,
  MessageSquare,
  CheckCircle,
  Filter,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Escalation {
  id: string;
  chat_session_id: string;
  assigned_staff_id?: string;
  priority: string;
  status: string;
  created_at: string;
  patient_name?: string;
  assigned_to_name?: string;
  patient_id?: string;
}

export const EscalationsList = () => {
  const navigate = useNavigate();
  const { organization, user } = useAuthStore();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterView, setFilterView] = useState<'my' | 'all'>('my');
  const [canHandleAll, setCanHandleAll] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState<string>('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (organization?.id && user?.id) {
      loadStaffPermissions();
    }
  }, [organization?.id, user?.id]);

  useEffect(() => {
    if (currentStaffId) {
      loadEscalations();
    }
  }, [currentStaffId, filterView]);

  const loadStaffPermissions = async () => {
    try {
      const { data: staffData, error } = await supabase
        .from('org_staff')
        .select('id, can_handle_escalations')
        .eq('organization_id', organization!.id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (staffData) {
        setCurrentStaffId(staffData.id);
        setCanHandleAll(staffData.can_handle_escalations || false);
      }
    } catch (error: any) {
      console.error('Error loading staff permissions:', error);
    }
  };

  const loadEscalations = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('escalations')
        .select('*, chat_sessions!inner(organization_id, patient_id)')
        .eq('chat_sessions.organization_id', organization!.id)
        .order('created_at', { ascending: false });

      if (filterView === 'my') {
        query = query.eq('assigned_staff_id', currentStaffId);
      }

      const { data: escalationsData, error: escalationsError } = await query;

      if (escalationsError) throw escalationsError;

      const escalationsWithDetails = await Promise.all(
        (escalationsData || []).map(async (escalation: any) => {
          const [patientResult, assignedResult] = await Promise.all([
            supabase
              .from('patients')
              .select('full_name')
              .eq('id', escalation.chat_sessions.patient_id)
              .maybeSingle(),
            escalation.assigned_staff_id
              ? supabase
                  .from('org_staff')
                  .select('user_id')
                  .eq('id', escalation.assigned_staff_id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          let assignedToName = 'Unassigned';
          if (assignedResult.data?.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', assignedResult.data.user_id)
              .maybeSingle();
            assignedToName = userData?.full_name || 'Unknown';
          }

          return {
            id: escalation.id,
            chat_session_id: escalation.chat_session_id,
            assigned_staff_id: escalation.assigned_staff_id,
            priority: escalation.priority,
            status: escalation.status,
            created_at: escalation.created_at,
            patient_name: patientResult.data?.full_name || 'Unknown Patient',
            assigned_to_name: assignedToName,
            patient_id: escalation.chat_sessions.patient_id,
          };
        })
      );

      setEscalations(escalationsWithDetails);
    } catch (error: any) {
      console.error('Error loading escalations:', error);
      toast.error('Failed to load escalations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToMe = async (escalation: Escalation) => {
    try {
      setActioningId(escalation.id);

      const { error } = await supabase
        .from('escalations')
        .update({
          assigned_staff_id: currentStaffId,
          status: 'in_progress',
        })
        .eq('id', escalation.id);

      if (error) throw error;

      toast.success('Escalation assigned to you');
      loadEscalations();
    } catch (error: any) {
      console.error('Error assigning escalation:', error);
      toast.error('Failed to assign escalation');
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkResolved = async (escalation: Escalation) => {
    if (!confirm('Are you sure you want to mark this escalation as resolved?')) {
      return;
    }

    try {
      setActioningId(escalation.id);

      const { error: escalationError } = await supabase
        .from('escalations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', escalation.id);

      if (escalationError) throw escalationError;

      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .update({ status: 'resolved' })
        .eq('id', escalation.chat_session_id);

      if (sessionError) throw sessionError;

      toast.success('Escalation marked as resolved');
      loadEscalations();
    } catch (error: any) {
      console.error('Error resolving escalation:', error);
      toast.error('Failed to resolve escalation');
    } finally {
      setActioningId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-slate-900 text-slate-300 border-slate-700',
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
      open: 'bg-blue-900 text-blue-300 border-blue-700',
      in_progress: 'bg-amber-900 text-amber-300 border-amber-700',
      resolved: 'bg-green-900 text-green-300 border-green-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.open
        }`}
      >
        {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return time.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading escalations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Escalations</h1>
        <p className="text-slate-400">
          Manage patient escalations and urgent support requests
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-white">Filter</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterView('my')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filterView === 'my'
                  ? 'bg-primary text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              My Escalations
            </button>
            {canHandleAll && (
              <button
                onClick={() => setFilterView('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterView === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All Escalations
              </button>
            )}
          </div>
        </div>
      </div>

      {escalations.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-2">
            {filterView === 'my'
              ? 'No escalations assigned to you'
              : 'No escalations available'}
          </p>
          <p className="text-sm text-slate-500">
            {filterView === 'my'
              ? 'Escalations assigned to you will appear here'
              : 'All escalations will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
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
                {escalations.map((escalation) => (
                  <tr key={escalation.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {escalation.patient_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {escalation.patient_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(escalation.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(escalation.status)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm ${
                          escalation.assigned_staff_id
                            ? 'text-slate-300'
                            : 'text-slate-500 italic'
                        }`}
                      >
                        {escalation.assigned_to_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeAgo(escalation.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        {!escalation.assigned_staff_id && escalation.status !== 'resolved' && (
                          <button
                            onClick={() => handleAssignToMe(escalation)}
                            disabled={actioningId === escalation.id}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-300 bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Assign to Me
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/portal/chat/${escalation.chat_session_id}`)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-300 bg-green-900 hover:bg-green-800 border border-green-700 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          View Chat
                        </button>

                        {escalation.status !== 'resolved' && (
                          <button
                            onClick={() => handleMarkResolved(escalation)}
                            disabled={actioningId === escalation.id}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-emerald-300 bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
