'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, X, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MediaItem {
  id: string;
  url: string;
  type: string;
  description: string;
  date: string;
  user: { name: string; colorTheme: string };
}

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.success) setMedia(data.media);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('date', new Date().toISOString());

    try {
      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setFile(null);
        setDescription('');
        setShowModal(false);
        fetchMedia();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-6xl mx-auto pb-24 md:pb-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Galería</h1>
          <p className="text-muted-foreground">Nuestros recuerdos capturados.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/20"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {media.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <img src="/images/1.png" alt="Sorprendido" className="w-48 h-48 rounded-[2rem] shadow-xl mb-6 opacity-90" />
              <p className="text-xl font-medium text-foreground">Aún no hay fotos.</p>
              <p className="text-muted-foreground mt-2">Sube la primera memoria tocando el botón +</p>
            </div>
          ) : (
            media.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id}
                className="break-inside-avoid relative group cursor-pointer"
                onClick={() => setSelectedMedia(item)}
              >
                {item.type === 'video' ? (
                  <video 
                    src={item.url} 
                    className="w-full rounded-[2rem] object-cover shadow-sm bg-muted/30"
                    muted
                    loop
                    playsInline
                    onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseOut={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt={item.description || 'Recuerdo'} 
                    className="w-full rounded-[2rem] object-cover shadow-sm bg-muted/30" 
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[2rem] flex flex-col justify-end p-6">
                  {item.description && <p className="text-white font-medium mb-1 line-clamp-2">{item.description}</p>}
                  <p className="text-white/80 text-xs">
                    {format(new Date(item.date), "d MMM yyyy", { locale: es })} • {item.user.name}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 border border-muted"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Subir Recuerdo</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-[2rem] h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {file ? file.name : 'Toca para seleccionar foto o video'}
                  </span>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*,video/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden" 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium ml-1">Nota o descripción (opcional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Escribe algo sobre este momento..."
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none transition-all resize-none h-24"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-70"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Recuerdo'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'video' ? (
                <video 
                  src={selectedMedia.url} 
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                />
              ) : (
                <img 
                  src={selectedMedia.url} 
                  alt={selectedMedia.description}
                  className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                />
              )}
              
              <div className="w-full max-w-3xl mt-6 text-center">
                {selectedMedia.description && (
                  <p className="text-white text-lg font-medium mb-2">{selectedMedia.description}</p>
                )}
                <p className="text-white/60 text-sm">
                  Subido por {selectedMedia.user.name} el {format(new Date(selectedMedia.date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>

              <button 
                onClick={() => setSelectedMedia(null)}
                className="absolute top-0 right-0 md:-top-12 md:-right-12 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
