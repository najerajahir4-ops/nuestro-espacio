'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, X, Upload, Trash2, Folder, Lock, Calendar, ArrowLeft, Image as ImageIcon, PlayCircle, Pin, Edit2 } from 'lucide-react';
import { MascotMood } from '@/components/MascotMood';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { GalleryLightbox, MediaItem } from '@/components/GalleryLightbox';
import { formatImageUrl } from '@/lib/cloudinary';
import Image from 'next/image';


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
  const [activeTab, setActiveTab] = useState<'all' | 'albums'>('albums');
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

  // Edit Album Form State
  const [showEditAlbumModal, setShowEditAlbumModal] = useState(false);
  const [editAlbumName, setEditAlbumName] = useState('');
  const [editAlbumDesc, setEditAlbumDesc] = useState('');
  const [editAlbumHasPassword, setEditAlbumHasPassword] = useState(false);
  const [editAlbumPassword, setEditAlbumPassword] = useState('');
  const [updatingAlbum, setUpdatingAlbum] = useState(false);

  // Album Unlock State
  const [activeAlbumPassword, setActiveAlbumPassword] = useState('');
  const [albumToUnlock, setAlbumToUnlock] = useState<AlbumItem | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Upload Form State
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ name: string; url: string; type: string; isHeic?: boolean }[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');
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

  const clearSelection = () => {
    previews.forEach(p => URL.revokeObjectURL(p.url));
    setFiles([]);
    setPreviews([]);
    setDescription('');
    setUploadAlbumId('');
    setUploadProgress('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const newFiles = [...files];
    newFiles.splice(index, 1);
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    previews.forEach(p => URL.revokeObjectURL(p.url));

    const newPreviews = selectedFiles.map(file => {
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      return {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        isHeic
      };
    });

    setFiles(selectedFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress('Obteniendo firma de subida...');

    try {
      // 1. Obtener la firma del backend
      const signRes = await fetch('/api/gallery/upload/signature', { method: 'POST' });
      const signData = await signRes.json();
      if (!signRes.ok || !signData.success) {
        throw new Error(signData.error || 'Error al autorizar la subida en Cloudinary');
      }

      const { signature, timestamp, apiKey, cloudName, folder } = signData;

      // 2. Subir cada archivo secuencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Subiendo archivo ${i + 1} de ${files.length}...`);

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('api_key', apiKey);
        uploadFormData.append('timestamp', timestamp.toString());
        uploadFormData.append('signature', signature);
        uploadFormData.append('folder', folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json();
          throw new Error(uploadError.error?.message || `Error al subir el archivo: ${file.name}`);
        }

        const uploadData = await uploadRes.json();
        const secureUrl = uploadData.secure_url;
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';

        // 3. Guardar registro en la base de datos de Next.js
        const targetAlbumId = activeAlbum ? activeAlbum.id : uploadAlbumId;
        const saveRes = await fetch('/api/gallery/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: secureUrl,
            type: fileType,
            description,
            date: new Date().toISOString(),
            albumId: targetAlbumId || null,
          }),
        });

        if (!saveRes.ok) {
          const saveError = await saveRes.json();
          throw new Error(saveError.error || `Error al guardar en base de datos: ${file.name}`);
        }
      }

      clearSelection();
      setShowModal(false);
      fetchMedia();
      if (activeTab === 'albums') fetchAlbums();

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Ocurrió un error inesperado al subir los archivos.');
    } finally {
      setUploading(false);
      setUploadProgress('');
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

  const handleEditAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlbum || !editAlbumName.trim()) return;

    setUpdatingAlbum(true);
    try {
      const body: any = { 
        name: editAlbumName, 
        description: editAlbumDesc,
        password: editAlbumHasPassword ? editAlbumPassword : null
      };
      const res = await fetch(`/api/albums/${activeAlbum.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.album) {
        const updatedAlbum = {
          ...activeAlbum,
          name: data.album.name,
          description: data.album.description,
          hasPassword: !!data.album.password
        };
        setActiveAlbum(updatedAlbum);
        if (editAlbumHasPassword && editAlbumPassword) {
          setActiveAlbumPassword(editAlbumPassword);
        } else if (!editAlbumHasPassword) {
          setActiveAlbumPassword('');
        }
        setShowEditAlbumModal(false);
        fetchAlbums();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAlbum(false);
    }
  };

  const handleTogglePin = async (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/gallery/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !item.isPinned })
      });
      const data = await res.json();
      if (data.success) {
        fetchMedia();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleUnlock = async () => {
    if (!albumToUnlock) return;
    
    setUnlockError('');
    try {
      const res = await fetch(`/api/gallery?albumId=${albumToUnlock.id}&password=${encodeURIComponent(unlockPassword)}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setActiveAlbum(albumToUnlock);
        setActiveAlbumPassword(unlockPassword);
        setMedia(data.media);
        setActiveTab('all');
        setAlbumToUnlock(null);
        setUnlockPassword('');
      } else {
        setUnlockError(data.error || 'Contraseña incorrecta');
      }
    } catch (err) {
      setUnlockError('Error al validar la contraseña');
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
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditAlbumName(activeAlbum.name);
                  setEditAlbumDesc(activeAlbum.description || '');
                  setEditAlbumHasPassword(activeAlbum.hasPassword || false);
                  setEditAlbumPassword('');
                  setShowEditAlbumModal(true);
                }}
                className="w-12 h-12 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 flex items-center justify-center shadow-md transition-colors"
                title="Editar álbum"
              >
                <Edit2 className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDeleteAlbum(activeAlbum.id)}
                className="w-12 h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center shadow-md transition-colors"
                title="Eliminar álbum"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            </div>
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

      {/* {!activeAlbum && (
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
      )} */}

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
                          <Image src={formatImageUrl(cover.url)} alt={album.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
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
                          src={formatImageUrl(item.url)} 
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

                    {/* Pin/Unpin Button Overlay */}
                    <button
                      onClick={(e) => handleTogglePin(item, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full z-15 backdrop-blur-md transition-all duration-300 ${
                        item.isPinned 
                          ? 'bg-accent text-accent-foreground opacity-100 shadow-md shadow-accent/25' 
                          : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'
                      }`}
                      title={item.isPinned ? "Desfijar de portada" : "Fijar en portada"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-current' : ''}`} />
                    </button>
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
              
              {unlockError && (
                <p className="text-xs text-red-500 font-semibold mb-3 text-center bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl">
                  {unlockError}
                </p>
              )}

              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUnlock();
                }}
                placeholder="Ingresa la contraseña"
                className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm mb-4"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setAlbumToUnlock(null);
                    setUnlockPassword('');
                    setUnlockError('');
                  }} 
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUnlock} 
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                >
                  Desbloquear
                </button>
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

      {/* Edit Album Modal */}
      <AnimatePresence>
        {showEditAlbumModal && activeAlbum && (
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
                <h3 className="text-lg font-bold">Editar Álbum 📁</h3>
                <button onClick={() => setShowEditAlbumModal(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditAlbum} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold ml-1 text-muted-foreground">Nombre del álbum</label>
                  <input
                    type="text"
                    required
                    value={editAlbumName}
                    onChange={(e) => setEditAlbumName(e.target.value)}
                    placeholder="Ej. Viaje a la playa 🏖️"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold ml-1 text-muted-foreground">Descripción (opcional)</label>
                  <textarea
                    value={editAlbumDesc}
                    onChange={(e) => setEditAlbumDesc(e.target.value)}
                    placeholder="Agrega una nota corta sobre este álbum..."
                    className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all resize-none h-20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="editHasPassword" 
                    checked={editAlbumHasPassword} 
                    onChange={(e) => setEditAlbumHasPassword(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <label htmlFor="editHasPassword" className="text-sm font-semibold text-muted-foreground cursor-pointer">
                    Proteger con contraseña
                  </label>
                </div>

                {editAlbumHasPassword && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1 mt-2"
                  >
                    <label className="text-xs font-semibold ml-1 text-muted-foreground">Contraseña (dejar en blanco para mantener la actual)</label>
                    <input
                      type="password"
                      value={editAlbumPassword}
                      onChange={(e) => setEditAlbumPassword(e.target.value)}
                      placeholder="Ingresa una nueva contraseña"
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
                    />
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={updatingAlbum || !editAlbumName.trim()}
                  className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-70 mt-4 text-sm"
                >
                  {updatingAlbum ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cambios'}
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
                  className="border-2 border-dashed border-muted-foreground/30 rounded-[2rem] h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-muted-foreground px-4 text-center">
                    {files.length > 0 
                      ? `${files.length} archivo(s) seleccionado(s)` 
                      : 'Toca para seleccionar fotos o videos'}
                  </span>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden" 
                    required={files.length === 0}
                  />
                </div>

                {/* Previsualizaciones */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-muted/50 rounded-2xl bg-muted/10">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                        {preview.type === 'video' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white">
                            <PlayCircle className="w-6 h-6 text-accent mb-1" />
                            <span className="text-[8px] truncate max-w-full px-1">{preview.name}</span>
                          </div>
                        ) : preview.isHeic ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 text-white p-2 text-center">
                            <ImageIcon className="w-6 h-6 text-accent mb-1" />
                            <span className="text-[9px] font-bold text-accent">HEIC</span>
                            <span className="text-[8px] truncate max-w-full px-1 mt-0.5">{preview.name}</span>
                          </div>
                        ) : (
                          <img src={preview.url} alt={preview.name} className="object-cover w-full h-full" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedFile(index);
                          }}
                          className="absolute top-1 right-1 bg-black/75 hover:bg-black text-white rounded-full p-1 shadow transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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
                  disabled={uploading || files.length === 0}
                  className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-70 text-sm"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-foreground" />
                      <span>{uploadProgress || 'Guardando...'}</span>
                    </div>
                  ) : (
                    'Guardar Recuerdos'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Media Modal (Lightbox) */}
      <GalleryLightbox
        media={media}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        currentUserName={user?.name}
        onDelete={async (id) => {
          const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setLightboxOpen(false);
            fetchMedia();
            if (activeTab === 'albums') fetchAlbums();
          }
        }}
      />

    </div>
  );
}
