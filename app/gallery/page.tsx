'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, X, Upload, Trash2, Folder, Lock, Calendar, ArrowLeft, Image as ImageIcon, PlayCircle } from 'lucide-react';
import { MascotMood } from '@/components/MascotMood';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import dynamic from 'next/dynamic';
import Image from 'next/image';

const Lightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";

interface MediaItem {
  id: string;
  url: string;
  type: string;
  description: string;
  date: string;
  user: { name: string; colorTheme: string };
  albumId?: string | null;
}

interface AlbumItem {
  id: string;
  name: string;
  description?: string | null;
  hasPassword?: boolean;
  createdAt: string;
  user: { name: string };
  media: { url: string; type: string }[];
  _count: { media: number };
}

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Tab & Album Navigation State
  const [activeTab, setActiveTab] = useState<'all' | 'albums'>('all');
  const [activeAlbum, setActiveAlbum] = useState<AlbumItem | null>(null);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  
  // Date Filtering State
  const [dateFilterType, setDateFilterType] = useState<'all' | 'month' | 'year' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Create Album Form State
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [newAlbumHasPassword, setNewAlbumHasPassword] = useState(false);
  const [newAlbumPassword, setNewAlbumPassword] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  // Album Unlock State
  const [activeAlbumPassword, setActiveAlbumPassword] = useState('');
  const [albumToUnlock, setAlbumToUnlock] = useState<AlbumItem | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploadAlbumId, setUploadAlbumId] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAppStore((state) => state.user);

  const fetchAlbums = async () => {
    try {
      const res = await fetch('/api/albums');
      const data = await res.json();
      if (data.success) setAlbums(data.albums);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = '/api/gallery?';
      if (activeAlbum) {
        url += `albumId=${activeAlbum.id}&`;
        if (activeAlbumPassword) {
          url += `password=${encodeURIComponent(activeAlbumPassword)}&`;
        }
      }
      
      // Compute range query parameters
      let sDate = '';
      let eDate = '';
      if (dateFilterType === 'month') {
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        sDate = start.toISOString();
      } else if (dateFilterType === 'year') {
        const d = new Date();
        const start = new Date(d.getFullYear(), 0, 1);
        sDate = start.toISOString();
      } else if (dateFilterType === 'custom') {
        if (startDate) sDate = new Date(startDate).toISOString();
        if (endDate) eDate = new Date(endDate).toISOString();
      }

      if (sDate) url += `startDate=${sDate}&`;
      if (eDate) url += `endDate=${eDate}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setMedia(data.media);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Sync media list
  useEffect(() => {
    fetchMedia();
  }, [activeAlbum, dateFilterType, startDate, endDate, activeAlbumPassword]);

  // Sync albums list
  useEffect(() => {
    if (activeTab === 'albums') {
      fetchAlbums();
    }
  }, [activeTab]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('date', new Date().toISOString());
    // If we're inside a folder or selected one, pass albumId
    const targetAlbumId = activeAlbum ? activeAlbum.id : uploadAlbumId;
    if (targetAlbumId) {
      formData.append('albumId', targetAlbumId);
    }

    try {
      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setFile(null);
        setDescription('');
        setUploadAlbumId('');
        setShowModal(false);
        fetchMedia();
        // Update album list so thumbnail/count refreshes
        if (activeTab === 'albums') fetchAlbums();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    setCreatingAlbum(true);
    try {
      const body: any = { name: newAlbumName, description: newAlbumDesc };
      if (newAlbumHasPassword && newAlbumPassword) {
        body.password = newAlbumPassword;
      }
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setNewAlbumName('');
        setNewAlbumDesc('');
        setNewAlbumHasPassword(false);
        setNewAlbumPassword('');
        setShowCreateAlbumModal(false);
        fetchAlbums();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleUnlock = () => {
    if (albumToUnlock) {
      setActiveAlbum(albumToUnlock);
      setActiveAlbumPassword(unlockPassword);
      setActiveTab('all');
      setAlbumToUnlock(null);
      setUnlockPassword('');
      setUnlockError('');
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('¿Estás seguro de eliminar este álbum? Las fotos no se borrarán, solo quedarán sueltas.')) return;
    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveAlbum(null);
        setActiveTab('albums');
        fetchAlbums();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const slides = media.map((item) => {
    if (item.type === 'video') {
      const poster = item.url.replace('/upload/', '/upload/so_1,f_jpg/').replace(/\.\w+$/, '.jpg');
      return {
        type: 'video' as const,
        width: 1280,
        height: 720,
        poster,
        sources: [
          {
            src: item.url,
            type: "video/mp4"
          }
        ],
        itemData: item
      };
    }
    return {
      src: item.url,
      itemData: item
    };
  });

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-6xl mx-auto pb-24 md:pb-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {activeAlbum ? `Álbum: ${activeAlbum.name}` : 'Galería'}
          </h1>
          <p className="text-muted-foreground">
            {activeAlbum ? activeAlbum.description || 'Carpeta de recuerdos' : 'Nuestros recuerdos organizados.'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {activeAlbum && activeAlbum.user.name === user?.name && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDeleteAlbum(activeAlbum.id)}
              className="w-12 h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center shadow-md transition-colors"
              title="Eliminar álbum"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (activeAlbum) setUploadAlbumId(activeAlbum.id);
              setShowModal(true);
            }}
            className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/20"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>
      </header>

      {!activeAlbum && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex bg-muted/30 p-1.5 rounded-2xl w-full md:w-auto max-w-xs relative z-10">
            {[
              { id: 'all', label: 'Todas las fotos' },
              { id: 'albums', label: 'Álbumes' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setActiveAlbum(null);
                }}
                className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold relative z-10 transition-colors"
                style={{ color: activeTab === tab.id ? 'var(--accent-foreground)' : 'var(--muted-foreground)' }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="active-gallery-tab"
                    className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'all' && (
            <div className="flex flex-wrap items-center gap-2 bg-muted/15 p-1.5 rounded-2xl w-full md:w-auto">
              <span className="text-xs font-semibold text-muted-foreground px-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" /> Filtrar:
              </span>
              {[
                { id: 'all', label: 'Todo' },
                { id: 'month', label: 'Este mes' },
                { id: 'year', label: 'Este año' },
                { id: 'custom', label: 'Personalizado' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setDateFilterType(btn.id as any)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${dateFilterType === btn.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {btn.label}
                </button>
              ))}

              {dateFilterType === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 pl-2 border-l border-muted/50 ml-2"
                >
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-card text-[11px] font-medium border border-muted/50 rounded-xl px-2 py-1 outline-none text-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground">a</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-card text-[11px] font-medium border border-muted/50 rounded-xl px-2 py-1 outline-none text-foreground"
                  />
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {activeAlbum && (
        <div className="mb-6 flex items-center justify-between bg-accent/5 p-4 rounded-[2rem] border border-accent/10">
          <button
            onClick={() => {
              setActiveAlbum(null);
              setActiveAlbumPassword('');
              setActiveTab('albums');
            }}
            className="flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Álbumes</span>
          </button>
          <span className="text-xs text-muted-foreground font-semibold">
            Creado por {activeAlbum.user.name} • {activeAlbum._count.media} elementos
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <MascotMood mood="thinking" className="w-24 h-24" />
        </div>
      ) : (
        <>
          {activeTab === 'albums' && !activeAlbum ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ y: -4 }}
                onClick={() => setShowCreateAlbumModal(true)}
                className="border-2 border-dashed border-muted-foreground/30 hover:border-accent/50 rounded-[2rem] h-52 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/5 transition-all group"
              >
                <Folder className="w-10 h-10 text-muted-foreground group-hover:text-accent transition-colors mb-2" />
                <span className="text-xs font-bold text-muted-foreground group-hover:text-accent transition-colors">Nuevo Álbum</span>
              </motion.div>

              {albums.map((album) => {
                const cover = album.media[0];
                return (
                  <motion.div
                    whileHover={{ y: -4 }}
                    key={album.id}
                    onClick={() => {
                      if (album.hasPassword) {
                        setAlbumToUnlock(album);
                      } else {
                        setActiveAlbum(album);
                        setActiveTab('all');
                      }
                    }}
                    className="bg-card border border-muted/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-52 group"
                  >
                    <div className="relative h-36 bg-muted/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {cover ? (
                        cover.type === 'video' ? (
                          <video src={cover.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted />
                        ) : (
                        <div className="relative w-full h-full">
                          <Image src={cover.url} alt={album.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        )
                      ) : (
                        <Folder className="w-12 h-12 text-muted-foreground/45" />
                      )}
                      {album.hasPassword && (
                        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                        {album._count.media} {album._count.media === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-center">
                      <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-accent transition-colors">{album.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">Por {album.user.name}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 md:gap-2">
              {media.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <MascotMood mood="shy" className="w-32 h-32 mb-6" />
                  <p className="text-xl font-medium text-foreground">Aún no hay recuerdos aquí.</p>
                  <p className="text-muted-foreground mt-2">Sube la primera memoria tocando el botón +</p>
                </div>
              ) : (
                media.map((item, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 15) * 0.03 }}
                    key={item.id}
                    className="relative group cursor-pointer aspect-square bg-muted/20 overflow-hidden"
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    {item.type === 'video' ? (
                      <div className="relative w-full h-full">
                        <Image 
                          src={item.url.replace('/upload/', '/upload/so_1,f_jpg/').replace(/\.\w+$/, '.jpg')} 
                          alt={item.description || 'Video'} 
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Image 
                          src={item.url} 
                          alt={item.description || 'Recuerdo'} 
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                      {item.description && <p className="text-white font-medium text-xs mb-0.5 line-clamp-1">{item.description}</p>}
                      <p className="text-white/80 text-[10px]">
                        {format(new Date(item.date), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Unlock Album Modal */}
      <AnimatePresence>
        {albumToUnlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border border-muted"
            >
              <h3 className="text-lg font-bold mb-4 text-center">Álbum Privado 🔒</h3>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setAlbumToUnlock(null)} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
                <button onClick={handleUnlock} className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-lg shadow-accent/20">Desbloquear</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Album Modal */}
      <AnimatePresence>
        {showCreateAlbumModal && (
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
              className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl p-6 md:p-8 border border-muted"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Crear Nuevo Álbum 📁</h3>
                <button onClick={() => setShowCreateAlbumModal(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold ml-1 text-muted-foreground">Nombre del álbum</label>
                  <input
                    type="text"
                    required
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Ej. Viaje a la playa 🏖️"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold ml-1 text-muted-foreground">Descripción (opcional)</label>
                  <textarea
                    value={newAlbumDesc}
                    onChange={(e) => setNewAlbumDesc(e.target.value)}
                    placeholder="Agrega una nota corta sobre este álbum..."
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all resize-none h-20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="hasPassword" 
                    checked={newAlbumHasPassword} 
                    onChange={(e) => setNewAlbumHasPassword(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <label htmlFor="hasPassword" className="text-sm font-semibold text-muted-foreground cursor-pointer">
                    Proteger con contraseña
                  </label>
                </div>

                {newAlbumHasPassword && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1 mt-2"
                  >
                    <label className="text-xs font-semibold ml-1 text-muted-foreground">Contraseña</label>
                    <input
                      type="password"
                      required={newAlbumHasPassword}
                      value={newAlbumPassword}
                      onChange={(e) => setNewAlbumPassword(e.target.value)}
                      placeholder="Ingresa una contraseña segura"
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
                    />
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={creatingAlbum || !newAlbumName.trim()}
                  className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-70 mt-4 text-sm"
                >
                  {creatingAlbum ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Álbum'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Media Modal */}
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

                {/* Optional Album selection (Not shown if already inside an activeAlbum) */}
                {!activeAlbum && albums.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Vincular a un Álbum (opcional)</label>
                    <select
                      value={uploadAlbumId}
                      onChange={(e) => setUploadAlbumId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all text-foreground"
                    >
                      <option value="">Ninguno (subir suelta)</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>{album.name}</option>
                      ))}
                    </select>
                  </div>
                )}

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
                  className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-70 text-sm"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Recuerdo'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Media Modal (Lightbox) */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Zoom, Video]}
        zoom={{
          maxZoomPixelRatio: 4,
          scrollToZoom: true,
          doubleTapDelay: 300,
        }}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
        toolbar={{
          buttons: [
            (() => {
              const item = slides[lightboxIndex]?.itemData as MediaItem;
              if (item?.user.name === user?.name) {
                return (
                  <button 
                    key="delete"
                    type="button"
                    title="Eliminar"
                    className="yarl__button"
                    style={{ padding: '8px' }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm('¿Estás seguro de eliminar este recuerdo?')) return;
                      const res = await fetch(`/api/gallery/${item.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setLightboxOpen(false);
                        fetchMedia();
                        if (activeTab === 'albums') fetchAlbums();
                      }
                    }}
                  >
                    <Trash2 className="w-5 h-5 text-red-500 hover:text-red-400" />
                  </button>
                );
              }
              return null;
            })(),
            "close"
          ]
        }}
        render={{
          iconClose: () => <X className="w-6 h-6" />,
          slideFooter: () => {
            const item = slides[lightboxIndex]?.itemData as MediaItem;
            if (!item) return null;
            return (
              <div className="w-full text-center px-4 pb-6 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
                {item.description && (
                  <p className="text-white text-lg font-medium mb-1">{item.description}</p>
                )}
                <p className="text-white/70 text-sm">
                  Subido por {item.user.name} el {format(new Date(item.date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            );
          }
        }}
      />

    </div>
  );
}
