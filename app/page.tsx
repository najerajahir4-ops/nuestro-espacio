'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Camera, PenTool } from 'lucide-react';
import Image from 'next/image';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, partnerStatus } = useAppStore();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [daysTogether, setDaysTogether] = useState<number>(0);

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch start date from config
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.startDate) {
          const start = new Date(data.startDate);
          setStartDate(start);
          setDaysTogether(differenceInDays(new Date(), start));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
              className="w-24 h-24 bg-accent/20 rounded-3xl flex items-center justify-center mb-6"
            >
              <Heart className="w-12 h-12 text-accent fill-current animate-pulse" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-foreground"
            >
              Hola, {user?.name || 'amor'}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="p-6 md:p-12 md:ml-64 max-w-4xl mx-auto"
        >
          <header className="mb-10 pt-4 md:pt-0 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Nuestro Espacio</h1>
              <p className="text-muted-foreground mb-4">Bienvenido a nuestro rincón privado.</p>
              
              {/* Partner Status Mobile View */}
              {partnerStatus && (
                <div className="md:hidden inline-flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${partnerStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {partnerStatus.name} {partnerStatus.isOnline ? 'está en línea' : 'está desconectado'}
                  </span>
                </div>
              )}
            </div>
            <Image src="/images/3.png" alt="Happy Kuromi" width={80} height={80} className="w-20 h-20 animate-bounce drop-shadow-md hidden sm:block" />
          </header>

          <section className="mb-12">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-accent/10 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-sm"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Heart className="w-48 h-48 text-accent fill-current" />
              </div>
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-6 z-10"
              >
                <Calendar className="w-8 h-8 text-accent" />
              </motion.div>
              
              <h2 className="text-xl md:text-2xl font-medium text-foreground mb-2 z-10">Llevamos juntos</h2>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-6xl md:text-8xl font-black text-accent tracking-tighter mb-4 z-10 drop-shadow-sm"
              >
                {daysTogether} <span className="text-3xl md:text-4xl text-accent/70 font-bold">días</span>
              </motion.div>
              
              {startDate && (
                <p className="text-muted-foreground z-10 text-sm md:text-base font-medium">
                  Desde el {format(startDate, "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
            </motion.div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div 
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 z-10">
                <Camera className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 z-10">Recuerdos</h3>
              <p className="text-muted-foreground text-sm flex-1 z-10">Mira nuestras fotos y videos más recientes.</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden"
            >
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-4 z-10">
                <PenTool className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 z-10">Diario</h3>
              <p className="text-muted-foreground text-sm flex-1 z-10">Escribe lo que sientes hoy o lee mis notas.</p>
            </motion.div>
          </section>

          <section>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Nuestra Música</h3>
              <iframe 
                style={{ borderRadius: '16px' }} 
                src="https://open.spotify.com/embed/playlist/5MMmBjG3QRKZdDNcYmcXom?utm_source=generator&theme=0" 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowFullScreen={false} 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="w-full"
              ></iframe>
            </motion.div>
          </section>

        </motion.div>
      )}
    </div>
  );
}
