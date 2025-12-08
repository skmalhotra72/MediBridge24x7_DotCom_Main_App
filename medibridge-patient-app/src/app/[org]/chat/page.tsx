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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  // Function to fetch AI response from database
  const fetchAIResponse = useCallback(async () => {
    if (!prescriptionId) return null;

    try {
      // Check messages table for AI response
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

      // Also check prescription for ai_summary
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
        
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        // Extract the message text
        const responseText = aiResponse.message || aiResponse.content || aiResponse.ai_summary || '';
        
        setAnalysisResult(responseText);
        setIsWaitingForAnalysis(false);

        // Add AI message to chat
        setMessages(prev => {
          // Check if we already have this message
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

      // Stop polling after 60 seconds (30 attempts at 2 second intervals)
      if (pollCountRef.current >= 30) {
        console.log('⏱️ Polling timeout - stopping');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setIsWaitingForAnalysis(false);
      }
    }, 2000); // Poll every 2 seconds
  }, [fetchAIResponse]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Fetch prescription and messages on mount
  useEffect(() => {
    if (!prescriptionId) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch prescription
        const { data: prescription, error: prescError } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('id', prescriptionId)
          .single();

        if (prescError) throw prescError;
        setPrescriptionData(prescription);

        // Check if we already have an AI response
        const existingAIResponse = await fetchAIResponse();
        
        if (existingAIResponse) {
          console.log('✅ Found existing AI response');
          const responseText = existingAIResponse.message || existingAIResponse.content || existingAIResponse.ai_summary || '';
          setAnalysisResult(responseText);
          setIsWaitingForAnalysis(false);
          
          // Set initial messages with AI response
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
          // No AI response yet, set welcome message and start polling
          setMessages([{
            id: 'welcome',
            sender: 'assistant',
            text: "Hello! I'm Dr. Bridge, your AI healthcare assistant. I've analyzed your prescription and I'm here to answer any questions you have about your medicines, dosages, and treatment plan. What would you like to know?",
            timestamp: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          }]);
          
          // Start polling for AI response
          startPolling();
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [prescriptionId, sessionId, fetchAIResponse, startPolling, supabase]);

  // Auto-scroll to bottom
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
    setInputMessage('');
    setIsAITyping(true);

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            query: inputMessage,
            prescription_id: prescriptionId,
            chat_session_id: sessionId || prescriptionId,
            user_id: 'current-user',
            channel: 'web'
          }
        })
      });

      console.log('📦 Webhook response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Webhook response data:', data);
        console.log('📝 AI Output:', data.output);
        
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: data.output || 'I received your question and will respond shortly.',
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        console.log('💬 AI Message object:', aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('❌ Webhook failed with status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsAITyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick question handlers
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
      {/* Navigation */}
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

      {/* Main Content */}
      <div className="flex h-[calc(100vh-89px)]">
        
        {/* Left Panel - Analysis (Desktop: 60% / Mobile: Full) */}
        <div className={`${isAnalysisPanelOpen ? 'w-full lg:w-[60%]' : 'hidden'} lg:block overflow-y-auto p-6 border-r border-white/10`}>
          
          {/* Prescription Analysis Header */}
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

          {/* Analysis Content */}
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
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Analysis Complete
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {analysisResult}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Panel - Chat (Desktop: 40% / Mobile: Full) */}
        <div className={`${!isAnalysisPanelOpen ? 'w-full' : 'hidden lg:flex'} lg:w-[40%] flex flex-col`}>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-white border border-purple-500/30'
                } rounded-2xl px-4 py-3`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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

          {/* Quick Questions */}
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

          {/* Chat Input */}
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