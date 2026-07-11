'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within an AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactedRef = useRef(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedMuted = localStorage.getItem('app_isMuted');
    const savedVolume = localStorage.getItem('app_volume');
    if (savedMuted !== null) setIsMuted(savedMuted === 'true');
    if (savedVolume !== null) setVolumeState(parseFloat(savedVolume));
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted || volume === 0;
    }
  }, [volume, isMuted]);

  // Global interaction listener for autoplay
  useEffect(() => {
    const handleInteraction = () => {
      if (interactedRef.current) return;
      interactedRef.current = true;
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error("Audio playback failed", err);
        });
      }
      // Remove listeners once interacted
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('app_isMuted', String(next));
      if (!next && volume === 0) {
        // If unmuting but volume is 0, restore it to a sensible default
        const newVol = 0.5;
        setVolumeState(newVol);
        localStorage.setItem('app_volume', String(newVol));
      }
      return next;
    });
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    localStorage.setItem('app_volume', String(v));
    if (v === 0) {
      setIsMuted(true);
      localStorage.setItem('app_isMuted', 'true');
    } else if (isMuted) {
      setIsMuted(false);
      localStorage.setItem('app_isMuted', 'false');
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, isMuted, volume, toggleMute, setVolume }}>
      <audio ref={audioRef} src="/images/background-music.mp3" loop preload="auto" />
      {children}
      <MuteButton />
    </AudioContext.Provider>
  );
}

function MuteButton() {
  const { isMuted, volume, toggleMute } = useAudio();
  const showMuted = isMuted || volume === 0;

  return (
    <motion.button
      onClick={toggleMute}
      whileHover={{ scale: 1.1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed top-4 right-4 md:top-auto md:bottom-6 md:right-auto md:left-6 z-50 p-3 md:p-4 bg-card/80 backdrop-blur-md border border-muted/50 rounded-full shadow-lg text-foreground opacity-70 transition-colors hover:bg-card hover:border-accent hover:text-accent group"
      aria-label={showMuted ? "Unmute music" : "Mute music"}
    >
      <AnimatePresence mode="wait">
        {showMuted ? (
          <motion.div
            key="muted"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <VolumeX className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="unmuted"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Volume2 className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
