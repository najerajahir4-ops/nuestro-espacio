'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Image as ImageIcon, Book, Settings, Heart, Trophy, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/gallery', label: 'Galería', icon: ImageIcon },
  { path: '/journal', label: 'Diario', icon: Book },
  { path: '/calendar', label: 'Calendario', icon: Calendar },
  { path: '/fife', label: 'Fife', icon: Trophy },
  { path: '/settings', label: 'Ajustes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { partnerStatus, hideGallery } = useAppStore();

  if (pathname === '/login') return null;

  const filteredNavItems = hideGallery
    ? navItems.filter(item => item.path !== '/gallery')
    : navItems;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-card border-r border-muted/50 fixed left-0 top-0 z-50">
      <div className="flex items-center justify-center h-24 text-accent">
        <Heart className="w-8 h-8 fill-current animate-pulse" />
        <span className="ml-3 text-xl font-bold text-foreground">Nuestro Espacio</span>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`) && item.path !== '/';
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative flex items-center px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground transition-colors group"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-nav-indicator"
                  className="absolute inset-0 bg-accent/10 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 mr-4 z-10 transition-colors ${isActive ? 'text-accent' : 'group-hover:text-accent/70'}`}
              />
              <span className={`z-10 font-medium ${isActive ? 'text-accent' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {partnerStatus && (
        <div className="p-4 border-t border-muted/50 mb-4">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-accent/5">
            <div className="relative">
              {partnerStatus.profilePic ? (
                <img src={partnerStatus.profilePic} alt="Pareja" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-accent" />
                </div>
              )}
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${partnerStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{partnerStatus.name}</p>
              <p className="text-xs text-muted-foreground">{partnerStatus.isOnline ? 'En línea' : 'Desconectado'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
