'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Loader2, AlertCircle, Calendar, Trophy, Newspaper, Star } from 'lucide-react';
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

interface AssistItem {
  player: { name: string };
  team: { name: string; crest: string };
  assists: number;
}

interface MatchItem {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  homeTeam: { name: string; crest: string };
  awayTeam: { name: string; crest: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

const STAGE_LABELS: Record<string, string> = {
  'LAST_16': 'Octavos de final',
  'QUARTER_FINALS': 'Cuartos de final',
  'SEMI_FINALS': 'Semifinales',
  'THIRD_PLACE': 'Tercer lugar',
  'FINAL': 'Final'
};

const STAGE_ORDER = ['LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];

export default function FifePage() {
  const [activeTab, setActiveTab] = useState<'news' | 'stats' | 'matches'>('news');
  const [statsTab, setStatsTab] = useState<'scorers' | 'assists'>('scorers');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    news: NewsItem[];
    scorers: ScorerItem[];
    assists: AssistItem[];
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
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center md:ml-64 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Group matches by stage
  const groupedMatches: Record<string, MatchItem[]> = {};
  data?.matches.forEach((match) => {
    const stage = match.stage || 'GROUP_STAGE';
    if (!groupedMatches[stage]) {
      groupedMatches[stage] = [];
    }
    groupedMatches[stage].push(match);
  });

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-6xl mx-auto pb-24 md:pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Espacio Fife ⚽</h1>
        <p className="text-muted-foreground">Noticias de estrellas, fixture interactivo y estadísticas del Mundial.</p>
      </header>

      {data?.usingMockData && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Modo Demostración Activo</p>
            <p className="text-xs mt-1 opacity-90">
              Las noticias de estrellas y Mundial son reales (vía Marca), pero el fixture y estadísticas son de demostración. 
              Para ver datos reales en vivo, configura tu <code>FOOTBALL_DATA_API_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex bg-muted/30 p-1.5 rounded-2xl mb-8 max-w-md mx-auto relative z-10">
        {[
          { id: 'news', label: 'Noticias', icon: Newspaper },
          { id: 'stats', label: 'Estadísticas', icon: Trophy },
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

        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto bg-card border border-muted/50 rounded-[2rem] shadow-sm overflow-hidden"
          >
            {/* Sub Tabs for Scorers and Assists */}
            <div className="p-4 bg-muted/15 border-b border-muted/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-lg pl-2">Estadísticas del Mundial</h3>
              <div className="flex bg-muted/30 p-1 rounded-xl">
                <button
                  onClick={() => setStatsTab('scorers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statsTab === 'scorers' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Goleadores
                </button>
                <button
                  onClick={() => setStatsTab('assists')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statsTab === 'assists' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Asistidores
                </button>
              </div>
            </div>

            <div className="divide-y divide-muted/30">
              {statsTab === 'scorers' ? (
                data?.scorers.map((item, idx) => (
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
                    <div className="text-right pr-2">
                      <span className="text-lg font-extrabold text-accent">{item.goals}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">goles</span>
                    </div>
                  </div>
                ))
              ) : (
                data?.assists.map((item, idx) => (
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
                    <div className="text-right pr-2">
                      <span className="text-lg font-extrabold text-accent">{item.assists}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">asistencias</span>
                    </div>
                  </div>
                ))
              )}
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
            className="space-y-12"
          >
            {STAGE_ORDER.map((stage) => {
              const stageMatches = groupedMatches[stage] || [];
              if (stageMatches.length === 0) return null;

              return (
                <div key={stage} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-muted/50 pb-2">
                    <Star className="w-5 h-5 text-accent fill-current" />
                    <h2 className="text-xl font-bold text-foreground">{STAGE_LABELS[stage]}</h2>
                    <span className="text-xs text-muted-foreground">({stageMatches.length} partidos)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stageMatches.map((match) => {
                      const isFinished = match.status === 'FINISHED';
                      const matchDate = new Date(match.utcDate);
                      
                      // Format relative day
                      let dayLabel = format(matchDate, "eee d/M", { locale: es });
                      const hoursLabel = format(matchDate, "h:mm a", { locale: es });
                      
                      if (matchDate.getFullYear() === 2022) {
                        // World Cup 2022 historical label
                        dayLabel = format(matchDate, "d MMM, yyyy", { locale: es });
                      }

                      return (
                        <motion.div
                          variants={itemVariants}
                          key={match.id}
                          className="bg-card border border-muted/50 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{STAGE_LABELS[stage]}</span>
                            <span className="font-semibold text-accent">{isFinished ? 'Fin' : 'Próximamente'}</span>
                          </div>

                          <div className="flex items-center justify-between gap-4 my-2">
                            {/* Teams and scores */}
                            <div className="flex flex-col gap-3 flex-1">
                              {/* Home */}
                              <div className="flex items-center gap-3">
                                {match.homeTeam.crest ? (
                                  <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="w-6 h-6 object-contain flex-shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] flex-shrink-0">🛡️</div>
                                )}
                                <span className="text-sm font-bold truncate max-w-[150px]">{match.homeTeam.name}</span>
                              </div>
                              {/* Away */}
                              <div className="flex items-center gap-3">
                                {match.awayTeam.crest ? (
                                  <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="w-6 h-6 object-contain flex-shrink-0" />
                                ) : (
                                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] flex-shrink-0">🛡️</div>
                                )}
                                <span className="text-sm font-bold truncate max-w-[150px]">{match.awayTeam.name}</span>
                              </div>
                            </div>

                            {/* Score Display (Right) */}
                            <div className="flex items-center gap-6">
                              {isFinished && (
                                <div className="flex flex-col gap-3 font-extrabold text-base text-right min-w-[20px]">
                                  <span>{match.score.fullTime.home}</span>
                                  <span>{match.score.fullTime.away}</span>
                                </div>
                              )}
                              
                              <div className="border-l border-muted/50 pl-4 py-1 flex flex-col justify-center min-w-[70px] text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{dayLabel}</p>
                                <p className="text-xs font-semibold mt-0.5">{hoursLabel}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
