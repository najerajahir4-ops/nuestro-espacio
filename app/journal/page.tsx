'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, Edit2, Trash2, Paperclip, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MascotMood } from '@/components/MascotMood';

import dynamic from 'next/dynamic';
import Image from 'next/image';

const Lightbox = dynamic(() => import('yet-another-react-lightbox'), { ssr: false });
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface JournalEntry {
  id: string;
  content: string | null;
  type: string;
  mediaUrl: string | null;
  date: string;
  user: { name: string; colorTheme: string; profilePic?: string | null };
  userId: string;
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-2 py-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user, partnerStatus } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Image Upload States
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Typing States
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEntries = async (silent = false) => {
    try {
      const res = await fetch('/api/journal');
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchTypingStatus = async () => {
    try {
      const res = await fetch('/api/journal/typing');
      const data = await res.json();
      setPartnerTyping(!!data.isTyping);
    } catch (error) {
      // ignore
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    try {
      await fetch('/api/journal/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping })
      });
    } catch (e) {}
  };

  useEffect(() => {
    fetchEntries();
    
    // Polling for entries
    const entriesInterval = setInterval(() => fetchEntries(true), 5000);
    // Polling for typing status
    const typingInterval = setInterval(fetchTypingStatus, 2000);
    
    return () => {
      clearInterval(entriesInterval);
      clearInterval(typingInterval);
    };
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Notify we are typing
    updateTypingStatus(true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    setSending(true);
    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const formData = new FormData();
      formData.append('content', content);
      if (file) formData.append('file', file);

      const res = await fetch('/api/journal', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setEntries([data.entry, ...entries]);
        setContent('');
        removeFile();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas borrar este mensaje?')) return;
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(entries.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEntries(entries.map(e => e.id === id ? { ...e, content: editContent } : e));
        setEditingId(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const mediaEntries = entries.filter(e => e.type === 'image' && e.mediaUrl);
  const slides = mediaEntries.map(e => ({ src: e.mediaUrl! })).reverse();
  const getSlideIndex = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return 0;
    const reversedIndex = mediaEntries.slice().reverse().findIndex(e => e.id === id);
    return reversedIndex >= 0 ? reversedIndex : 0;
  };

  return (
    <div className="fixed inset-0 md:pl-64 bg-background z-10">
      <div className="w-full max-w-4xl mx-auto h-full flex flex-col p-6 md:p-12 pb-24 md:pb-12">
        <header className="mb-6 flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Nuestro Diario</h1>
            <p className="text-muted-foreground">Escribe lo que sientes, será guardado para siempre.</p>
          </div>
          
          {partnerStatus && (
            <div className="flex flex-col items-center gap-1">
              <MascotMood 
                mood={partnerStatus.isOnline ? (partnerTyping ? 'typing' : 'online') : 'sleepy'} 
                className="w-16 h-16" 
              />
              <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1 rounded-full border border-muted/50">
                <div className={`w-2 h-2 rounded-full ${partnerStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {partnerStatus.name} {partnerStatus.isOnline ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 flex flex-col-reverse relative scroll-smooth">
          
          <AnimatePresence>
            {partnerTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex w-full justify-start mt-4"
              >
                <div className="flex items-end gap-2 max-w-[85%] md:max-w-[75%] flex-row">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex flex-shrink-0 mb-1" />
                  <div className="bg-card border border-muted/60 text-foreground rounded-3xl rounded-bl-sm p-3 shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center items-center h-full">
              <MascotMood mood="thinking" className="w-24 h-24" />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {entries.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col items-center justify-center h-full text-center space-y-4"
                >
                  <Image src="/images/2.png" alt="Esperando mensaje" width={128} height={128} className="w-32 h-32 rounded-3xl shadow-lg opacity-80" />
                  <p className="text-muted-foreground font-medium">Aún no hay mensajes.<br/>¡Escribe el primero!</p>
                </motion.div>
              ) : (
                entries.map((entry, index) => {
                  const isMe = entry.user.name === user?.name;
                  const isEditing = editingId === entry.id;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className="flex-shrink-0 mb-1">
                          {entry.user.profilePic ? (
                            <Image src={entry.user.profilePic || '/images/user.png'} alt={entry.user.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                              {entry.user.name[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Bubble */}
                        <div className="flex flex-col group relative">
                          <span className={`text-[11px] font-medium text-muted-foreground mb-1 mx-2 ${isMe ? 'text-right' : 'text-left'}`}>
                            {entry.user.name} • {format(new Date(entry.date), "d MMM, HH:mm", { locale: es })}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {isMe && !isEditing && (
                              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-1 mr-2">
                                {entry.type !== 'image' && (
                                  <button onClick={() => { setEditingId(entry.id); setEditContent(entry.content || ''); }} className="text-muted-foreground hover:text-accent"><Edit2 className="w-3.5 h-3.5" /></button>
                                )}
                                <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}

                            <div 
                              className={`rounded-3xl p-1 shadow-sm ${
                                isMe 
                                  ? 'bg-accent text-accent-foreground rounded-br-sm' 
                                  : 'bg-card border border-muted/60 text-foreground rounded-bl-sm'
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex flex-col gap-2 p-4">
                                  <textarea 
                                    value={editContent} 
                                    onChange={(e) => setEditContent(e.target.value)} 
                                    className="w-full bg-black/10 dark:bg-white/10 rounded-xl p-2 outline-none text-sm resize-none" 
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingId(null)} className="text-xs bg-black/20 hover:bg-black/30 px-2 py-1 rounded-md">Cancelar</button>
                                    <button onClick={() => handleEdit(entry.id)} className="text-xs bg-white text-black hover:bg-gray-100 px-2 py-1 rounded-md">Guardar</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col overflow-hidden rounded-[1.3rem]">
                                  {entry.type === 'image' && entry.mediaUrl && (
                                    <div className="relative w-64 h-64 cursor-pointer" onClick={() => {
                                      setLightboxIndex(getSlideIndex(entry.id));
                                      setLightboxOpen(true);
                                    }}>
                                      <Image 
                                        src={entry.mediaUrl} 
                                        alt="Foto adjunta" 
                                        fill
                                        className="object-cover transition-transform duration-300 hover:scale-105" 
                                      />
                                    </div>
                                  )}
                                  {entry.content && (
                                    <div className={`px-4 py-3 whitespace-pre-wrap ${entry.type === 'image' ? 'text-sm' : ''}`}>
                                      {entry.content}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Input Area */}
        <div className="mt-4 md:mt-6 flex-shrink-0 flex flex-col gap-2">
          
          <AnimatePresence>
            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-24 h-24 rounded-xl overflow-hidden border border-muted"
              >
                <Image src={previewUrl} alt="Preview" fill unoptimized className="object-cover" />
                <button 
                  onClick={removeFile}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-card border border-muted/50 p-2 pl-2 rounded-3xl shadow-sm focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
            
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-accent transition-colors rounded-full mb-1 ml-1"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder={file ? "Añade un comentario..." : "Escribe un mensaje..."}
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-3 text-foreground max-h-32 min-h-[48px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={(!content.trim() && !file) || sending}
              type="submit"
              className="w-12 h-12 flex-shrink-0 bg-accent text-accent-foreground rounded-full flex items-center justify-center disabled:opacity-50 shadow-sm mb-0.5 mr-0.5"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </motion.button>
          </form>
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
        plugins={[Zoom]}
        carousel={{ finite: true }}
      />
    </div>
  );
}
