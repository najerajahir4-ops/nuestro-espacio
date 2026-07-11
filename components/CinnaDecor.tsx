'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function CinnaDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Top Left - Always visible */}
      <motion.div 
        className="absolute -top-8 -left-8 md:-top-16 md:-left-16 w-32 h-32 md:w-48 md:h-48 mix-blend-multiply dark:mix-blend-screen opacity-70"
        animate={{ y: [0, 10, 0], x: [0, 10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src="/images/cinna1.jpg" alt="Cinna" fill unoptimized className="object-contain" />
      </motion.div>

      {/* Bottom Right - Always visible */}
      <motion.div 
        className="absolute -bottom-8 -right-8 md:-bottom-16 md:-right-16 w-40 h-40 md:w-56 md:h-56 mix-blend-multiply dark:mix-blend-screen opacity-70"
        animate={{ y: [0, -15, 0], x: [0, -15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Image src="/images/cinna2.jpg" alt="Cinna" fill unoptimized className="object-contain" />
      </motion.div>

      {/* Center Left - Desktop only */}
      <motion.div 
        className="hidden md:block absolute top-1/3 -left-12 w-40 h-40 mix-blend-multiply dark:mix-blend-screen opacity-60"
        animate={{ x: [0, 15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <Image src="/images/cinna3.jpg" alt="Cinna" fill unoptimized className="object-contain" />
      </motion.div>

      {/* Top Right - Desktop only */}
      <motion.div 
        className="hidden md:block absolute -top-12 right-1/4 w-32 h-32 mix-blend-multiply dark:mix-blend-screen opacity-60"
        animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      >
        <Image src="/images/cinna4.jpg" alt="Cinna" fill unoptimized className="object-contain" />
      </motion.div>
      
      {/* Bottom Left - Desktop only */}
      <motion.div 
        className="hidden md:block absolute bottom-1/4 -left-16 w-48 h-48 mix-blend-multiply dark:mix-blend-screen opacity-60"
        animate={{ x: [0, 20, 0], y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <Image src="/images/cinna5.jpg" alt="Cinna" fill unoptimized className="object-contain" />
      </motion.div>
      
      {/* Top Center - Desktop only */}
      <motion.div 
        className="hidden md:block absolute -top-16 left-1/3 w-40 h-40 mix-blend-multiply dark:mix-blend-screen opacity-50"
        animate={{ y: [0, 25, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <Image src="/images/cinna6.jpg" alt="Cinna" fill unoptimized className="object-contain" />
      </motion.div>
    </div>
  );
}
