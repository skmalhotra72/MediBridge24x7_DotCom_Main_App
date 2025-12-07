import { useEffect, useState } from 'react';
import { X, User, Bot, Stethoscope, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  chat_session_id: string;
  sender_type: 'patient' | 'bot' | 'human' | 'doctor';
  sender_id?: string;
  content: string;
  sent_at: string;
}

interface ChatViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessionId: string;
  patientName: string;
}

export const ChatViewModal = ({
  isOpen,
  onClose,
  chatSessionId,
  patientName,
}: ChatViewModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && chatSessionId) {
      loadMessages();
    }
  }, [isOpen, chatSessionId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_session_id', chatSessionId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load chat messages');
    } finally {
      setIsLoading(false);
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
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'patient':
        return 'bg-blue-900 border-blue-700 text-blue-300';
      case 'bot':
        return 'bg-purple-900 border-purple-700 text-purple-300';
      case 'doctor':
        return 'bg-green-900 border-green-700 text-green-300';
      case 'human':
        return 'bg-amber-900 border-amber-700 text-amber-300';
      default:
        return 'bg-slate-700 border-slate-600 text-slate-300';
    }
  };

  const formatSenderType = (senderType: string) => {
    return senderType.charAt(0).toUpperCase() + senderType.slice(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-white">Chat Session</h2>
            <p className="text-sm text-slate-400 mt-1">Patient: {patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No messages in this chat session</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getSenderColor(
                    message.sender_type
                  )}`}
                >
                  {getSenderIcon(message.sender_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      {formatSenderType(message.sender_type)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(message.sent_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="bg-slate-900 rounded-lg px-4 py-3 border border-slate-700">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-900 border-t border-slate-700 px-6 py-4 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {messages.length} message{messages.length !== 1 ? 's' : ''} in this conversation
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
