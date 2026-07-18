'use client';

import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { formatImageUrl, getOptimizedImageUrl } from '@/lib/cloudinary';


export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';
  const { setUser, user, setPartnerStatus } = useAppStore();

  const [notification, setNotification] = useState<{ id: string; name: string; content: string; type: string; profilePic: string | null } | null>(null);
  const lastNotifiedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      lastNotifiedIdRef.current = localStorage.getItem('last_notified_journal_id');
    }
  }, []);

  useEffect(() => {
    // Check session on mount if we don't have user but we are not in login
    if (!isLogin) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [isLogin, setUser]);

  useEffect(() => {
    // Only poll if user is logged in
    if (!user || isLogin) return;
    
    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/heartbeat', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setPartnerStatus(data);

          if (data.latestJournal) {
            const ageMs = new Date().getTime() - new Date(data.latestJournal.createdAt).getTime();
            
            if (pathname === '/journal') {
              if (data.latestJournal.id !== lastNotifiedIdRef.current) {
                lastNotifiedIdRef.current = data.latestJournal.id;
                localStorage.setItem('last_notified_journal_id', data.latestJournal.id);
              }
            } else if (ageMs < 40000 && data.latestJournal.id !== lastNotifiedIdRef.current) {
              lastNotifiedIdRef.current = data.latestJournal.id;
              localStorage.setItem('last_notified_journal_id', data.latestJournal.id);
              
              setNotification({
                id: data.latestJournal.id,
                name: data.name,
                content: data.latestJournal.content || '',
                type: data.latestJournal.type,
                profilePic: data.profilePic || null
              });

              // Clear notification after 6 seconds
              setTimeout(() => {
                setNotification(null);
              }, 6000);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000); // Check every 10s for battery/network efficiency
    
    return () => clearInterval(interval);
  }, [user, isLogin, setPartnerStatus, pathname]);

  return (
    <>
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isLogin ? '' : 'md:ml-64'} min-h-screen relative`}>
        {children}
      </main>
      <BottomNav />

      {/* Floating real-time notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            onClick={() => {
              router.push('/journal');
              setNotification(null);
            }}
            className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[200] bg-card/85 backdrop-blur-md border border-accent/20 rounded-3xl p-4 shadow-xl hover:shadow-2xl hover:border-accent/40 transition-all cursor-pointer select-none flex items-center gap-3.5 group"
          >
            <div className="flex-shrink-0">
              {notification.profilePic ? (
                 <img 
                  src={getOptimizedImageUrl(notification.profilePic, { width: 120, height: 120, cropFace: true })} 
                  alt={notification.name} 
                  className="w-11 h-11 rounded-full object-cover border-2 border-accent" 
                />
              ) : (
                <div className="w-11 h-11 bg-accent/20 rounded-full flex items-center justify-center border-2 border-accent text-accent font-bold text-sm">
                  {notification.name[0].toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-[10px] font-black text-accent tracking-wide uppercase">
                Nuevo mensaje en Diario
              </p>
              <p className="text-sm font-bold text-foreground truncate mt-0.5">
                {notification.name} dice:
              </p>
              <p className="text-xs text-muted-foreground truncate leading-relaxed mt-0.5 group-hover:text-foreground transition-colors">
                {notification.type === 'image' ? '📷 Envió una imagen...' : notification.content}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotification(null);
              }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
