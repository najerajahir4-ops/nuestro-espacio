'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface JournalEntry {
  id: string;
  content: string;
  date: string;
  user: { name: string; colorTheme: string; profilePic?: string | null };
  userId: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(() => {
      fetchEntries(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setEntries([data.entry, ...entries]);
        setContent('');
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

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-4xl mx-auto pb-32 md:pb-12 flex flex-col h-screen">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground mb-2">Nuestro Diario</h1>
        <p className="text-muted-foreground">Escribe lo que sientes, será guardado para siempre.</p>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 flex flex-col-reverse relative scroll-smooth">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {entries.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center h-full text-center space-y-4"
              >
                <img src="/images/2.png" alt="Esperando mensaje" className="w-32 h-32 rounded-3xl shadow-lg opacity-80" />
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
                          <img src={entry.user.profilePic} alt={entry.user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                            {entry.user.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Bubble */}
                      <div className="flex flex-col group">
                        <span className={`text-[11px] font-medium text-muted-foreground mb-1 mx-2 ${isMe ? 'text-right' : 'text-left'}`}>
                          {entry.user.name} • {format(new Date(entry.date), "d MMM, HH:mm", { locale: es })}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {isMe && !isEditing && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity flex-col gap-1 mr-2">
                              <button onClick={() => { setEditingId(entry.id); setEditContent(entry.content); }} className="text-muted-foreground hover:text-accent"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(entry.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          )}

                          <div 
                            className={`rounded-3xl p-5 shadow-sm whitespace-pre-wrap ${
                              isMe 
                                ? 'bg-accent text-accent-foreground rounded-br-sm' 
                                : 'bg-card border border-muted/60 text-foreground rounded-bl-sm'
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
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
                              entry.content
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
      <div className="mt-6 flex-shrink-0">
        <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-card border border-muted/50 p-2 pl-4 rounded-3xl shadow-sm focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe un mensaje..."
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
            disabled={!content.trim() || sending}
            type="submit"
            className="w-12 h-12 flex-shrink-0 bg-accent text-accent-foreground rounded-full flex items-center justify-center disabled:opacity-50 shadow-sm mb-0.5 mr-0.5"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
