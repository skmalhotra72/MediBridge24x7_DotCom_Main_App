'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const org = params.org as string;
  const supabase = createClient();

  const prescriptionId = searchParams.get('prescription_id');
  const sessionId = searchParams.get('session');

  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForAnalysis, setIsWaitingForAnalysis] = useState(true);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [medicineItems, setMedicineItems] = useState<any[]>([]);
  const [testItems, setTestItems] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  // Clean text by converting escaped newlines to actual newlines
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text.replace(/\\n/g, '\n');
  };

  // Helper function to extract medicines from AI response
  const extractMedicines = (text: string): string[] => {
    if (!text) return [];
    
    // Clean the text first
    const cleaned = cleanText(text);
    const medicines: string[] = [];
    const lines = cleaned.split('\n');
    
    let inMedicineSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      
      // Look for MEDICINES header
      if (trimmedLine.match(/^###\s+MEDICINES/i)) {
        inMedicineSection = true;
        continue;
      }
      
      // Stop at next section header
      if (inMedicineSection && trimmedLine.match(/^###\s+/)) {
        break;
      }
      
      // Extract medicines
      if (inMedicineSection && trimmedLine) {
        // Skip separators and "no medicines" text
        if (trimmedLine.match(/^[-=]{3,}/) || 
            trimmedLine.length < 3 ||
            trimmedLine.match(/no\s+medicines\s+prescribed/i)) {
          continue;
        }
        
        // Match numbered entries: "1. **Medicine Name**"
        const match = trimmedLine.match(/^\d+\.\s+\*?\*?([^-*]+)/);
        if (match) {
          const name = match[1].trim().replace(/\*\*/g, '');
          medicines.push(name);
        }
      }
    }
    
    return medicines;
  };

  // Helper function to extract diagnostic tests from AI response
  const extractTests = (text: string): string[] => {
    if (!text) return [];
    
    // Clean the text first
    const cleaned = cleanText(text);
    const tests: string[] = [];
    const lines = cleaned.split('\n');
    
    let inTestSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      
      // Look for TESTS header
      if (trimmedLine.match(/^###\s+TESTS?/i)) {
        inTestSection = true;
        continue;
      }
      
      // Stop at next section header
      if (inTestSection && trimmedLine.match(/^###\s+/)) {
        break;
      }
      
      // Extract tests
      if (inTestSection && trimmedLine) {
        // Skip separators and "no tests" text
        if (trimmedLine.match(/^[-=]{3,}/) || 
            trimmedLine.length < 3 ||
            trimmedLine.match(/no\s+(?:diagnostic\s+)?tests?\s+prescribed/i)) {
          continue;
        }
        
        // Match numbered entries
        const match = trimmedLine.match(/^\d+\.\s+\*?\*?([^-*]+)/);
        if (match) {
          const name = match[1].trim().replace(/\*\*/g, '');
          tests.push(name);
        }
      }
    }
    
    return tests;
  };

  // Format AI response for display
  const formatAIResponse = (text: string): string => {
    if (!text) return '';
    
    let formatted = cleanText(text);
    
    // Convert markdown headers
    formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-cyan-400 mt-3 mb-2 border-b border-cyan-500/30 pb-1">$1</h3>');
    
    // Convert bold text
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    
    // Convert bullet points
    formatted = formatted.replace(/^- (.+)$/gm, '<div class="ml-4 my-1">• $1</div>');
    
    // Convert numbered lists
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="ml-4 my-2"><span class="text-cyan-400 font-bold">$1.</span> $2</div>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n\n+/g, '<br/><br/>');
    formatted = formatted.replace(/\n/g, '<br/>');
    
    // Convert separators
    formatted = formatted.replace(/^---+$/gm, '<hr class="border-white/10 my-3"/>');
    
    return formatted;
  };

  // Function to fetch AI response from database
  const fetchAIResponse = useCallback(async () => {
    if (!prescriptionId) return null;

    try {
      const { data: aiMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_session_id', sessionId || prescriptionId)
        .eq('sender_type', 'ai')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && aiMessages && aiMessages.length > 0) {
        return aiMessages[0];
      }

      const { data: prescription } = await supabase
        .from('prescriptions')
        .select('ai_summary, processing_status')
        .eq('id', prescriptionId)
        .single();

      if (prescription?.ai_summary) {
        return { message: prescription.ai_summary, source: 'prescription' };
      }

      return null;
    } catch (err) {
      console.error('Error fetching AI response:', err);
      return null;
    }
  }, [prescriptionId, sessionId, supabase]);
  console.log('🔍 prescriptionId:', prescriptionId);


  // Fetch prescription items from database
  const fetchPrescriptionItems = useCallback(async () => {
    if (!prescriptionId) return;

    try {
      const { data: items, error } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', prescriptionId)
        .order('sequence_number', { ascending: true });
        console.log('🔍 items:', items);
        console.log('🔍 error:', error);
      if (!error && items) {
        const medicines = items.filter(item => item.item_type === 'medicine');
        const tests = items.filter(item => item.item_type === 'test');
        
        setMedicineItems(medicines);
        setTestItems(tests);
      }
    } catch (err) {
      console.error('Error fetching prescription items:', err);
    }
  }, [prescriptionId, supabase]);

  // Poll for AI response
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    console.log('🔄 Starting to poll for AI response...');
    
    pollingRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      console.log(`🔍 Poll attempt ${pollCountRef.current}...`);

      const aiResponse = await fetchAIResponse();
      
      if (aiResponse) {
        console.log('✅ AI response found!', aiResponse);
        
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        const responseText = aiResponse.message || aiResponse.content || aiResponse.ai_summary || '';
        
        setAnalysisResult(responseText);
        setIsWaitingForAnalysis(false);

        setMessages(prev => {
          const hasAIMessage = prev.some(m => m.sender === 'assistant' && m.text === responseText);
          if (hasAIMessage) return prev;

          return [...prev, {
            id: aiResponse.id || `ai-${Date.now()}`,
            sender: 'assistant',
            text: responseText,
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          }];
        });
      }

      if (pollCountRef.current >= 30) {
        console.log('⏱️ Polling timeout - stopping');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setIsWaitingForAnalysis(false);
      }
    }, 2000);
  }, [fetchAIResponse]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!prescriptionId) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const { data: prescription, error: prescError } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('id', prescriptionId)
          .single();

        if (prescError) throw prescError;
        setPrescriptionData(prescription);
        
        // Fetch prescription items
        await fetchPrescriptionItems();

        const existingAIResponse = await fetchAIResponse();
        
        if (existingAIResponse) {
          console.log('✅ Found existing AI response');
          const responseText = existingAIResponse.message || existingAIResponse.content || existingAIResponse.ai_summary || '';
          setAnalysisResult(responseText);
          setIsWaitingForAnalysis(false);
          
          setMessages([
            {
              id: 'welcome',
              sender: 'assistant',
              text: "Hello! I'm Dr. Bridge, your AI healthcare assistant. I've analyzed your prescription and I'm here to answer any questions you have about your medicines, dosages, and treatment plan. What would you like to know?",
              timestamp: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
            },
            {
              id: existingAIResponse.id || `ai-${Date.now()}`,
              sender: 'assistant',
              text: responseText,
              timestamp: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          ]);
        } else {
          setMessages([{
            id: 'welcome',
            sender: 'assistant',
            text: "Hello! I'm Dr. Bridge, your AI healthcare assistant. I've analyzed your prescription and I'm here to answer any questions you have about your medicines, dosages, and treatment plan. What would you like to know?",
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          }]);
          
          startPolling();
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [prescriptionId, sessionId, fetchAIResponse, fetchPrescriptionItems, startPolling, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAITyping) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputMessage;
    setInputMessage('');
    setIsAITyping(true);

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            query: currentQuery,
            prescription_id: prescriptionId,
            chat_session_id: sessionId || prescriptionId,
            user_id: 'current-user',
            channel: 'web'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.output || 'I received your question and will respond shortly.';
        const messageId = (Date.now() + 1).toString();
        
        await streamResponseText(responseText, messageId);
        
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }]);
    } finally {
      setIsAITyping(false);
    }
  };

  const streamResponseText = async (fullText: string, messageId: string) => {
    const words = fullText.split(' ');
    let currentText = '';
    
    const initialMessage = {
      id: messageId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, initialMessage]);
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: currentText }
            : msg
        )
      );
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isStreaming: false }
          : msg
      )
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What are the side effects?",
    "Can I take this with food?",
    "What if I miss a dose?",
    "Any drug interactions?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading prescription analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/${org}/dashboard`} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white">MediBridge</span>
                <p className="text-xs text-cyan-400 font-medium">AI Health Assistant</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAnalysisPanelOpen(!isAnalysisPanelOpen)}
                className="lg:hidden px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {isAnalysisPanelOpen ? 'Hide Analysis' : 'Show Analysis'}
              </button>
              <Link
                href={`/${org}/dashboard`}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-89px)]">
        
        <div className={`${isAnalysisPanelOpen ? 'w-full lg:w-[60%]' : 'hidden'} lg:block overflow-y-auto p-6 border-r border-white/10`}>
          
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Prescription Analysis</h2>
                <p className="text-sm text-gray-400">AI-powered insights from your prescription</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Patient</p>
                <p className="text-white font-semibold">{prescriptionData?.patient_name || 'Patient'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Doctor</p>
                <p className="text-white font-semibold">{prescriptionData?.doctor_name || 'Doctor'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="text-white font-semibold">
                  {prescriptionData?.created_at ? new Date(prescriptionData.created_at).toLocaleDateString() : 'Today'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${
                  isWaitingForAnalysis 
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isWaitingForAnalysis ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
                  {isWaitingForAnalysis ? 'Analyzing...' : 'Analyzed'}
                </span>
              </div>
            </div>
          </div>

          {isWaitingForAnalysis ? (
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Analysis in Progress</h3>
              <p className="text-gray-300 mb-4">
                Our AI is analyzing your prescription. This usually takes 20-30 seconds.
              </p>
              <p className="text-sm text-cyan-400">
                Chief Complaint: {prescriptionData?.chief_concern || prescriptionData?.chief_complaint || 'General analysis'}
              </p>
              <div className="mt-4 flex justify-center gap-1">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  AI Analysis Complete
                </h3>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {cleanText(analysisResult)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  💊 Prescribed Medicines
                </h3>
                {medicineItems.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-purple-300 mb-3">
                      {medicineItems.length} medicine(s) prescribed
                    </p>
                    {medicineItems.map((medicine, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-5 border border-purple-500/20 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-bold text-lg mb-1">{idx + 1}. {medicine.item_name}</p>
                            {medicine.purpose && (
                              <p className="text-purple-300 text-sm italic mb-2">{medicine.purpose}</p>
                            )}
                          </div>
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full">
                            {medicine.medicine_form || 'Tablet'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {medicine.dosage && (
                            <div className="bg-white/5 rounded-lg p-3 border border-purple-500/10">
                              <p className="text-xs text-gray-400 mb-1">Dosage</p>
                              <p className="text-white font-semibold text-sm">{medicine.dosage}</p>
                            </div>
                          )}
                          {medicine.frequency && (
                            <div className="bg-white/5 rounded-lg p-3 border border-purple-500/10">
                              <p className="text-xs text-gray-400 mb-1">Frequency</p>
                              <p className="text-white font-semibold text-sm">{medicine.frequency}</p>
                            </div>
                          )}
                          {medicine.timing && (
                            <div className="bg-white/5 rounded-lg p-3 border border-purple-500/10">
                              <p className="text-xs text-gray-400 mb-1">Timing</p>
                              <p className="text-white font-semibold text-sm">{medicine.timing}</p>
                            </div>
                          )}
                          {medicine.duration && (
                            <div className="bg-white/5 rounded-lg p-3 border border-purple-500/10">
                              <p className="text-xs text-gray-400 mb-1">Duration</p>
                              <p className="text-white font-semibold text-sm">{medicine.duration}</p>
                            </div>
                          )}
                        </div>
                        
                        {medicine.instructions && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ Important</p>
                            <p className="text-white text-sm">{medicine.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No medicines prescribed</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  🔬 Diagnostic Tests
                </h3>
                {testItems.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-cyan-300 mb-3">
                      {testItems.length} test(s) prescribed
                    </p>
                    {testItems.map((test, idx) => (
                      <div key={idx} className="bg-white/5 rounded-xl p-5 border border-cyan-500/20 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-bold text-lg mb-1">{idx + 1}. {test.item_name}</p>
                            {test.purpose && (
                              <p className="text-cyan-300 text-sm italic mb-2">{test.purpose}</p>
                            )}
                          </div>
                          {test.metadata?.fasting_required && (
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full">
                              Fasting Required
                            </span>
                          )}
                        </div>
                        
                        {test.instructions && (
                          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                            <p className="text-xs text-cyan-400 font-semibold mb-1">📋 Preparation</p>
                            <p className="text-white text-sm">{test.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No diagnostic tests prescribed</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className={`${!isAnalysisPanelOpen ? 'w-full' : 'hidden lg:flex'} lg:w-[40%] flex flex-col`}>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-white border border-purple-500/30'
                } rounded-2xl px-4 py-3`}>
                  {msg.sender === 'assistant' ? (
                    <div 
                      className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.text) }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <p className="text-xs opacity-70 mt-2">{msg.timestamp}</p>
                </div>
              </div>
            ))}

            {isAITyping && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="px-6 py-3 border-t border-white/10">
            <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1.5 bg-white/5 text-xs text-gray-300 rounded-lg hover:bg-white/10 hover:text-white border border-white/10 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about your prescription..."
                className="flex-1 px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                rows={2}
                disabled={isAITyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={isAITyping || !inputMessage.trim()}
                className="px-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}