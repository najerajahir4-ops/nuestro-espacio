'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Image as ImageIcon, Book, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/gallery', label: 'Galería', icon: ImageIcon },
  { path: '/journal', label: 'Diario', icon: Book },
  { path: '/settings', label: 'Ajustes', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  // No mostrar en la pantalla de login
  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-card border-t border-muted/50 flex items-center justify-around z-50 md:hidden pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`) && item.path !== '/';
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            href={item.path}
            className="relative flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-accent/10"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              className={`w-5 h-5 mb-1 z-10 transition-colors ${isActive ? 'text-accent' : ''}`}
            />
            <span className={`text-[10px] z-10 font-medium ${isActive ? 'text-accent' : ''}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
