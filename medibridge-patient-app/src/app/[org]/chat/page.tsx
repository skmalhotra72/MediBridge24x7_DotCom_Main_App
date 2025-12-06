'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export default function ChatPage({ params }: { params: Promise<{ org: string }> }) {
  const searchParams = useSearchParams();
  const prescriptionId = searchParams.get('prescription_id');
  const sessionId = searchParams.get('session') || prescriptionId;
  
  const [org, setOrg] = useState<string>('');
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  // n8n Webhook URL
  const N8N_WEBHOOK_URL = "/api/webhook";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    params.then(p => setOrg(p.org));
  }, [params]);

  // Get current user
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUser();
  }, []);

  useEffect(() => {
    if (prescriptionId && userId && !hasLoadedHistory.current) {
      hasLoadedHistory.current = true;
      loadPrescriptionAndHistory();
    } else if (!prescriptionId && !loading) {
      // No prescription ID - show welcome message
      setLoading(false);
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: 'Hello! I am your MediBridge AI assistant. 📋 No prescription loaded. You can upload a prescription to get AI analysis, or ask me general health questions!'
        }]);
      }
    }
  }, [prescriptionId, userId]);

  // Save message to database
  async function saveMessage(message: ChatMessage) {
    if (!userId) return;
    
    try {
      const supabase = createClient();
      await supabase.from('chat_messages').insert({
        prescription_id: prescriptionId,
        user_id: userId,
        session_id: sessionId,
        role: message.role,
        content: message.content,
        metadata: {}
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }

  async function loadPrescriptionAndHistory() {
    try {
      const supabase = createClient();
      
      // Load prescription
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', prescriptionId)
        .single();

      if (prescriptionError) throw prescriptionError;
      setPrescription(prescriptionData);

      // Load existing chat history
      const { data: chatHistory, error: chatError } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('prescription_id', prescriptionId)
        .order('created_at', { ascending: true });

      if (chatError) {
        console.error('Error loading chat history:', chatError);
      }

      setLoading(false);

      // If we have chat history, display it
      if (chatHistory && chatHistory.length > 0) {
        console.log('📜 Loaded chat history:', chatHistory.length, 'messages');
        setMessages(chatHistory.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          created_at: msg.created_at
        })));
      } else {
        // No history - add welcome message and analyze if file exists
        const welcomeMessage: ChatMessage = {
          role: 'assistant',
          content: 'Hello! I am your MediBridge AI assistant. I will analyze your prescription and help you understand your medications, tests, and precautions.'
        };
        
        setMessages([welcomeMessage]);
        await saveMessage(welcomeMessage);

        // Only analyze if file exists and not already analyzed
        if (prescriptionData.file_url && prescriptionData.status !== 'analyzed') {
          analyzeWithN8N(prescriptionData);
        } else if (prescriptionData.status === 'analyzed') {
          // Already analyzed but no history (edge case) - offer to re-analyze
          const infoMessage: ChatMessage = {
            role: 'assistant',
            content: '✅ This prescription was previously analyzed. You can ask me any questions about it, or type "analyze again" if you\'d like a fresh analysis.'
          };
          setMessages(prev => [...prev, infoMessage]);
          await saveMessage(infoMessage);
        } else if (!prescriptionData.file_url) {
          const noFileMessage: ChatMessage = {
            role: 'assistant',
            content: '📋 Prescription record found but no file was uploaded. Please upload a prescription image or PDF to get AI analysis.\n\nYou can still ask me general health questions!'
          };
          setMessages(prev => [...prev, noFileMessage]);
          await saveMessage(noFileMessage);
        }
      }

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Helper function to safely parse JSON response
  async function safeParseResponse(response: Response): Promise<any> {
    const responseText = await response.text();
    
    console.log('=== Raw Response ===', responseText.substring(0, 500));
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response from AI. Please try again.');
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      if (responseText.length > 0) {
        return { output: responseText };
      }
      throw new Error('Invalid response format from AI.');
    }
  }

  // Extract AI response from various possible response formats
  function extractAIResponse(result: any): string {
    if (typeof result === 'string') return result;
    if (Array.isArray(result) && result.length > 0) result = result[0];
    
    const possibleFields = ['output', 'response', 'message', 'text', 'answer', 'content'];
    for (const field of possibleFields) {
      if (result[field]) return result[field];
    }
    
    return typeof result === 'object' ? JSON.stringify(result, null, 2) : 'No response received';
  }

  async function analyzeWithN8N(prescriptionData: any) {
    if (!prescriptionData?.file_url) return;

    setAnalyzing(true);
    
    const analyzingMessage: ChatMessage = {
      role: 'assistant',
      content: '🔍 Analyzing your prescription... This may take a moment.'
    };
    setMessages(prev => [...prev, analyzingMessage]);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

// ⭐ Use stored chief concern from prescription OR default query
const storedChiefConcern = prescriptionData.chief_concern;
const queryText = storedChiefConcern 
  ? storedChiefConcern 
  : 'Please analyze this prescription and explain it to me';

console.log('📝 [Chat] Chief concern from DB:', storedChiefConcern);
console.log('📝 [Chat] Query being sent:', queryText);

const requestBody = {
  prescription_id: prescriptionData.id,
  file_url: prescriptionData.file_url,
  file_type: prescriptionData.file_type,
  user_id: user?.id,
  user_email: user?.email,
  organization_id: prescriptionData.organization_id,
  query: queryText,
  chief_concern: storedChiefConcern || null
};

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await safeParseResponse(response);
      
      // Update prescription status
      await supabase
        .from('prescriptions')
        .update({ status: 'analyzed' })
        .eq('id', prescriptionData.id);

      const aiResponse = extractAIResponse(result);
      
      // Remove the "analyzing" message and add the real response
      const analysisMessage: ChatMessage = {
        role: 'assistant',
        content: `✅ **Prescription Analysis Complete**\n\n${aiResponse}`
      };
      
      setMessages(prev => {
        // Remove the analyzing message
        const filtered = prev.filter(m => !m.content.includes('Analyzing your prescription'));
        return [...filtered, analysisMessage];
      });
      
      // Save to database
      await saveMessage(analysisMessage);

      setPrescription((prev: any) => ({ ...prev, status: 'analyzed' }));

    } catch (err: any) {
      console.error('Error in analyzeWithN8N:', err);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `⚠️ I couldn't complete the analysis automatically. Error: ${err.message}\n\nYou can still ask me questions about your prescription!`
      };
      
      setMessages(prev => {
        const filtered = prev.filter(m => !m.content.includes('Analyzing your prescription'));
        return [...filtered, errorMessage];
      });
      
      await saveMessage(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendMessage() {
    if (!inputMessage.trim() || analyzing) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Check for re-analyze command
    if (userMessage.toLowerCase() === 'analyze again' && prescription?.file_url) {
      analyzeWithN8N(prescription);
      return;
    }

    // Add user message to chat
    const userChatMessage: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userChatMessage]);
    await saveMessage(userChatMessage);

    setAnalyzing(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const requestBody: Record<string, any> = {
        query: userMessage,
        user_id: user?.id,
        user_email: user?.email,
      };

      if (prescription?.id) {
        requestBody.prescription_id = prescription.id;
        requestBody.organization_id = prescription.organization_id;
        requestBody.is_followup = true;
      }
      
      if (prescription?.file_url) {
        requestBody.file_url = prescription.file_url;
        requestBody.file_type = prescription.file_type;
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await safeParseResponse(response);
      const aiResponse = extractAIResponse(result);

      const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);

    } catch (err: any) {
      console.error('Error in sendMessage:', err);
      
      let errorContent = `Sorry, I encountered an error: ${err.message}`;
      if (!prescription?.file_url && userMessage.toLowerCase().includes('prescription')) {
        errorContent = "⚠️ No prescription file found. Please upload a prescription first, then I can help you understand it!\n\nYou can still ask general health questions.";
      }
      
      const errorMessage: ChatMessage = { role: 'assistant', content: errorContent };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!org) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg mb-6 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prescription Analysis</h1>
              <p className="text-sm text-gray-600 mt-1">AI-powered prescription assistant by MediBridge</p>
            </div>
            <Link 
              href={`/${org}/dashboard`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6" style={{ minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm">{msg.content}</div>
                  {msg.created_at && (
                    <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {(loading || analyzing) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-gray-600">
                      {loading ? 'Loading prescription...' : 'AI is thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Prescription Details */}
        {prescription && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescription Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Prescription ID</p>
                <p className="font-mono text-xs text-gray-900 break-all">{prescription.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  prescription.status === 'analyzed' 
                    ? 'bg-green-100 text-green-800' 
                    : prescription.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {prescription.status?.charAt(0).toUpperCase() + prescription.status?.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Type</p>
                <p className="text-gray-900">{prescription.file_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uploaded</p>
                <p className="text-gray-900">{new Date(prescription.created_at).toLocaleString()}</p>
              </div>
            </div>
            {prescription.file_url ? (
              <div className="mt-4">
                <a 
                  href={prescription.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  📄 View Uploaded File
                </a>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">⚠️ No file uploaded for this prescription</p>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={analyzing || loading}
              placeholder="Ask me anything about your prescription..."
              className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                (analyzing || loading) ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
              }`}
            />
            <button
              onClick={sendMessage}
              disabled={analyzing || loading || !inputMessage.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                (analyzing || loading || !inputMessage.trim())
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {analyzing ? '...' : 'Send'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Quick questions:</span>
            {['What are the side effects?', 'When should I take the medicines?', 'Any food restrictions?'].map((q) => (
              <button
                key={q}
                onClick={() => setInputMessage(q)}
                disabled={analyzing || loading}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}