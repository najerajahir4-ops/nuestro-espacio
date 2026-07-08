'use client';

import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const { setUser, user, setPartnerStatus } = useAppStore();

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
        await fetch('/api/heartbeat', { method: 'POST' });
        const res = await fetch('/api/heartbeat');
        if (res.ok) {
          const data = await res.json();
          setPartnerStatus(data);
        }
      } catch (e) {
        // ignore
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000); // every 15s
    
    return () => clearInterval(interval);
  }, [user, isLogin, setPartnerStatus]);

  return (
    <>
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isLogin ? '' : 'md:ml-64'} min-h-screen relative`}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
