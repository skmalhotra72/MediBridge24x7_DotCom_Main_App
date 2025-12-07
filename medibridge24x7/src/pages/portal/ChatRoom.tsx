import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/authStore';
import { generateAIResponse, isOpenAIAvailable, type ChatMessage } from '../../lib/openaiClient';
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  User,
  Bot,
  Stethoscope,
  Users,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  chat_session_id: string;
  sender_type: string;
  sender_id?: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface ChatSession {
  id: string;
  patient_id: string;
  organization_id: string;
  status: string;
  created_at: string;
  patient_name?: string;
  patient_info?: {
    age?: number;
    gender?: string;
  };
}

export const ChatRoom = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { organization, user, orgSettings } = useAuthStore();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (sessionId && organization?.id) {
      loadChatData();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, organization?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatData = async () => {
    try {
      setIsLoading(true);

      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId!)
        .eq('organization_id', organization!.id)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (!sessionData) {
        toast.error('Chat session not found');
        navigate('/portal/chat');
        return;
      }

      const { data: patientData } = await supabase
        .from('patients')
        .select('full_name, age, gender')
        .eq('id', sessionData.patient_id)
        .maybeSingle();

      setSession({
        ...sessionData,
        patient_name: patientData?.full_name || 'Unknown Patient',
        patient_info: {
          age: patientData?.age,
          gender: patientData?.gender,
        },
      });

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_session_id', sessionId!)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const messagesWithNames = await Promise.all(
        (messagesData || []).map(async (msg) => {
          if (msg.sender_id && msg.sender_type !== 'bot') {
            const { data: userData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', msg.sender_id)
              .maybeSingle();

            return {
              ...msg,
              sender_name: userData?.full_name || 'Unknown',
            };
          }
          return { ...msg, sender_name: msg.sender_type === 'bot' ? 'AI Assistant' : 'Unknown' };
        })
      );

      setMessages(messagesWithNames);
    } catch (error: any) {
      console.error('Error loading chat data:', error);
      toast.error('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          let senderName = 'Unknown';
          if (newMessage.sender_id && newMessage.sender_type !== 'bot') {
            const { data: userData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', newMessage.sender_id)
              .maybeSingle();
            senderName = userData?.full_name || 'Unknown';
          } else if (newMessage.sender_type === 'bot') {
            senderName = 'AI Assistant';
          }

          setMessages((prev) => [...prev, { ...newMessage, sender_name: senderName }]);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || isSending) return;

    const userMessage = messageInput.trim();
    setMessageInput('');

    try {
      setIsSending(true);

      // Insert user message
      const { error: messageError } = await supabase.from('messages').insert([
        {
          chat_session_id: sessionId!,
          sender_type: 'human',
          sender_id: user!.id,
          content: userMessage,
        },
      ]);

      if (messageError) throw messageError;

      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId!);

      // Generate AI response if AI is enabled for the organization
      const aiEnabled = orgSettings?.ai_enabled ?? false;

      if (aiEnabled && isOpenAIAvailable() && session) {
        try {
          // Build conversation history for context
          const conversationMessages: ChatMessage[] = messages
            .filter((msg) => msg.sender_type === 'human' || msg.sender_type === 'bot')
            .map((msg) => ({
              role: msg.sender_type === 'bot' ? 'assistant' : 'user',
              content: msg.content,
            })) as ChatMessage[];

          // Add the current user message
          conversationMessages.push({
            role: 'user',
            content: userMessage,
          });

          // Generate AI response
          const aiResponse = await generateAIResponse({
            messages: conversationMessages,
            patientName: session.patient_name,
            patientAge: session.patient_info?.age,
            patientGender: session.patient_info?.gender,
            organizationName: organization?.name,
          });

          // Insert AI response
          const { error: aiError } = await supabase.from('messages').insert([
            {
              chat_session_id: sessionId!,
              sender_type: 'bot',
              content: aiResponse,
            },
          ]);

          if (aiError) {
            console.error('Error saving AI response:', aiError);
            // Don't show error to user, AI response generation is optional
          }
        } catch (aiError: any) {
          console.error('Error generating AI response:', aiError);
          // Don't show error to user, AI response generation is optional
          // Optionally, you could show a toast: toast.error('AI response unavailable');
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore message input on error
      setMessageInput(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleEscalate = async () => {
    if (!session || session.status === 'escalated') return;

    try {
      setIsEscalating(true);

      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .update({ status: 'escalated' })
        .eq('id', sessionId!);

      if (sessionError) throw sessionError;

      const { data: staffData } = await supabase
        .from('org_staff')
        .select('id')
        .eq('user_id', user!.id)
        .eq('organization_id', organization!.id)
        .maybeSingle();

      const { error: escalationError } = await supabase.from('escalations').insert([
        {
          chat_session_id: sessionId!,
          assigned_staff_id: staffData?.id || null,
          priority: 'medium',
          status: 'open',
        },
      ]);

      if (escalationError) throw escalationError;

      setSession((prev) => (prev ? { ...prev, status: 'escalated' } : null));
      toast.success('Chat escalated to doctor');
    } catch (error: any) {
      console.error('Error escalating chat:', error);
      toast.error('Failed to escalate chat');
    } finally {
      setIsEscalating(false);
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'patient':
        return <User className="w-4 h-4" />;
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'doctor':
        return <Stethoscope className="w-4 h-4" />;
      case 'human':
      case 'staff':
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'patient':
        return 'bg-blue-500';
      case 'bot':
        return 'bg-purple-500';
      case 'doctor':
        return 'bg-green-500';
      case 'human':
      case 'staff':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_type === 'human' && message.sender_id === user?.id;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-blue-900 text-blue-300 border-blue-700',
      escalated: 'bg-amber-900 text-amber-300 border-amber-700',
      resolved: 'bg-green-900 text-green-300 border-green-700',
    };

    const icons = {
      active: <CheckCircle2 className="w-3 h-3" />,
      escalated: <AlertTriangle className="w-3 h-3" />,
      resolved: <CheckCircle2 className="w-3 h-3" />,
    };

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.active
        }`}
      >
        {icons[status as keyof typeof icons]}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Chat session not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-6xl mx-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-t-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/portal/chat')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session.patient_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{session.patient_name}</h2>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  {session.patient_info?.age && <span>{session.patient_info.age} years</span>}
                  {session.patient_info?.age && session.patient_info?.gender && (
                    <span>•</span>
                  )}
                  {session.patient_info?.gender && (
                    <span>
                      {session.patient_info.gender.charAt(0).toUpperCase() +
                        session.patient_info.gender.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(session.status)}
            {session.status !== 'escalated' && session.status !== 'resolved' && (
              <button
                onClick={handleEscalate}
                disabled={isEscalating}
                className="inline-flex items-center px-3 py-2 bg-amber-900 hover:bg-amber-800 text-amber-300 border border-amber-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {isEscalating ? 'Escalating...' : 'Escalate to Doctor'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border-x border-slate-700 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 mb-2">No messages yet</p>
            <p className="text-sm text-slate-500">Start the conversation</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = isOwnMessage(message);
            const isPatient = message.sender_type === 'patient';

            return (
              <div
                key={message.id}
                className={`flex ${isOwn || !isPatient ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-2xl ${
                    isOwn || !isPatient ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getSenderColor(
                      message.sender_type
                    )} text-white`}
                  >
                    {getSenderIcon(message.sender_type)}
                  </div>

                  <div className={`flex flex-col ${isOwn || !isPatient ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-slate-400">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(message.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwn || !isPatient
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-b-lg px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              disabled={isSending}
            />
          </div>
          <button
            type="submit"
            disabled={!messageInput.trim() || isSending}
            className="p-3 bg-primary hover:bg-opacity-80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};
