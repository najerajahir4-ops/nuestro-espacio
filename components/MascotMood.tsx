'use client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export type Mood = 'idle' | 'happy' | 'sleepy' | 'thinking' | 'typing' | 'relaxed' | 'online' | 'shy';

const MOOD_IMAGES: Record<Mood, string> = {
  idle: '/images/idle_pose.png',
  happy: '/images/flower_head.png',
  sleepy: '/images/sleeping_hug.png',
  thinking: '/images/curled_tail.png',
  typing: '/images/cat_face.png',
  relaxed: '/images/glasses_lying.png',
  online: '/images/bow_baby.png',
  shy: '/images/sketch_face.png',
};

export function MascotMood({ mood, className = "w-24 h-24" }: { mood: Mood; className?: string }) {
  const src = MOOD_IMAGES[mood] || MOOD_IMAGES.idle;
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mood}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative ${className}`}
      >
        <Image 
          src={src} 
          alt={`Mascot feeling ${mood}`} 
          fill 
          unoptimized
          className="object-contain drop-shadow-sm" 
        />
      </motion.div>
    </AnimatePresence>
  );
}
