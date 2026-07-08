'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Loader2, AlertCircle, Calendar, Trophy, Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  imageUrl: string;
}

interface ScorerItem {
  player: { name: string };
  team: { name: string; crest: string };
  goals: number;
}

interface MatchItem {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { name: string; crest: string };
  awayTeam: { name: string; crest: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

export default function FifePage() {
  const [activeTab, setActiveTab] = useState<'news' | 'scorers' | 'matches'>('news');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    news: NewsItem[];
    scorers: ScorerItem[];
    matches: MatchItem[];
    usingMockData: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/fife')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center md:ml-64 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-6xl mx-auto pb-24 md:pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Espacio Fife ⚽</h1>
        <p className="text-muted-foreground">Noticias, tablas y estadísticas del balompié.</p>
      </header>

      {data?.usingMockData && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Modo Demostración Activo</p>
            <p className="text-xs mt-1 opacity-90">
              Las noticias son reales, pero la tabla de goleadores y los partidos son de demostración. 
              Para ver datos reales en vivo, regístrate gratis en <a href="https://www.football-data.org/" target="_blank" rel="noopener noreferrer" className="underline font-bold">football-data.org</a> y agrega la API key en tu archivo <code>.env</code> como <code>FOOTBALL_DATA_API_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-muted/30 p-1.5 rounded-2xl mb-8 max-w-md mx-auto relative z-10">
        {[
          { id: 'news', label: 'Noticias', icon: Newspaper },
          { id: 'scorers', label: 'Goleadores', icon: Trophy },
          { id: 'matches', label: 'Partidos', icon: Calendar }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium relative z-10 transition-colors"
              style={{ color: isActive ? 'var(--accent-foreground)' : 'var(--muted-foreground)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-fife-tab"
                  className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'news' && (
          <motion.div
            key="news"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {data?.news.map((item, idx) => (
              <motion.a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                key={idx}
                className="group flex flex-col bg-card border border-muted/50 rounded-[2rem] overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-accent font-semibold tracking-wider uppercase">
                      {format(new Date(item.pubDate), "d MMM, yyyy", { locale: es })}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-2 line-clamp-2 group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-muted/30 text-xs font-semibold text-accent group-hover:underline">
                    Leer artículo completo →
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}

        {activeTab === 'scorers' && (
          <motion.div
            key="scorers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto bg-card border border-muted/50 rounded-[2rem] shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-muted/50 bg-muted/10 flex justify-between items-center">
              <h3 className="font-bold text-lg">Máximos Goleadores</h3>
              <span className="text-xs text-muted-foreground">Copa del Mundo FIFA</span>
            </div>
            <div className="divide-y divide-muted/30">
              {data?.scorers.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                    {item.team.crest ? (
                      <img src={item.team.crest} alt={item.team.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs">⚽</div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-foreground">{item.player.name}</p>
                      <p className="text-xs text-muted-foreground">{item.team.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-accent">{item.goals}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">goles</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'matches' && (
          <motion.div
            key="matches"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="max-w-3xl mx-auto space-y-4"
          >
            {data?.matches.map((match) => {
              const isFinished = match.status === 'FINISHED';
              return (
                <motion.div
                  variants={itemVariants}
                  key={match.id}
                  className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-center md:text-left flex-shrink-0">
                    <p className="text-xs font-semibold text-accent">
                      {format(new Date(match.utcDate), "d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(match.utcDate), "HH:mm 'HRS'", { locale: es })}
                    </p>
                  </div>

                  <div className="flex-1 flex items-center justify-center gap-4 md:gap-8 w-full">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center justify-end gap-3 w-1/3">
                      <span className="text-xs md:text-sm font-bold text-right truncate max-w-[120px] md:max-w-none">{match.homeTeam.name}</span>
                      {match.homeTeam.crest ? (
                        <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-8 h-8 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs flex-shrink-0">🛡️</div>
                      )}
                    </div>

                    {/* Score / Status */}
                    <div className="flex flex-col items-center justify-center px-4 py-2 bg-muted/20 rounded-2xl min-w-[80px]">
                      {isFinished ? (
                        <span className="text-base font-extrabold text-foreground tracking-widest">
                          {match.score.fullTime.home} - {match.score.fullTime.away}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground uppercase">VS</span>
                      )}
                      <span className="text-[8px] text-muted-foreground mt-1 tracking-wider uppercase font-semibold">
                        {isFinished ? 'Finalizado' : 'Próximamente'}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex items-center justify-start gap-3 w-1/3">
                      {match.awayTeam.crest ? (
                        <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-8 h-8 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs flex-shrink-0">🛡️</div>
                      )}
                      <span className="text-xs md:text-sm font-bold text-left truncate max-w-[120px] md:max-w-none">{match.awayTeam.name}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
