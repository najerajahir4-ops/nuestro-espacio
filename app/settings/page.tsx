'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Palette, LogOut, User, Music, Camera, Edit2, Check, X, Heart, Image as ImageIcon } from 'lucide-react';
import { MascotMood } from '@/components/MascotMood';
import { useAudio } from '@/components/AudioProvider';

const colors = [
  { name: 'Rosa Pastel', value: '#ff8fa3' },
  { name: 'Azul Suave', value: '#8ab4f8' },
  { name: 'Verde Menta', value: '#81c784' },
  { name: 'Lavanda', value: '#b39ddb' },
  { name: 'Melocotón', value: '#ffb74d' },
];

export default function SettingsPage() {
  const { user, setUser, theme, setTheme, accentColor, setAccentColor, hideGallery, setHideGallery } = useAppStore();
  const { volume, isMuted, setVolume, toggleMute } = useAudio();
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  // Profile Bio Editing
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [savingBio, setSavingBio] = useState(false);

  // Easter Egg State
  const [clicks, setClicks] = useState(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [particles, setParticles] = useState<{ id: number; angle: number; velocity: number }[]>([]);

  // Theme Blink State
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Previous theme ref for tracking changes
  const prevThemeRef = useRef(theme);
  
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 300);
      prevThemeRef.current = theme;
    }
  }, [theme]);

  const handleUpdateColor = async (color: string) => {
    setAccentColor(color);
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorTheme: color }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    setSavingBio(true);
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bioInput }),
      });
      setUser({ ...user, bio: bioInput });
      setIsEditingBio(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingBio(false);
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

  const handleFooterClick = () => {
    setClicks(c => c + 1);
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      setClicks(0);
    }, 2000);

    if (clicks === 2) {
      setEasterEggActive(true);
      setClicks(0);
      
      // Generate particles
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: Date.now() + i,
        angle: Math.random() * Math.PI * 2,
        velocity: 50 + Math.random() * 100
      }));
      setParticles(newParticles);
      
      setTimeout(() => {
        setEasterEggActive(false);
        setParticles([]);
      }, 2500);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-4xl mx-auto pb-32 md:pb-12 relative overflow-hidden">
      
      {/* Easter Egg Particles overlay */}
      {easterEggActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute"
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.velocity * 3,
                y: Math.sin(p.angle) * p.velocity * 3 + 200, // + gravity simulate
                scale: [0, 1.5, 0],
                opacity: [1, 1, 0]
              }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              <Heart className="w-6 h-6" style={{ color: accentColor, fill: accentColor }} />
            </motion.div>
          ))}
        </div>
      )}

      <header className="mb-10 flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Ajustes</h1>
          <p className="text-muted-foreground">Personaliza tu experiencia en Nuestro Espacio.</p>
        </div>
        <div className="relative">
          {/* Mascot Bounce Animation dependent on volume */}
          <motion.div
            animate={{
              y: volume > 0 ? [0, -10 * volume, 0] : 0,
            }}
            transition={{
              duration: 2 - volume, // faster if higher volume
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <MascotMood mood={easterEggActive ? 'happy' : 'relaxed'} className="w-16 h-16 hidden sm:block relative" />
            
            {/* Blink overlay on theme change */}
            <AnimatePresence>
              {isBlinking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center pointer-events-none"
                >
                  <div className="w-8 h-1.5 bg-foreground rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 relative z-10"
      >
        <motion.section variants={itemVariants} className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {user?.profilePic ? (
                <Image src={user.profilePic} alt={user.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover shadow-sm bg-muted/20" />
              ) : (
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-accent" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/40 backdrop-blur-[2px] text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium leading-none">Cambiar</span>
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
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              {isEditingBio ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="bg-muted text-sm px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-accent w-full max-w-xs"
                    placeholder="Escribe tu estado..."
                    autoFocus
                    maxLength={50}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveBio()}
                  />
                  <button onClick={handleSaveBio} disabled={savingBio} className="p-1.5 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500/20 transition-colors">
                    {savingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { setIsEditingBio(false); setBioInput(user?.bio || ''); }} className="p-1.5 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1 group cursor-pointer w-fit" onClick={() => setIsEditingBio(true)}>
                  <p className="text-muted-foreground text-sm">
                    {user?.bio || 'Haz clic para agregar un estado...'}
                  </p>
                  <button className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-accent transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: accentColor ? `${accentColor}33` : undefined }}>
                  <Palette className="w-6 h-6 transition-colors" style={{ color: accentColor }} />
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
                      className={`flex-1 py-3 rounded-xl border transition-colors ${theme === 'light' ? 'bg-accent/10 font-medium' : 'border-muted/50 text-muted-foreground'}`}
                      style={{ borderColor: theme === 'light' ? accentColor : undefined, color: theme === 'light' ? accentColor : undefined }}
                    >
                      Claro
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 py-3 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-accent/10 font-medium' : 'border-muted/50 text-muted-foreground'}`}
                      style={{ borderColor: theme === 'dark' ? accentColor : undefined, color: theme === 'dark' ? accentColor : undefined }}
                    >
                      Oscuro
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="w-full md:w-64 bg-muted/30 p-5 rounded-2xl border border-muted/50 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">Vista Previa</span>
              <div 
                className="w-full p-4 rounded-xl text-white shadow-md transition-colors duration-300 relative overflow-hidden"
                style={{ backgroundColor: accentColor }}
              >
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white fill-white" />
                  </div>
                  <span className="text-xs font-semibold">Mensaje</span>
                </div>
                <p className="text-sm font-medium leading-tight">Así se verá el color de acento 💛</p>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: accentColor ? `${accentColor}33` : undefined }}>
              <Music className="w-6 h-6 transition-colors" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Música de Fondo</h2>
              <p className="text-muted-foreground text-sm">Controla la ambientación de la app</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Volumen: {Math.round(volume * 100)}%</h3>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted transition-colors"
                style={{ accentColor: accentColor || 'currentColor' }}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted/50">
              <div>
                <p className="font-medium">Silenciar música</p>
                <p className="text-xs text-muted-foreground">Desactiva el sonido por completo</p>
              </div>
              <button
                onClick={toggleMute}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isMuted || volume === 0 ? 'bg-accent' : 'bg-muted-foreground/30'
                }`}
                style={{ backgroundColor: (isMuted || volume === 0) ? accentColor : undefined }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isMuted || volume === 0 ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: accentColor ? `${accentColor}33` : undefined }}>
              <ImageIcon className="w-6 h-6 transition-colors" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Secciones</h2>
              <p className="text-muted-foreground text-sm">Controla la visibilidad de las pestañas</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted/50">
              <div>
                <p className="font-medium">Ocultar Galería</p>
                <p className="text-xs text-muted-foreground">Oculta la sección de Galería del menú lateral y barra de navegación</p>
              </div>
              <button
                onClick={() => setHideGallery(!hideGallery)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  hideGallery ? 'bg-accent' : 'bg-muted-foreground/30'
                }`}
                style={{ backgroundColor: hideGallery ? accentColor : undefined }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    hideGallery ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="pt-4">
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
        </motion.section>
        
        {/* Easter Egg Footer */}
        <motion.div variants={itemVariants} className="text-center pt-8 pb-4">
          <button 
            onClick={handleFooterClick}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default outline-none select-none"
          >
            Nuestro Espacio v1.0 · hecho con <Heart className={`w-3.5 h-3.5 transition-colors ${easterEggActive ? 'scale-125' : ''}`} style={(easterEggActive || clicks > 0) ? { color: accentColor, fill: accentColor } : {}} /> por Kenny
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
