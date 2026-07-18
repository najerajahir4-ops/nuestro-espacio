'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Camera, PenTool, PlayCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { MascotMood } from '@/components/MascotMood';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { GalleryLightbox, MediaItem } from '@/components/GalleryLightbox';
import { formatImageUrl } from '@/lib/cloudinary';


export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, partnerStatus } = useAppStore();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [daysTogether, setDaysTogether] = useState<number>(0);

  // Recent Memories State
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const fetchRecentMedia = () => {
    fetch('/api/gallery?limit=6')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRecentMedia(data.media);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMedia(false));
  };

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

    fetchRecentMedia();
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
          className="p-6 md:p-12 md:ml-64 max-w-4xl mx-auto pb-24 md:pb-12"
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
              
              <div className="flex items-center justify-center gap-4 z-10 mb-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center"
                >
                  <Calendar className="w-8 h-8 text-accent" />
                </motion.div>
                
                <MascotMood mood="happy" className="w-24 h-24 hidden sm:block" />
              </div>
              
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
            <Link href="/gallery" className="block">
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden h-full cursor-pointer"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 z-10">
                  <Camera className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 z-10">Recuerdos</h3>
                <p className="text-muted-foreground text-sm flex-1 z-10">Mira nuestras fotos y videos más recientes.</p>
              </motion.div>
            </Link>

            <Link href="/journal" className="block">
              <motion.div 
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm flex flex-col relative overflow-hidden h-full cursor-pointer"
              >
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mb-4 z-10">
                  <PenTool className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 z-10">Diario</h3>
                <p className="text-muted-foreground text-sm flex-1 z-10">Escribe lo que sientes hoy o lee mis notas.</p>
              </motion.div>
            </Link>
          </section>

          {/* Recent Memories Section */}
          <section>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Recuerdos Recientes</h3>
              </div>

              {loadingMedia ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MascotMood mood="thinking" className="w-24 h-24 mb-4" />
                  <p className="text-muted-foreground font-medium animate-pulse">Buscando recuerdos...</p>
                </div>
              ) : recentMedia.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                    {recentMedia.map((item, index) => {
                      const isVideo = item.type === 'video';
                      const displayUrl = formatImageUrl(item.url);
                      const thumbnailUrl = isVideo 
                        ? displayUrl.replace('/upload/', '/upload/w_400,h_400,c_fill,so_1,f_jpg/').replace(/\.\w+$/, '.jpg')
                        : displayUrl.replace('/upload/', '/upload/w_400,h_400,c_fill/');

                      return (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm group"
                          onClick={() => {
                            setLightboxIndex(index);
                            setLightboxOpen(true);
                          }}
                        >
                          <Image 
                            src={thumbnailUrl} 
                            alt={item.description || 'Recuerdo reciente'} 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            unoptimized
                          />
                          {isVideo && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                              <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center">
                    <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors bg-accent/10 px-5 py-2.5 rounded-full">
                      Ver todos los recuerdos
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MascotMood mood="shy" className="w-24 h-24 mb-4" />
                  <p className="text-muted-foreground mb-4">Aún no hay recuerdos aquí.<br/>¡Sube el primero!</p>
                  <Link href="/gallery" className="inline-flex items-center gap-2 text-sm font-medium bg-accent text-accent-foreground px-5 py-2.5 rounded-full shadow-md hover:bg-accent/90 transition-colors">
                    <Camera className="w-4 h-4" />
                    Ir a la Galería
                  </Link>
                </div>
              )}
            </motion.div>
          </section>

        </motion.div>
      )}

      {/* Reusable Lightbox */}
      <GalleryLightbox
        media={recentMedia}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        currentUserName={user?.name}
        onDelete={async (id) => {
          const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setLightboxOpen(false);
            fetchRecentMedia();
          }
        }}
      />
    </div>
  );
}
