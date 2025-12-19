'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
  transcription?: string;
  isUserMessage?: boolean;
}
export default function VoiceNotePlayer({ 
  audioUrl, 
  duration, 
  transcription,
  isUserMessage = true 
}: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset when audio URL changes
    setProgress(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || audioDuration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !duration) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate waveform bars (visual only)
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    const heights = [12, 18, 24, 16, 28, 20, 14, 26, 18, 22, 16, 24, 20, 28, 14, 22, 18, 26, 16, 20];
    return heights[i % heights.length];
  });

  return (
    <div className="flex flex-col gap-1 max-w-[280px]">
      <div className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
        isUserMessage 
          ? 'bg-cyan-500/20 border border-cyan-500/30' 
          : 'bg-gray-700/50 border border-gray-600/30'
      }`}>
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
        
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            isUserMessage
              ? 'bg-cyan-500 hover:bg-cyan-600'
              : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" />
          )}
        </button>
        
        {/* Waveform Visualization */}
        <div className="flex-1 flex items-center gap-[2px] h-8 overflow-hidden">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-full transition-colors duration-150 ${
                (i / waveformBars.length) * 100 < progress
                  ? isUserMessage ? 'bg-cyan-400' : 'bg-gray-400'
                  : isUserMessage ? 'bg-cyan-500/40' : 'bg-gray-500/40'
              }`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
        
        {/* Duration */}
        <span className={`text-xs tabular-nums flex-shrink-0 ${
          isUserMessage ? 'text-cyan-300' : 'text-gray-400'
        }`}>
          {isPlaying || currentTime > 0 
            ? formatTime(currentTime) 
            : formatTime(audioDuration)
          }
        </span>
      </div>
      
      {/* Transcription */}
      {transcription && (
        <p className={`text-xs italic px-2 ${
          isUserMessage ? 'text-cyan-300/70' : 'text-gray-400/70'
        }`}>
          "{transcription}"
        </p>
      )}
    </div>
  );
}