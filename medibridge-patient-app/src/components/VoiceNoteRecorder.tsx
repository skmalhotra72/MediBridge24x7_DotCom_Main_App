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

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

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
    if (disabled) return;
    
    console.log('🎤 Starting recording...');
    
    try {
      chunksRef.current = [];
      durationRef.current = 0;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        } 
      });
      
      streamRef.current = stream;
      startAudioLevelMonitoring(stream);
      
      // Use webm which works best with Whisper
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }
      
      console.log('🎤 Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('🎤 Chunk received:', e.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎤 MediaRecorder stopped');
        
        // Cleanup
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch (e) {}
        }
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        const finalDuration = durationRef.current;
        const totalSize = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
        
        console.log('🎤 Final duration:', finalDuration, 'seconds');
        console.log('🎤 Total size:', totalSize, 'bytes');
        console.log('🎤 Chunks:', chunksRef.current.length);
        
        setDuration(0);
        setAudioLevel(0);
        
        if (chunksRef.current.length > 0 && finalDuration >= 1) {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          console.log('🎤 Created blob:', audioBlob.size, 'bytes');
          onRecordingComplete(audioBlob, finalDuration);
        } else {
          console.warn('🎤 Recording too short:', finalDuration, 'seconds');
          alert('Please record for at least 2 seconds. Click the mic to start, speak, then click again to stop.');
        }
      };

      // Request data every 500ms
      mediaRecorder.start(500);
      setIsRecording(true);
      onRecordingStart?.();
      
      // Duration timer
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
      console.error('🎤 Error:', err);
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found.');
      } else {
        alert('Microphone error: ' + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('🎤 Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-sm text-red-400 font-medium tabular-nums">
            {formatDuration(duration)}
          </span>
          <div className="w-12 h-1.5 bg-red-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-75"
              style={{ width: `${Math.min(100, audioLevel * 2)}%` }}
            />
          </div>
        </div>
      )}
      
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`p-3 rounded-full transition-all duration-200 ${
          isRecording 
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/30 animate-pulse' 
            : 'bg-cyan-500 hover:bg-cyan-600 hover:scale-105'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
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