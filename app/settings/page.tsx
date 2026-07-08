'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Palette, LogOut, User } from 'lucide-react';

const colors = [
  { name: 'Rosa Pastel', value: '#ff8fa3' },
  { name: 'Azul Suave', value: '#8ab4f8' },
  { name: 'Verde Menta', value: '#81c784' },
  { name: 'Lavanda', value: '#b39ddb' },
  { name: 'Melocotón', value: '#ffb74d' },
];

export default function SettingsPage() {
  const { user, setUser, theme, setTheme, accentColor, setAccentColor } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  const handleUpdateColor = async (color: string) => {
    setAccentColor(color);
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorTheme: color }),
      });
      // Silent update
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-4xl mx-auto pb-32 md:pb-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Ajustes</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en Nuestro Espacio.</p>
      </header>

      <div className="space-y-8">
        <section className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              {user?.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="w-16 h-16 rounded-full object-cover shadow-sm bg-muted/20" />
              ) : (
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-accent" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-xs font-medium">Cambiar</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await fetch('/api/user/avatar', {
                        method: 'POST',
                        body: formData
                      });
                      const data = await res.json();
                      if (data.url && user) {
                        setUser({ ...user, profilePic: data.url });
                      }
                    } catch(err) {
                      console.error(err);
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Perfil</h2>
              <p className="text-muted-foreground text-sm">Logueado como {user?.name}</p>
            </div>
          </div>
        </section>

        <section className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Palette className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Tema y Color</h2>
              <p className="text-muted-foreground text-sm">Elige cómo se ve la aplicación</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Color de acento</h3>
              <div className="flex flex-wrap gap-4">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleUpdateColor(c.value)}
                    className={`w-12 h-12 rounded-full transition-transform ${accentColor === c.value ? 'ring-4 ring-offset-2 ring-background scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Modo Oscuro</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-3 rounded-xl border ${theme === 'light' ? 'border-accent bg-accent/10 text-accent font-medium' : 'border-muted/50 text-muted-foreground'}`}
                >
                  Claro
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-3 rounded-xl border ${theme === 'dark' ? 'border-accent bg-accent/10 text-accent font-medium' : 'border-muted/50 text-muted-foreground'}`}
                >
                  Oscuro
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 py-4 rounded-2xl font-medium transition-colors"
          >
            {logoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            Cerrar Sesión
          </motion.button>
        </section>
      </div>
    </div>
  );
}
