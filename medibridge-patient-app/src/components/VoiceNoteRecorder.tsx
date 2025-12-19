'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onRecordingStart?: () => void;
  disabled?: boolean;
  maxDuration?: number;
}

export default function VoiceNoteRecorder({ 
  onRecordingComplete,
  onRecordingStart,
  disabled = false,
  maxDuration = 60 
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedMimeTypeRef = useRef<string>('audio/webm');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Monitor audio levels to verify mic is capturing
  const startAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkLevel = () => {
        if (!analyserRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average);
        
        animationFrameRef.current = requestAnimationFrame(checkLevel);
      };
      
      checkLevel();
    } catch (err) {
      console.warn('Could not start audio monitoring:', err);
    }
  };

  const startRecording = async () => {
    if (disabled || isRecording) return;
    
    console.log('🎤 VoiceNoteRecorder: Starting...');
    
    try {
      chunksRef.current = [];
      durationRef.current = 0;
      
      // Enhanced audio constraints for better capture
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 },
        } 
      });
      
      streamRef.current = stream;
      
      // Log audio track info
      const audioTrack = stream.getAudioTracks()[0];
      console.log('🎤 Audio track:', audioTrack.label);
      console.log('🎤 Track settings:', JSON.stringify(audioTrack.getSettings()));
      
      // Start audio level monitoring
      startAudioLevelMonitoring(stream);
      
      // Try OGG first, then other formats - OGG has better Whisper compatibility
      const mimeTypes = [
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
      ];
      
      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log('🎤 Selected MIME type:', type);
          break;
        }
      }
      
      // Fallback if nothing supported
      if (!mimeType) {
        mimeType = 'audio/webm';
        console.warn('🎤 No preferred MIME type supported, using default:', mimeType);
      }
      
      // Store the MIME type for later use when creating the blob
      recordedMimeTypeRef.current = mimeType;
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('🎤 Chunk:', e.data.size, 'bytes, total chunks:', chunksRef.current.length);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎤 Recording stopped');
        
        // Stop audio monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        const finalDuration = durationRef.current;
        setDuration(0);
        setAudioLevel(0);
        
        console.log('🎤 Final duration:', finalDuration, 'seconds');
        console.log('🎤 Total chunks:', chunksRef.current.length);
        
        const totalSize = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
        console.log('🎤 Total size:', totalSize, 'bytes');
        
        if (chunksRef.current.length > 0 && totalSize > 1000) {
          // Use the actual MIME type that was used for recording
          const actualMimeType = mediaRecorder.mimeType || recordedMimeTypeRef.current;
          const audioBlob = new Blob(chunksRef.current, { type: actualMimeType });
          console.log('🎤 Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
          onRecordingComplete(audioBlob, Math.max(1, finalDuration));
        } else {
          console.warn('🎤 Recording too short or no data');
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('🎤 MediaRecorder error:', e);
      };

      // Start recording with 250ms timeslice
      mediaRecorder.start(250);
      setIsRecording(true);
      onRecordingStart?.();
      
      console.log('🎤 Recording started with MIME type:', mimeType);
      
      setDuration(0);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error('🎤 Microphone error:', err);
      
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone.');
      } else {
        alert('Could not access microphone: ' + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🎤 Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate visual indicator size based on audio level
  const levelIndicatorSize = Math.min(100, Math.max(0, audioLevel)) / 100;

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
          <span 
            className="w-2 h-2 bg-red-500 rounded-full transition-transform"
            style={{ transform: `scale(${1 + levelIndicatorSize})` }}
          />
          <span className="text-sm text-red-400 font-medium tabular-nums">
            {formatDuration(duration)}
          </span>
          {/* Audio level indicator */}
          <div className="w-12 h-1.5 bg-red-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-75"
              style={{ width: `${Math.min(100, audioLevel * 2)}%` }}
            />
          </div>
        </div>
      )}
      
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={isRecording ? stopRecording : undefined}
        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
        disabled={disabled}
        className={`p-3 rounded-full transition-all duration-200 ${
          isRecording 
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/30' 
            : 'bg-cyan-500 hover:bg-cyan-600 hover:scale-105'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isRecording ? 'Release to send' : 'Hold to record'}
      >
        {isRecording ? (
          <Square className="w-5 h-5 text-white fill-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
}