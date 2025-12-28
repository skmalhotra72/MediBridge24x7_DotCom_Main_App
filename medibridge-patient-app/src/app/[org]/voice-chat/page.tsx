'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  ArrowLeft, 
  Loader2,
  Phone,
  PhoneOff,
  MessageSquare
} from 'lucide-react';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  timestamp: Date;
}

interface ConversationState {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  message: string;
}

export default function VoiceChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const org = params.org as string;
  const patientIdFromUrl = searchParams.get('patient_id');
  const supabase = createClient();

  // State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    status: 'idle',
    message: 'Tap the microphone to start speaking'
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [autoListen, setAutoListen] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  // Load patient data on mount
  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      // Get organization
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .or(`subdomain.eq.${org},slug.eq.${org}`)
        .single();

      if (orgData) {
        setOrganizationId(orgData.id);
      }

      // If patient_id is in URL, fetch that patient
      if (patientIdFromUrl) {
        const { data: patient } = await supabase
          .from('patients')
          .select('id, full_name, patient_name')
          .eq('id', patientIdFromUrl)
          .single();

        if (patient) {
          setPatientId(patient.id);
          setPatientName(patient.full_name || patient.patient_name || 'there');
          return;
        }
      }

      // Fallback: Get current user's patient profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${org}/auth`);
        return;
      }

      const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name, patient_name')
        .eq('auth_user_id', user.id)
        .limit(1);

      if (patients && patients.length > 0) {
        setPatientId(patients[0].id);
        setPatientName(patients[0].full_name || patients[0].patient_name || 'there');
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  // Start voice session with greeting
  const startSession = async () => {
    setIsSessionActive(true);
    setMessages([]);
    
    // Play greeting
    const greeting = `Hello ${patientName || 'there'}! I'm Dr. Bridge, your AI healthcare assistant. How can I help you today? You can ask me about your prescriptions, medicines, or any health concerns.`;
    
    const greetingMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: greeting,
      timestamp: new Date()
    };
    setMessages([greetingMessage]);
    
    await speakText(greeting);
  };

  // End voice session
  const endSession = () => {
    stopRecording();
    stopAudio();
    setIsSessionActive(false);
    setConversationState({ status: 'idle', message: 'Session ended' });
    
    // Navigate back to dashboard
    setTimeout(() => {
      router.push(`/${org}/dashboard`);
    }, 1000);
  };

  // Text-to-Speech
  const speakText = async (text: string): Promise<void> => {
    if (isMuted) {
      // If muted, skip to listening after a short delay
      if (autoListen) {
        setTimeout(() => startRecording(), 500);
      }
      return;
    }

    setConversationState({ status: 'speaking', message: 'Dr. Bridge is speaking...' });

    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: 'nova', // Friendly female voice
          speed: 1.0
        }),
      });

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Update message with audio URL
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
          updated[updated.length - 1].audioUrl = audioUrl;
        }
        return updated;
      });

      // Play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setConversationState({ status: 'idle', message: 'Tap microphone to speak' });
        // Auto-listen after AI finishes speaking
        if (autoListen && isSessionActive) {
          setTimeout(() => startRecording(), 500);
        }
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setConversationState({ status: 'idle', message: 'Tap microphone to speak' });
      };

      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      setConversationState({ status: 'idle', message: 'Tap microphone to speak' });
      // Still auto-listen even if TTS fails
      if (autoListen && isSessionActive) {
        setTimeout(() => startRecording(), 500);
      }
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (isRecordingRef.current) return;
    
    try {
      stopAudio(); // Stop any playing audio
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      isRecordingRef.current = true;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        isRecordingRef.current = false;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Only process if we have audio data
        if (audioBlob.size > 1000) {
          await processVoiceInput(audioBlob);
        } else {
          setConversationState({ status: 'idle', message: 'No audio detected. Tap to try again.' });
        }
      };

      mediaRecorder.start();
      setConversationState({ status: 'listening', message: 'Listening... Tap when done' });
      setCurrentTranscript('');

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (isRecordingRef.current) {
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('Microphone error:', error);
      setConversationState({ 
        status: 'error', 
        message: 'Microphone access denied. Please allow microphone permission.' 
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
      isRecordingRef.current = false;
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (conversationState.status === 'listening') {
      stopRecording();
    } else if (conversationState.status === 'idle' || conversationState.status === 'error') {
      startRecording();
    } else if (conversationState.status === 'speaking') {
      stopAudio();
      startRecording();
    }
  };

  // Process voice input
  const processVoiceInput = async (audioBlob: Blob) => {
    setConversationState({ status: 'processing', message: 'Processing your question...' });

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }

      const { text: transcription } = await transcribeResponse.json();
      setCurrentTranscript(transcription);

      // Check for end commands
      const lowerTranscript = transcription.toLowerCase();
      if (lowerTranscript.includes('bye') || 
          lowerTranscript.includes('goodbye') || 
          lowerTranscript.includes('end conversation') ||
          lowerTranscript.includes('stop')) {
        
        const farewellMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Goodbye! Take care and feel better soon. Remember to take your medicines on time!',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, farewellMessage]);
        await speakText(farewellMessage.content);
        
        setTimeout(() => endSession(), 2000);
        return;
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: transcription,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Step 2: Get AI response
      const aiResponse = await getAIResponse(transcription);

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Step 3: Speak the response
      await speakText(aiResponse);

    } catch (error) {
      console.error('Voice processing error:', error);
      setConversationState({ 
        status: 'error', 
        message: 'Sorry, I had trouble understanding. Please try again.' 
      });
      
      // Auto-retry listening
      if (autoListen && isSessionActive) {
        setTimeout(() => startRecording(), 2000);
      }
    }
  };

  // Get AI response from n8n webhook
  const getAIResponse = async (query: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          patient_id: patientId,
          organization_id: organizationId,
          input_type: 'voice',
          session_id: `voice-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('AI response failed');
      }

      const data = await response.json();
      return data.output || data.response || data.message || 
             "I'm sorry, I couldn't process your request. Please try again.";
    } catch (error) {
      console.error('AI response error:', error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  };

  // Render conversation state indicator
  const renderStateIndicator = () => {
    switch (conversationState.status) {
      case 'listening':
        return (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                <Mic className="w-16 h-16 text-white" />
              </div>
              {/* Sound wave animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white rounded-full animate-soundwave"
                      style={{
                        height: '20px',
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-lg text-red-400 animate-pulse">Listening...</p>
          </div>
        );
      
      case 'processing':
        return (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-yellow-500 flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            </div>
            <p className="mt-4 text-lg text-yellow-400">Processing...</p>
          </div>
        );
      
      case 'speaking':
        return (
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-teal-500 flex items-center justify-center">
                <Volume2 className="w-16 h-16 text-white animate-pulse" />
              </div>
              {/* Speaking animation */}
              <div className="absolute -inset-2 rounded-full border-4 border-teal-400 animate-ping opacity-30" />
              <div className="absolute -inset-4 rounded-full border-2 border-teal-300 animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="mt-4 text-lg text-teal-400">Dr. Bridge is speaking...</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center">
              <MicOff className="w-16 h-16 text-slate-400" />
            </div>
            <p className="mt-4 text-lg text-red-400">{conversationState.message}</p>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center">
            <button
              onClick={toggleRecording}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 flex items-center justify-center transition-all transform hover:scale-105 shadow-lg shadow-teal-500/30"
            >
              <Mic className="w-16 h-16 text-white" />
            </button>
            <p className="mt-4 text-lg text-slate-400">Tap to speak</p>
          </div>
        );
    }
  };

  // Not in session - show start screen
  if (!isSessionActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b border-slate-700/50">
          <button
            onClick={() => router.push(`/${org}/dashboard`)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-white">Voice Chat</h1>
          <div className="w-20" /> {/* Spacer */}
        </header>

        {/* Start Session Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30">
            <Mic className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Voice Chat</h2>
          <p className="text-slate-400 mb-8 max-w-sm">
            Have a hands-free conversation with Dr. Bridge AI about your prescriptions and health queries.
          </p>

          <button
            onClick={startSession}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-teal-500/30"
          >
            <Phone className="w-6 h-6" />
            Start Voice Chat
          </button>

          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl max-w-sm">
            <h3 className="text-sm font-medium text-white mb-2">💡 Tips:</h3>
            <ul className="text-xs text-slate-400 space-y-1 text-left">
              <li>• Speak clearly and naturally</li>
              <li>• Ask about your medicines, dosage, or side effects</li>
              <li>• Say "bye" or "goodbye" to end the conversation</li>
              <li>• Works in Hindi, English, or Hinglish</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Active session - show voice interface
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Dr. Bridge AI</h1>
            <p className="text-xs text-teal-400">Voice Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-full transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {/* End call button */}
          <button
            onClick={endSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="text-sm">End</span>
          </button>
        </div>
      </header>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-teal-500 text-white rounded-br-md'
                  : 'bg-slate-700 text-slate-100 rounded-bl-md'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-60">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Current transcript preview */}
        {currentTranscript && conversationState.status === 'processing' && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-teal-500/50 text-white rounded-br-md">
              <p className="text-sm italic">{currentTranscript}</p>
            </div>
          </div>
        )}
      </div>

      {/* Voice Control Area */}
      <div className="p-6 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur">
        <div className="flex flex-col items-center">
          {/* Main mic button / state indicator */}
          <div onClick={toggleRecording} className="cursor-pointer">
            {renderStateIndicator()}
          </div>

          {/* Auto-listen toggle */}
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setAutoListen(!autoListen)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                autoListen 
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {autoListen ? '🎤 Auto-listen ON' : '🎤 Auto-listen OFF'}
            </button>
          </div>

          {/* Switch to text chat */}
          <button
            onClick={() => router.push(`/${org}/chat`)}
            className="mt-4 flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Switch to Text Chat
          </button>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes soundwave {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        .animate-soundwave {
          animation: soundwave 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}