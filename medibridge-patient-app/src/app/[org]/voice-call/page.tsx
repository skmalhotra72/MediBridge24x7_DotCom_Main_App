'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  Loader2,
  Activity,
  AlertCircle,
  CheckCircle2,
  User,
  FileText,
  FlaskConical,
  MessageSquare,
  Pill,
  AlertTriangle
} from 'lucide-react';

// Types
interface PatientInfo {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  preferred_language: string | null;
  organization_id: string;
}

interface ContextLoaded {
  patient_name: string;
  prescriptions: number;
  medicines: number;
  lab_reports: number;
  lab_results: number;
  chat_sessions: number;
  escalations: number;
  doctors?: number;
  lab_tests?: number;
  clinic_context?: boolean;
}

interface TranscriptEntry {
  speaker: 'patient' | 'dr_bridge' | 'system';
  content: string;
  timestamp: Date;
}

type CallState = 'idle' | 'initializing' | 'loading_context' | 'ringing' | 'connected' | 'on_hold' | 'ending' | 'ended' | 'error';
type SpeakerState = 'idle' | 'patient_speaking' | 'ai_speaking' | 'processing';

export default function VoiceCallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const org = params.org as string;
  const patientId = searchParams.get('patient_id');
  
  const supabase = createClient();

  // State
  const [callState, setCallState] = useState<CallState>('idle');
  const [speakerState, setSpeakerState] = useState<SpeakerState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [voiceCallId, setVoiceCallId] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [contextLoaded, setContextLoaded] = useState<ContextLoaded | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // Audio controls
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Call stats
  const [callStats, setCallStats] = useState({
    duration: 0,
    patientMessages: 0,
    aiMessages: 0
  });
  
  // Transcript
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentAIText, setCurrentAIText] = useState('');

  // Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringAudioRef = useRef<{ oscillator: OscillatorNode; context: AudioContext } | null>(null);
  const greetingSentRef = useRef(false);
  const callStartTimeRef = useRef<Date | null>(null);
  const greetingCompleteRef = useRef(false);
  // Debug logger
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log('🎙️ VoiceCall:', logMessage);
    setDebugLogs(prev => [...prev.slice(-50), logMessage]);
  };

  // Load patient info on mount
  useEffect(() => {
    if (patientId) {
      loadPatientInfo();
    }
  }, [patientId]);

  // Call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      // Record call start time
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = new Date();
      }
      
      callTimerRef.current = setInterval(() => {
        setCallStats(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const loadPatientInfo = async () => {
    try {
      addLog('Loading patient info...');
      
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, full_name, age, gender, preferred_language, organization_id')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatientInfo(patient);
      addLog(`✅ Patient: ${patient.full_name}`);

      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', patient.organization_id)
        .single();

      if (orgData) {
        setOrganizationName(orgData.name);
      }
    } catch (err) {
      console.error('Error loading patient:', err);
      setError('Failed to load patient information');
      addLog(`❌ Failed to load patient`);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    if (!patientId || !patientInfo) {
      setError('Patient information not loaded');
      return;
    }

    try {
      setCallState('initializing');
      setError(null);
      setDebugLogs([]);
      setContextLoaded(null);
      setTranscript([]); // Reset transcript
      setCallStats({ duration: 0, patientMessages: 0, aiMessages: 0 }); // Reset stats
      callStartTimeRef.current = null; // Reset start time
      greetingSentRef.current = false;
greetingCompleteRef.current = false;
addLog('🚀 Starting voice call...');

      const organizationId = patientInfo.organization_id;

      // Step 1: Request microphone permission FIRST
      addLog('Step 1: Requesting microphone...');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        localStreamRef.current = stream;
        const audioTrack = stream.getAudioTracks()[0];
        // Start with mic muted until greeting completes
        audioTrack.enabled = false;
        addLog(`✅ Mic: ${audioTrack.label} (muted until greeting completes)`);
      } catch (micError: any) {
        addLog(`❌ Mic error: ${micError.message}`);
        throw new Error(`Microphone access denied. Please allow microphone and try again.`);
      }

      // Step 2: Loading context
      setCallState('loading_context');
      addLog('Step 2: Loading patient context from database...');
      addLog('   📋 Fetching prescriptions...');
      addLog('   💊 Fetching medicines...');
      addLog('   🔬 Fetching lab reports...');
      addLog('   💬 Fetching chat history...');
      addLog('   🏥 Fetching clinic & doctor info...');

      // Step 3: Get ephemeral token (this now includes FULL context loading)
      addLog('Step 3: Creating AI session with full patient context...');
      const tokenResponse = await fetch('/api/voice-call/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          organization_id: organizationId
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        addLog(`❌ Token error: ${tokenData.error}`);
        throw new Error(tokenData.error || 'Failed to get token');
      }

      addLog(`✅ Token received with context`);
      addLog(`Session: ${tokenData.session_id}`);
      setVoiceCallId(tokenData.voice_call_id);

      // Store context loaded info
      if (tokenData.context_loaded) {
        setContextLoaded(tokenData.context_loaded);
        addLog(`✅ CONTEXT LOADED FOR DR. BRIDGE:`);
        addLog(`   👤 Patient: ${tokenData.context_loaded.patient_name}`);
        addLog(`   📋 Prescriptions: ${tokenData.context_loaded.prescriptions}`);
        addLog(`   💊 Medicines: ${tokenData.context_loaded.medicines}`);
        addLog(`   💬 Chat Sessions: ${tokenData.context_loaded.chat_sessions}`);
        if (tokenData.context_loaded.doctors) {
          addLog(`   👨‍⚕️ Doctors: ${tokenData.context_loaded.doctors}`);
        }
        if (tokenData.context_loaded.lab_tests) {
          addLog(`   🧪 Lab Tests: ${tokenData.context_loaded.lab_tests}`);
        }
        if (tokenData.context_loaded.clinic_context) {
          addLog(`   🏥 Clinic Context: Loaded`);
        }
        if (tokenData.context_loaded.escalations) {
          addLog(`   ⚠️ Escalations: ${tokenData.context_loaded.escalations}`);
        }
      }

      // Step 4: Set ringing state
      setCallState('ringing');
      addLog('Step 4: Connecting to Dr. Bridge...');
      playRingTone();

      // Step 5: Create peer connection
      addLog('Step 5: Creating WebRTC connection...');
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Log state changes
      pc.onconnectionstatechange = () => {
        addLog(`🔗 Connection: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          addLog('🎉 WebRTC CONNECTED!');
        }
        if (pc.connectionState === 'failed') {
          setError('WebRTC connection failed');
          setCallState('error');
        }
      };

      pc.oniceconnectionstatechange = () => {
        addLog(`🧊 ICE: ${pc.iceConnectionState}`);
      };

      // Set up audio element
      addLog('Step 6: Setting up audio output...');
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.setAttribute('playsinline', 'true');
      audioEl.volume = 1.0;
      document.body.appendChild(audioEl);
      audioElementRef.current = audioEl;

      // Handle incoming audio track
      pc.ontrack = (event) => {
        addLog(`🎵 RECEIVED TRACK: ${event.track.kind}`);
        
        stopRingTone();
        
        if (event.streams && event.streams[0]) {
          audioEl.srcObject = event.streams[0];
          
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              addLog('🔊 Audio playback STARTED');
              setCallState('connected');
            }).catch(e => {
              addLog(`⚠️ Autoplay blocked: ${e.message}`);
              setCallState('connected');
            });
          }
        }
      };

      // Add LOCAL audio track
      addLog('Step 7: Adding microphone to connection...');
      const audioTrack = stream.getAudioTracks()[0];
      pc.addTrack(audioTrack, stream);

      // Create data channel
      addLog('Step 8: Creating data channel...');
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onopen = () => {
        addLog('✅ Data channel OPEN');
        
        // Wait a moment then trigger greeting
        setTimeout(() => {
          if (dc.readyState === 'open' && !greetingSentRef.current) {
            greetingSentRef.current = true;
            addLog('🎤 Triggering AI greeting with patient context...');
            
            // Create a conversation item to trigger greeting
            const createItem = {
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: 'Hello, I just connected to the call.'
                  }
                ]
              }
            };
            dc.send(JSON.stringify(createItem));
            
            // Then request a response
            setTimeout(() => {
              if (dc.readyState === 'open') {
                dc.send(JSON.stringify({ type: 'response.create' }));
              }
            }, 100);
          }
        }, 1000);
      };

      dc.onclose = () => addLog('Data channel closed');
      dc.onerror = (e) => addLog(`❌ Data channel error`);
      dc.onmessage = (event) => handleDataChannelMessage(event.data);

      // Create SDP offer
      addLog('Step 9: Creating SDP offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      await pc.setLocalDescription(offer);
      addLog('✅ Local SDP set');

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          const timeout = setTimeout(() => resolve(), 3000);
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              clearTimeout(timeout);
              resolve();
            }
          };
        }
      });

      // Send SDP to OpenAI
      addLog('Step 10: Connecting to OpenAI Realtime...');
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.token}`,
          'Content-Type': 'application/sdp'
        },
        body: pc.localDescription?.sdp
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        addLog(`❌ OpenAI error: ${errorText.substring(0, 100)}`);
        throw new Error(`OpenAI connection failed: ${sdpResponse.status}`);
      }

      // Set remote description
      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp
      });
      addLog('✅ Remote SDP set - Dr. Bridge is ready!');

    } catch (err: any) {
      console.error('Call error:', err);
      addLog(`❌ FAILED: ${err.message}`);
      stopRingTone();
      setError(err.message || 'Failed to start call');
      setCallState('error');
      cleanup();
    }
  };

  const handleDataChannelMessage = (data: string) => {
    try {
      const event = JSON.parse(data);
      const eventType = event.type;
      
      // Log important events
      if (!eventType.includes('audio.delta') && !eventType.includes('transcript.delta')) {
        addLog(`📨 ${eventType}`);
      }
      
      switch (eventType) {
        case 'session.created':
          addLog('✅ OpenAI session ready with patient context');
          break;

        case 'response.created':
          setSpeakerState('ai_speaking');
          break;

        case 'response.output_item.added':
          addLog(`Output: ${event.item?.type}`);
          break;

        case 'response.content_part.added':
          addLog(`Content: ${event.part?.type}`);
          break;

        case 'response.audio.delta':
          setSpeakerState('ai_speaking');
          break;
          
          case 'response.audio.done':
            setSpeakerState('idle');
            setCallStats(prev => ({ ...prev, aiMessages: prev.aiMessages + 1 }));
            addLog('🔊 AI audio complete');
            
            // Auto-unmute after first greeting completes
            if (!greetingCompleteRef.current) {
              greetingCompleteRef.current = true;
              addLog('✅ Greeting complete - enabling microphone');
              
              // Unmute the mic
              if (localStreamRef.current) {
                const track = localStreamRef.current.getAudioTracks()[0];
                if (track) {
                  track.enabled = true;
                  setIsMuted(false);
                  addLog('🎤 Microphone enabled - you can speak now');
                }
              }
            }
            break;

        case 'response.audio_transcript.delta':
          setCurrentAIText(prev => prev + (event.delta || ''));
          break;
          
        case 'response.audio_transcript.done':
          if (event.transcript) {
            setTranscript(prev => [...prev, {
              speaker: 'dr_bridge',
              content: event.transcript,
              timestamp: new Date()
            }]);
            setCurrentAIText('');
            addLog(`🤖 AI: "${event.transcript.substring(0, 60)}..."`);
          }
          break;
          
        case 'input_audio_buffer.speech_started':
          setSpeakerState('patient_speaking');
          addLog('🎤 You are speaking...');
          break;
          
        case 'input_audio_buffer.speech_stopped':
          setSpeakerState('processing');
          break;

        case 'input_audio_buffer.committed':
          addLog('Audio sent to AI');
          break;
          
        case 'conversation.item.input_audio_transcription.completed':
          if (event.transcript) {
            setTranscript(prev => [...prev, {
              speaker: 'patient',
              content: event.transcript,
              timestamp: new Date()
            }]);
            setCallStats(prev => ({ ...prev, patientMessages: prev.patientMessages + 1 }));
            addLog(`👤 You: "${event.transcript.substring(0, 60)}..."`);
          }
          break;

        case 'conversation.item.input_audio_transcription.failed':
          addLog(`⚠️ Transcription failed`);
          break;

        case 'response.done':
          setSpeakerState('idle');
          if (event.response?.status) {
            addLog(`Response: ${event.response.status}`);
          }
          break;
          
        case 'error':
          addLog(`❌ Error: ${event.error?.message || 'Unknown'}`);
          break;
      }
    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  const playRingTone = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      osc.type = 'sine';
      gain.gain.value = 0.1;
      osc.start();
      
      const pattern = () => {
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 1);
      };
      pattern();
      const interval = setInterval(pattern, 3000);
      
      ringAudioRef.current = { oscillator: osc, context: ctx };
      (ringAudioRef.current as any).interval = interval;
    } catch (err) {}
  };

  const stopRingTone = () => {
    if (ringAudioRef.current) {
      try {
        ringAudioRef.current.oscillator.stop();
        ringAudioRef.current.context.close();
        clearInterval((ringAudioRef.current as any).interval);
      } catch {}
      ringAudioRef.current = null;
    }
  };

  const endCall = async () => {
    addLog('📞 Ending call...');
    setCallState('ending');
    stopRingTone();

    const callEndTime = new Date();
    const finalDuration = callStats.duration;
    const finalTranscript = [...transcript]; // Capture final transcript

    // Cleanup WebRTC first
    cleanup();

    if (voiceCallId && patientInfo) {
      try {
        // Prepare transcript data
        const transcriptJsonb = finalTranscript.map(t => ({
          role: t.speaker === 'patient' ? 'user' : 'assistant',
          content: t.content,
          timestamp: t.timestamp.toISOString()
        }));
        
        const fullTranscriptText = finalTranscript
          .map(t => `[${t.speaker === 'patient' ? 'Patient' : 'Dr. Bridge'}]: ${t.content}`)
          .join('\n');

        // Step 1: Save transcript to database immediately
addLog(`💾 Saving transcript (${finalTranscript.length} messages, ${finalDuration}s)...`);
const { error: updateError } = await supabase
  .from('voice_calls')
  .update({
    call_status: 'completed',
    call_end_time: callEndTime.toISOString(),
    call_duration_seconds: finalDuration,
    full_transcript: fullTranscriptText || null,
    transcript: transcriptJsonb.length > 0 ? transcriptJsonb : null,
    transcript_word_count: fullTranscriptText ? fullTranscriptText.split(' ').length : 0
  })
  .eq('id', voiceCallId);

if (updateError) {
  addLog(`❌ Supabase error: ${updateError.message}`);
  console.error('Supabase update error:', updateError);
} else {
  addLog('✅ Transcript saved');
}

        // Step 2: Send to n8n for AI summarization (if there's meaningful content)
        if (finalTranscript.length >= 2) {
          setIsSummarizing(true);
          addLog('🤖 Sending to AI for summarization...');
          
          try {
            const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_VOICE_SUMMARY_WEBHOOK || 
              'https://n8n.nhcare.in/webhook/voice-call-summary';
            
            const summaryResponse = await fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                voice_call_id: voiceCallId,
                patient_id: patientInfo.id,
                patient_name: patientInfo.full_name,
                organization_id: patientInfo.organization_id,
                organization_slug: org,
                call_duration_seconds: finalDuration,
                call_started_at: callStartTimeRef.current?.toISOString(),
                call_ended_at: callEndTime.toISOString(),
                transcript: transcriptJsonb,
                transcript_text: fullTranscriptText,
                message_count: {
                  patient: callStats.patientMessages,
                  ai: callStats.aiMessages,
                  total: finalTranscript.length
                }
              })
            });

            if (summaryResponse.ok) {
              addLog('✅ Sent to AI for summarization');
            } else {
              addLog('⚠️ Summary webhook returned error, but transcript is saved');
            }
          } catch (webhookErr) {
            // Don't fail if webhook fails - transcript is already saved
            addLog('⚠️ Could not reach summary service, transcript saved locally');
            console.error('Webhook error:', webhookErr);
          }
          
          setIsSummarizing(false);
        } else {
          addLog('ℹ️ Call too short for summarization');
        }

        addLog('✅ Call data saved successfully');
      } catch (err) {
        console.error('Error saving call:', err);
        addLog('❌ Error saving call data');
      }
    }

    setCallState('ended');
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }
    stopRingTone();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
        addLog(`🎤 Mic ${track.enabled ? 'ON' : 'OFF'}`);
      }
    }
  };

  const toggleSpeaker = () => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
      addLog(`🔊 Speaker ${!isSpeakerOn ? 'ON' : 'OFF'}`);
    }
  };

  const goBack = () => {
    if (callState === 'connected' || callState === 'ringing') {
      if (confirm('End the call?')) {
        endCall();
        router.push(`/${org}/dashboard`);
      }
    } else {
      router.push(`/${org}/dashboard`);
    }
  };

  const getStatusMessage = () => {
    switch (callState) {
      case 'idle': return 'Ready to call';
      case 'initializing': return 'Preparing...';
      case 'loading_context': return 'Loading your medical records...';
      case 'ringing': return 'Connecting to Dr. Bridge...';
      case 'connected':
  if (speakerState === 'ai_speaking') return 'Dr. Bridge speaking...';
  if (!greetingCompleteRef.current) return 'Dr. Bridge speaking... (please wait)';
  if (speakerState === 'patient_speaking') return 'Listening...';
  if (speakerState === 'processing') return 'Processing...';
  return `Connected • ${formatDuration(callStats.duration)}`;
      case 'ending': return isSummarizing ? 'Saving & summarizing...' : 'Ending...';
      case 'ended': return 'Call ended';
      case 'error': return 'Call failed';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-700/50">
        <button onClick={goBack} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        
        <div className="flex items-center gap-4">
          {callState === 'connected' && (
            <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        {/* Avatar */}
        <div className={`relative ${callState === 'ringing' || speakerState === 'ai_speaking' ? 'animate-pulse' : ''}`}>
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-lg
            ${speakerState === 'ai_speaking' ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-500/40' 
              : speakerState === 'patient_speaking' ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/40'
              : callState === 'loading_context' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30'}
            ${speakerState === 'patient_speaking' ? 'ring-4 ring-emerald-400/50' : ''}`}
          >
            {callState === 'initializing' || callState === 'loading_context' || (callState === 'ending' && isSummarizing) ? 
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              : <Activity className="w-12 h-12 text-white" />}
          </div>
          {(callState === 'ringing' || speakerState === 'ai_speaking') && (
            <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" />
          )}
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Dr. Bridge AI</h1>
          <p className="text-cyan-400 text-sm font-medium">{organizationName || 'MediBridge'}</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {callState === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
          {callState === 'ended' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {(callState === 'loading_context' || (callState === 'ending' && isSummarizing)) && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
          <span className={`text-lg font-medium ${callState === 'error' ? 'text-red-400' : 'text-white'}`}>
            {getStatusMessage()}
          </span>
        </div>

        {/* Context Loading Indicator */}
        {callState === 'loading_context' && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-6 py-4 max-w-md">
            <p className="text-cyan-200 text-sm text-center">
              Loading your prescriptions, lab reports, clinic info, and medical history...
            </p>
          </div>
        )}

        {/* Context Loaded Badge - Shows what Dr. Bridge knows */}
        {contextLoaded && (callState === 'connected' || callState === 'ringing') && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 max-w-md">
            <p className="text-emerald-300 text-xs font-semibold mb-2 text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Dr. Bridge has access to your records:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center bg-slate-800/50 rounded-lg p-2">
                <FileText className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-white text-sm font-bold">{contextLoaded.prescriptions}</span>
                <span className="text-slate-400 text-xs">Rx</span>
              </div>
              <div className="flex flex-col items-center bg-slate-800/50 rounded-lg p-2">
                <Pill className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-white text-sm font-bold">{contextLoaded.medicines}</span>
                <span className="text-slate-400 text-xs">Meds</span>
              </div>
              <div className="flex flex-col items-center bg-slate-800/50 rounded-lg p-2">
                <MessageSquare className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-white text-sm font-bold">{contextLoaded.chat_sessions}</span>
                <span className="text-slate-400 text-xs">Chats</span>
              </div>
              {contextLoaded.doctors && contextLoaded.doctors > 0 && (
                <div className="flex flex-col items-center bg-slate-800/50 rounded-lg p-2">
                  <User className="w-4 h-4 text-cyan-400 mb-1" />
                  <span className="text-white text-sm font-bold">{contextLoaded.doctors}</span>
                  <span className="text-slate-400 text-xs">Doctors</span>
                </div>
              )}
              {contextLoaded.lab_tests && contextLoaded.lab_tests > 0 && (
                <div className="flex flex-col items-center bg-slate-800/50 rounded-lg p-2">
                  <FlaskConical className="w-4 h-4 text-cyan-400 mb-1" />
                  <span className="text-white text-sm font-bold">{contextLoaded.lab_tests}</span>
                  <span className="text-slate-400 text-xs">Lab Tests</span>
                </div>
              )}
              {contextLoaded.escalations > 0 && (
                <div className="flex flex-col items-center bg-slate-800/50 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mb-1" />
                  <span className="text-white text-sm font-bold">{contextLoaded.escalations}</span>
                  <span className="text-slate-400 text-xs">Alerts</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 max-w-md">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Patient */}
        {patientInfo && (
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
              <User className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-white font-semibold">{patientInfo.full_name}</p>
              <p className="text-slate-400 text-sm">
                {patientInfo.age ? `${patientInfo.age}Y` : ''}{patientInfo.gender ? ` • ${patientInfo.gender}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* AI Text (Live transcription) */}
        {callState === 'connected' && currentAIText && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-6 py-4 max-w-md">
            <p className="text-cyan-200 text-sm">{currentAIText}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleMute}
            disabled={callState !== 'connected'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border
              ${callState !== 'connected' ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border-slate-700/50'
                : isMuted ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
                : 'bg-slate-700/50 text-white border-slate-600 hover:bg-slate-700'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={callState === 'idle' || callState === 'error' || callState === 'ended' ? startCall : endCall}
            disabled={callState === 'initializing' || callState === 'loading_context' || callState === 'ending'}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg
              ${callState === 'idle' || callState === 'error' || callState === 'ended'
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-white shadow-emerald-500/30'
                : callState === 'initializing' || callState === 'loading_context' || callState === 'ending'
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-red-500/30'}`}
          >
            {callState === 'initializing' || callState === 'loading_context' || callState === 'ending' ? 
              <Loader2 className="w-8 h-8 animate-spin" />
              : callState === 'idle' || callState === 'error' || callState === 'ended' ? 
                <Phone className="w-8 h-8" />
              : <PhoneOff className="w-8 h-8" />}
          </button>

          <button
            onClick={toggleSpeaker}
            disabled={callState !== 'connected'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border
              ${callState !== 'connected' ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border-slate-700/50'
                : !isSpeakerOn ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
                : 'bg-slate-700/50 text-white border-slate-600 hover:bg-slate-700'}`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>

        {/* Idle instruction */}
        {callState === 'idle' && (
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Tap the green button to call Dr. Bridge.
            <br />
            <span className="text-slate-500">Dr. Bridge will have access to all your medical records.</span>
          </p>
        )}

        {/* Call Summary */}
        {callState === 'ended' && callStats.duration > 0 && (
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-white font-semibold text-center">Call Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-cyan-400">{formatDuration(callStats.duration)}</p>
                <p className="text-slate-400 text-xs">Duration</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{callStats.patientMessages}</p>
                <p className="text-slate-400 text-xs">You</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{callStats.aiMessages}</p>
                <p className="text-slate-400 text-xs">AI</p>
              </div>
            </div>
            
            {/* Transcript saved indicator */}
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Transcript saved to your records</span>
            </div>
            
            <button
              onClick={() => router.push(`/${org}/dashboard`)}
              className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl font-medium transition-colors border border-cyan-500/30"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Debug Toggle Link - Bottom Left (Subtle) */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 left-4 text-xs text-slate-600 hover:text-slate-400 transition-colors z-50"
      >
        {showDebug ? '🔧 Hide Debug' : '🔧 Debug'}
        {!showDebug && debugLogs.length > 0 && (
          <span className="ml-1 text-slate-500">({debugLogs.length})</span>
        )}
      </button>

      {/* Debug Panel - Shows when toggled */}
      {showDebug && (
        <div className="fixed bottom-12 left-4 w-[450px] max-h-80 overflow-auto bg-slate-900/95 rounded-lg p-3 text-xs font-mono border border-slate-700 shadow-xl z-40">
          <div className="flex justify-between items-center mb-2 sticky top-0 bg-slate-900/95 pb-2 border-b border-slate-700">
            <span className="text-cyan-400 font-bold">🔧 Debug ({debugLogs.length})</span>
            <button onClick={() => setDebugLogs([])} className="text-slate-400 hover:text-white">Clear</button>
          </div>
          {debugLogs.length === 0 ? (
            <p className="text-slate-500">No logs yet. Start a call to see debug info.</p>
          ) : (
            <div className="space-y-0.5">
              {debugLogs.map((log, i) => (
                <div key={i} className={`
                  ${log.includes('❌') ? 'text-red-400' : ''}
                  ${log.includes('✅') || log.includes('🎉') ? 'text-emerald-400' : ''}
                  ${log.includes('⚠️') ? 'text-yellow-400' : ''}
                  ${log.includes('🎵') || log.includes('🔊') ? 'text-cyan-400 font-bold' : ''}
                  ${log.includes('🔗') || log.includes('🧊') ? 'text-blue-400' : ''}
                  ${log.includes('🤖') ? 'text-cyan-400' : ''}
                  ${log.includes('👤') ? 'text-emerald-300' : ''}
                  ${log.includes('CONTEXT') ? 'text-cyan-300 font-bold' : ''}
                  ${log.includes('🏥') || log.includes('👨‍⚕️') ? 'text-cyan-400' : ''}
                  ${log.includes('💾') ? 'text-purple-400' : ''}
                  ${!log.match(/[❌✅⚠️🎵🔊🔗🧊🎉🤖👤🏥💾]/) && !log.includes('CONTEXT') ? 'text-slate-300' : ''}
                `}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}