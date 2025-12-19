'use client';

import { useState, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface AudioResponsePlayerProps {
  audioUrl?: string;
}

export default function AudioResponsePlayer({ audioUrl }: AudioResponsePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (!audioUrl) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.error('Failed to play audio:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    console.error('Audio playback error');
  };

  if (!audioUrl) return null;

  return (
    <div className="inline-flex items-center gap-2 mt-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onError={handleError}
        preload="none"
      />
      
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/30 rounded-full transition-colors text-sm text-gray-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : isPlaying ? (
          <>
            <VolumeX className="w-4 h-4" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            <span>Listen</span>
          </>
        )}
      </button>
    </div>
  );
}