'use client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export type Mood = 'idle' | 'happy' | 'sleepy' | 'thinking' | 'typing' | 'relaxed' | 'online' | 'shy';

// MAPA DE IMÁGENES
// IMPORTANTE: Por favor, cambia el nombre del archivo en 'src' para que 
// corresponda a la imagen correcta de Cinnamoroll.
const MOOD_IMAGES: Record<Mood, { src: string, blend: boolean }> = {
  idle: { src: '/images/cinna1.jpg', blend: true }, // pose parada simple
  happy: { src: '/images/cinna2.jpg', blend: true }, // pose con la florecita
  sleepy: { src: '/images/cinna3.jpg', blend: true }, // acostada abrazando al gatito
  thinking: { src: '/images/cinna4.jpg', blend: true }, // enroscada mordiéndose la cola
  typing: { src: '/images/cinna5.jpg', blend: true }, // rostro gato ojos grandes
  relaxed: { src: '/images/cinna6.jpg', blend: true }, // lentes recostada
  online: { src: '/images/4.png', blend: false }, // Kuromi lazo celeste (blend en false)
  shy: { src: '/images/cinna8.jpg', blend: true }, // rostro boceto simple
};

export function MascotMood({ mood, className = "w-24 h-24" }: { mood: Mood; className?: string }) {
  const config = MOOD_IMAGES[mood] || MOOD_IMAGES.idle;
  
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
          src={config.src} 
          alt={`Mascot feeling ${mood}`} 
          fill 
          unoptimized
          className={`object-contain drop-shadow-sm ${config.blend ? 'mix-blend-multiply dark:mix-blend-screen' : ''}`} 
        />
      </motion.div>
    </AnimatePresence>
  );
}
