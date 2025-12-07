import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { MessageSquare, Plus, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatSession {
  id: string;
  patient_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Patient {
  id: string;
  full_name: string;
}

export const ChatSessions = () => {
  const navigate = useNavigate();
  const { organization } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      loadChatSessions();
      loadPatients();
    }
  }, [organization?.id]);

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('updated_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      const sessionsWithDetails = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const [patientResult, messagesResult] = await Promise.all([
            supabase
              .from('patients')
              .select('full_name')
              .eq('id', session.patient_id)
              .maybeSingle(),
            supabase
              .from('messages')
              .select('content, created_at')
              .eq('chat_session_id', session.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          const unreadCount = Math.floor(Math.random() * 5);

          return {
            ...session,
            patient_name: patientResult.data?.full_name || 'Unknown Patient',
            last_message: messagesResult.data?.content || 'No messages yet',
            last_message_time: messagesResult.data?.created_at || session.created_at,
            unread_count: unreadCount,
          };
        })
      );

      setSessions(sessionsWithDetails);
    } catch (error: any) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('organization_id', organization!.id)
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Error loading patients:', error);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient');
      return;
    }

    if (!initialMessage.trim()) {
      toast.error('Please enter an initial message');
      return;
    }

    try {
      setIsCreating(true);

      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert([
          {
            organization_id: organization!.id,
            patient_id: selectedPatientId,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: messageError } = await supabase.from('messages').insert([
        {
          chat_session_id: sessionData.id,
          sender_type: 'patient',
          sender_id: selectedPatientId,
          content: initialMessage.trim(),
        },
      ]);

      if (messageError) throw messageError;

      toast.success('Chat session created successfully');
      setShowNewChatModal(false);
      setSelectedPatientId('');
      setInitialMessage('');
      navigate(`/portal/chat/${sessionData.id}`);
    } catch (error: any) {
      console.error('Error creating chat session:', error);
      toast.error(error.message || 'Failed to create chat session');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'escalated':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-blue-900 text-blue-300 border-blue-700',
      escalated: 'bg-amber-900 text-amber-300 border-amber-700',
      resolved: 'bg-green-900 text-green-300 border-green-700',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.active
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

    return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedSessions = {
    active: sessions.filter((s) => s.status === 'active'),
    escalated: sessions.filter((s) => s.status === 'escalated'),
    resolved: sessions.filter((s) => s.status === 'resolved'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading chat sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Chat Sessions</h1>
          <p className="text-slate-400">Manage patient conversations and support requests</p>
        </div>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Simulate New Chat
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 mb-2">No chat sessions yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Create a simulated chat to get started
          </p>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Simulate New Chat
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSessions.active.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">
                  Active Conversations ({groupedSessions.active.length})
                </h2>
              </div>
              <div className="space-y-2">
                {groupedSessions.active.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/portal/chat/${session.id}`)}
                    className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg p-4 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {session.patient_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-semibold text-white truncate">
                                {session.patient_name}
                              </h3>
                              {session.unread_count > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                                  {session.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {session.last_message}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {getTimeAgo(session.last_message_time!)}
                        </span>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {groupedSessions.escalated.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">
                  Escalated ({groupedSessions.escalated.length})
                </h2>
              </div>
              <div className="space-y-2">
                {groupedSessions.escalated.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/portal/chat/${session.id}`)}
                    className="w-full bg-slate-800 hover:bg-slate-750 border border-amber-700 rounded-lg p-4 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {session.patient_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-semibold text-white truncate">
                                {session.patient_name}
                              </h3>
                              {session.unread_count > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-600 rounded-full">
                                  {session.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {session.last_message}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {getTimeAgo(session.last_message_time!)}
                        </span>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {groupedSessions.resolved.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">
                  Resolved ({groupedSessions.resolved.length})
                </h2>
              </div>
              <div className="space-y-2">
                {groupedSessions.resolved.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/portal/chat/${session.id}`)}
                    className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg p-4 transition-all text-left group opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {session.patient_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {session.patient_name}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">
                              {session.last_message}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {getTimeAgo(session.last_message_time!)}
                        </span>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Simulate New Chat</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Patient <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Initial Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter the patient's initial message..."
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={isCreating || !selectedPatientId || !initialMessage.trim()}
                className="inline-flex items-center px-4 py-2 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
