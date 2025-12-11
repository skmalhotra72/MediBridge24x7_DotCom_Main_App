'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Send, Loader2, User, Stethoscope, Calendar, CheckCircle, Building2, Phone } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'welcome' | 'question' | 'answer' | 'general';
}

interface PrescriptionData {
  id: string;
  file_url: string | null;
  status: string;
  created_at: string;
  chief_complaint: string | null;
  patient_name: string | null;
  patient_age: string | null;
  patient_gender: string | null;
  doctor_name: string | null;
  doctor_qualifications: string | null;
  doctor_registration: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_contact: string | null;
  prescription_date_extracted: string | null;
  diagnosis: string | null;
  user_question: string | null;
  ai_answer: string | null;
  ai_analysis: string | null;
  ai_summary: string | null;
  precautions: string[] | null;
  follow_up_instructions: {
    when_to_return?: string;
    warning_signs?: string;
    lifestyle_advice?: string;
  } | null;
  total_medicines: number | null;
  total_tests: number | null;
  document_type: string | null;
}

interface PrescriptionItem {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  timing: string | null;
  duration: string | null;
  instructions: string | null;
  item_type: string;
  purpose: string | null;
  medicine_form: string | null;
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const org = params.org as string;
  const prescriptionId = searchParams.get('prescription_id');
  const sessionId = searchParams.get('session');

  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [orgName, setOrgName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const quickQuestions = [
    'What are the side effects?',
    'Can I take this with food?',
    'What if I miss a dose?',
    'Any drug interactions?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('subdomain', org)
          .single();
        
        if (orgData) {
          setOrgName(orgData.name);
        }

        if (!prescriptionId) {
          setLoading(false);
          return;
        }

        const { data: prescriptionData, error: prescriptionError } = await supabase
          .from('prescriptions')
          .select(`
            id, file_url, status, created_at, chief_complaint,
            patient_name, patient_age, patient_gender,
            doctor_name, doctor_qualifications, doctor_registration,
            clinic_name, clinic_address, clinic_contact,
            prescription_date_extracted, diagnosis,
            user_question, ai_answer, ai_analysis, ai_summary,
            precautions, follow_up_instructions,
            total_medicines, total_tests, document_type
          `)
          .eq('id', prescriptionId)
          .single();

        if (prescriptionError) {
          console.error('Error fetching prescription:', prescriptionError);
        } else {
          setPrescription(prescriptionData);
          
          const initialMessages: Message[] = [];
          
          initialMessages.push({
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm Dr. Bridge, your AI healthcare assistant. I've analyzed your prescription and I'm here to answer any questions you have about your medicines, dosages, and treatment plan. What would you like to know?",
            timestamp: new Date(prescriptionData.created_at),
            type: 'welcome'
          });
          
          if (prescriptionData.user_question || prescriptionData.chief_complaint) {
            initialMessages.push({
              id: 'user-question',
              role: 'user',
              content: prescriptionData.user_question || prescriptionData.chief_complaint || '',
              timestamp: new Date(prescriptionData.created_at),
              type: 'question'
            });
          }
          
          if (prescriptionData.ai_answer) {
            initialMessages.push({
              id: 'ai-answer',
              role: 'assistant',
              content: prescriptionData.ai_answer,
              timestamp: new Date(prescriptionData.created_at),
              type: 'answer'
            });
          }
          
          setMessages(initialMessages);
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from('prescription_items')
          .select('*')
          .eq('prescription_id', prescriptionId)
          .order('sequence_number', { ascending: true });

        if (!itemsError && itemsData) {
          setPrescriptionItems(itemsData);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [org, prescriptionId, sessionId, supabase]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || sending) return;

    setSending(true);
    setInputValue('');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      type: 'question'
    };
    setMessages(prev => [...prev, userMessage]);

    const loadingMessage: Message = {
      id: 'loading',
      role: 'assistant',
      content: '...',
      timestamp: new Date(),
      type: 'general'
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
        'https://n8n.nhcare.in/webhook/28465002-1451-4336-8fc7-eb333dec1ef3';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: prescriptionId,
          chat_session_id: sessionId || prescriptionId,
          user_id: user?.id,
          query: messageToSend,
          chief_complaint: messageToSend,
          channel: 'web',
          organization: org,
          document_type: 'follow_up'
        })
      });

      const result = await response.json();
      
      let answerText = result.output || result.text || 'I apologize, but I could not process your question. Please try again.';
      
      const answerMatch = answerText.match(/###\s*ANSWER TO YOUR QUESTION\s*([\s\S]*?)(?=###|---\s*###|$)/i);
      if (answerMatch) {
        answerText = answerMatch[1].trim();
      }
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'loading');
        return [...filtered, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answerText,
          timestamp: new Date(),
          type: 'answer'
        }];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'loading');
        return [...filtered, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
          type: 'general'
        }];
      });
    } finally {
      setSending(false);
    }
  };

  const medicines = prescriptionItems.filter(item => item.item_type === 'medicine');
  const tests = prescriptionItems.filter(item => item.item_type === 'test');

  const getPrecautions = (): string[] => {
    if (!prescription?.precautions) return [];
    if (Array.isArray(prescription.precautions)) return prescription.precautions;
    if (typeof prescription.precautions === 'string') {
      try {
        return JSON.parse(prescription.precautions);
      } catch {
        return [prescription.precautions];
      }
    }
    return [];
  };

  const getFollowUp = () => {
    if (!prescription?.follow_up_instructions) return null;
    if (typeof prescription.follow_up_instructions === 'string') {
      try {
        return JSON.parse(prescription.follow_up_instructions);
      } catch {
        return null;
      }
    }
    return prescription.follow_up_instructions;
  };

  // Generate AI Summary from ai_answer if ai_summary is null
  const getAiSummary = (): string => {
    if (prescription?.ai_summary) return prescription.ai_summary;
    if (prescription?.ai_answer) {
      return prescription.ai_answer
        .replace(/[#*_~`]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 300) + '...';
    }
    return 'Prescription analyzed successfully. See details below.';
  };

  const precautions = getPrecautions();
  const followUp = getFollowUp();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{orgName || 'MediBridge'}</h1>
          <button
            onClick={() => router.push(`/${org}/dashboard`)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* LEFT SIDE - Prescription Info Panel */}
          <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
              <div>
                <h2 className="text-white font-bold">MediBridge</h2>
                <p className="text-blue-200 text-xs">AI Health Assistant</p>
              </div>
              <button 
                onClick={() => router.push(`/${org}/dashboard`)}
                className="ml-auto text-white text-sm hover:underline"
              >
                ← Back
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              
              {/* 1. Prescription Analysis Header with Patient Info */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="text-white font-semibold text-lg">Prescription Analysis</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4">AI-powered insights from your prescription</p>
                
                {/* Patient Information */}
                <div className="bg-slate-600/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm font-medium">Patient Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Name</p>
                      <p className="text-white">{prescription?.patient_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Age / Gender</p>
                      <p className="text-white">
                        {prescription?.patient_age || '-'}
                        {prescription?.patient_gender && !prescription?.patient_age?.includes(prescription.patient_gender) && ` / ${prescription.patient_gender}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-600/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-400 text-xs">Date</span>
                    </div>
                    <p className="text-white text-sm">
                      {formatDate(prescription?.prescription_date_extracted || prescription?.created_at || null)}
                    </p>
                  </div>
                  <div className="bg-slate-600/30 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      prescription?.status === 'analyzed' || prescription?.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {prescription?.status === 'analyzed' || prescription?.status === 'completed' 
                        ? '✓ Analyzed' 
                        : 'Processing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. AI Analysis Complete */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <h3 className="text-white font-semibold">AI Analysis Complete</h3>
                </div>
                
                {(prescription?.user_question || prescription?.chief_complaint) && (
                  <div className="mb-3">
                    <p className="text-cyan-400 text-sm font-medium mb-1">Question Asked:</p>
                    <p className="text-slate-300 text-sm bg-slate-600/30 rounded-lg p-2">
                      {prescription?.user_question || prescription?.chief_complaint}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-cyan-400 text-sm font-medium mb-1">AI Summary:</p>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {getAiSummary()}
                  </p>
                </div>
              </div>

              {/* 3. Prescribed Medicines */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-pink-400">💊</span>
                  <h3 className="text-white font-semibold">Prescribed Medicines</h3>
                  {medicines.length > 0 && (
                    <span className="ml-auto text-xs text-slate-400 bg-slate-600 px-2 py-0.5 rounded-full">
                      {medicines.length} medicine{medicines.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {medicines.length > 0 ? (
                  <div className="space-y-3">
                    {medicines.map((med, index) => (
                      <div key={med.id} className="bg-slate-600/50 rounded-lg p-3">
                        <p className="text-white font-medium mb-1">
                          {index + 1}. {med.medicine_name}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                          {med.purpose && (
                            <p><span className="text-slate-400">Purpose:</span> {med.purpose}</p>
                          )}
                          {med.dosage && (
                            <p><span className="text-slate-400">Dosage:</span> {med.dosage}</p>
                          )}
                          {med.frequency && (
                            <p><span className="text-slate-400">Frequency:</span> {med.frequency}</p>
                          )}
                          {med.duration && (
                            <p><span className="text-slate-400">Duration:</span> {med.duration}</p>
                          )}
                          {med.timing && (
                            <p><span className="text-slate-400">Timing:</span> {med.timing}</p>
                          )}
                          {med.medicine_form && (
                            <p><span className="text-slate-400">Form:</span> {med.medicine_form}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No medicines prescribed</p>
                )}
              </div>

              {/* 4. Precautions */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-400">⚠️</span>
                  <h3 className="text-white font-semibold">Precautions</h3>
                </div>
                
                {precautions.length > 0 ? (
                  <ul className="space-y-2">
                    {precautions.map((precaution, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-orange-400 mt-1">•</span>
                        <span>{precaution}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 text-sm">No specific precautions noted</p>
                )}
              </div>

              {/* 5. Diagnostic Tests */}
              <div className="bg-teal-900/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-teal-400">🧪</span>
                  <h3 className="text-white font-semibold">Diagnostic Tests</h3>
                  {tests.length > 0 && (
                    <span className="ml-auto text-xs text-slate-400 bg-slate-600 px-2 py-0.5 rounded-full">
                      {tests.length} test{tests.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {tests.length > 0 ? (
                  <div className="space-y-2">
                    {tests.map((test, index) => (
                      <div key={test.id} className="text-slate-300 text-sm">
                        <p className="font-medium">{index + 1}. {test.medicine_name}</p>
                        {test.instructions && (
                          <p className="text-slate-400 ml-4 text-xs">• {test.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No diagnostic tests prescribed</p>
                )}
              </div>

              {/* 6. Follow Up */}
              <div className="bg-teal-900/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-teal-400">📅</span>
                  <h3 className="text-white font-semibold">Follow Up</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  {followUp?.when_to_return && (
                    <p className="text-slate-300">
                      <span className="text-teal-400 font-medium">When to return:</span> {followUp.when_to_return}
                    </p>
                  )}
                  {followUp?.warning_signs && (
                    <p className="text-slate-300">
                      <span className="text-red-400 font-medium">Warning signs:</span> {followUp.warning_signs}
                    </p>
                  )}
                  {followUp?.lifestyle_advice && (
                    <p className="text-slate-300">
                      <span className="text-green-400 font-medium">Lifestyle advice:</span> {followUp.lifestyle_advice}
                    </p>
                  )}
                  {!followUp?.when_to_return && !followUp?.warning_signs && !followUp?.lifestyle_advice && (
                    <p className="text-slate-400">As advised by your doctor</p>
                  )}
                </div>
              </div>

              {/* 7. Doctor Information (MOVED DOWN) */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Doctor Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Doctor Name</p>
                    <p className="text-white">{prescription?.doctor_name || 'Not specified'}</p>
                  </div>
                  {prescription?.doctor_qualifications && (
                    <div>
                      <p className="text-slate-400 text-xs">Qualifications</p>
                      <p className="text-white">{prescription.doctor_qualifications}</p>
                    </div>
                  )}
                  {prescription?.doctor_registration && (
                    <div>
                      <p className="text-slate-400 text-xs">Registration No.</p>
                      <p className="text-white">{prescription.doctor_registration}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 8. Clinic Information (MOVED DOWN) */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 text-sm font-medium">Clinic Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Clinic Name</p>
                    <p className="text-white">{prescription?.clinic_name || 'Not specified'}</p>
                  </div>
                  {prescription?.clinic_address && (
                    <div>
                      <p className="text-slate-400 text-xs">Address</p>
                      <p className="text-white">{prescription.clinic_address}</p>
                    </div>
                  )}
                  {prescription?.clinic_contact && (
                    <div>
                      <p className="text-slate-400 text-xs">Contact</p>
                      <p className="text-white">{prescription.clinic_contact}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Closing message */}
              <div className="text-center py-2">
                <p className="text-slate-400 text-sm">अधिक प्रश्न हो तो बेझिझक मुझसे पूछें! 😊</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Chat Panel */}
          <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-150px)]">
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'welcome'
                        ? 'bg-slate-700 text-white'
                        : 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 text-white'
                    }`}
                  >
                    {message.role === 'user' && message.type === 'question' && (
                      <p className="text-blue-200 font-semibold text-xs mb-1">YOUR QUESTION</p>
                    )}
                    {message.role === 'assistant' && message.type === 'answer' && (
                      <p className="text-cyan-400 font-semibold text-sm mb-2">ANSWER TO YOUR QUESTION</p>
                    )}
                    
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content === '...' ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Thinking...
                        </span>
                      ) : (
                        message.content
                      )}
                    </p>
                    <p className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div className="px-4 py-2 border-t border-slate-700">
              <p className="text-slate-400 text-xs mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    disabled={sending}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-full transition-colors disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask anything about your prescription..."
                  disabled={sending}
                  className="flex-1 bg-slate-700 text-white placeholder-slate-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={sending || !inputValue.trim()}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}