'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Heart, 
  X, 
  Trash2, 
  Loader2, 
  Sparkles
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { MascotMood } from '@/components/MascotMood';

interface CalendarEvent {
  id: string;
  date: string; // ISO string
  type: 'sexual' | 'important';
  title?: string | null;
  notes?: string | null;
  category?: string | null;
  userId: string;
  user: {
    name: string;
    profilePic?: string | null;
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [eventType, setEventType] = useState<'sexual' | 'important'>('sexual');
  const [eventTitle, setEventTitle] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventCategory, setEventCategory] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setSaving(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          type: eventType,
          title: eventType === 'important' ? eventTitle : null,
          notes: eventNotes,
          category: eventCategory || (eventType === 'sexual' ? 'protegido' : 'otro'),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEvents(prev => [...prev, data.event]);
        // Reset form
        setEventTitle('');
        setEventNotes('');
        setEventCategory('');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error creating calendar event:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      const res = await fetch(`/api/calendar/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Error deleting calendar event:', error);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust starting day to Monday (0: Monday, 6: Sunday)
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const calendarCells: (Date | null)[] = [];
  
  // Fill empty spaces of previous month
  for (let i = 0; i < adjustedFirstDayIndex; i++) {
    calendarCells.push(null);
  }

  // Fill current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(new Date(year, month, i));
  }

  // Helper to check if a date matches a calendar cell date (ignoring time)
  const isSameDayDate = (d1: Date, d2String: string) => {
    const d2 = new Date(d2String);
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Get events of a specific day
  const getEventsOfDay = (date: Date) => {
    return events.filter(e => isSameDayDate(date, e.date));
  };

  // Month Statistics
  const currentMonthEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const sexualCount = currentMonthEvents.filter(e => e.type === 'sexual').length;
  const importantCount = currentMonthEvents.filter(e => e.type === 'important').length;

  // Next important event
  const nextImportantEvent = events
    .filter(e => e.type === 'important' && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysUntilNextImportant = nextImportantEvent 
    ? differenceInDays(new Date(nextImportantEvent.date), new Date()) 
    : null;

  return (
    <div className="min-h-screen p-6 md:p-12 md:ml-64 max-w-6xl mx-auto pb-32 md:pb-12">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            Calendario Asuichis <Sparkles className="w-6 h-6 text-accent" />
          </h1>
          <p className="text-muted-foreground text-sm">
            Nuestro registro íntimo de momentos y fechas especiales.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Stats & Next Events */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card: Stats */}
          <div className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Resumen de este mes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-pink-500/5 rounded-2xl border border-pink-500/10">
                <Flame className="w-8 h-8 text-pink-500 fill-pink-500/20 mb-2" />
                <span className="text-2xl font-black text-pink-500">{sexualCount}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Llamas</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-accent/5 rounded-2xl border border-accent/10">
                <Heart className="w-8 h-8 text-accent fill-accent/20 mb-2" />
                <span className="text-2xl font-black text-accent">{importantCount}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Eventos</span>
              </div>
            </div>
          </div>

          {/* Card: Next Important Event */}
          {nextImportantEvent && (
            <div className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-accent/5 rounded-full blur-xl" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Próxima fecha importante
              </h3>
              <div className="space-y-1 relative z-10">
                <p className="font-bold text-base text-foreground leading-tight">
                  {nextImportantEvent.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(nextImportantEvent.date), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
                <div className="pt-3 flex items-center gap-1.5 text-xs text-accent font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {daysUntilNextImportant === 0 
                      ? '¡Es hoy! 💖' 
                      : `Faltan ${daysUntilNextImportant} ${daysUntilNextImportant === 1 ? 'día' : 'días'} ⏳`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cute mascot panel */}
          <div className="bg-muted/10 border border-muted/30 rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
            <MascotMood mood={sexualCount > 8 ? 'excited' : 'happy'} className="w-24 h-24 mb-4" />
            <p className="text-xs font-semibold text-muted-foreground italic">
              {sexualCount > 12 
                ? '¡Este mes está que arde! 🔥' 
                : 'Manteniendo encendida la llama de nuestro amor 💕'}
            </p>
          </div>
        </div>

        {/* Right Column: Calendar Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header del mes */}
          <div className="flex items-center justify-between bg-card border border-muted/50 rounded-[2rem] p-4 shadow-sm">
            <button 
              onClick={handlePrevMonth}
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96 bg-card border border-muted/50 rounded-[2rem]">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="bg-card border border-muted/50 rounded-[2rem] p-6 shadow-sm overflow-hidden">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <span 
                    key={day} 
                    className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wider py-2"
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Grid del calendario */}
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((cellDate, idx) => {
                  if (!cellDate) {
                    return (
                      <div 
                        key={`empty-${idx}`} 
                        className="aspect-square bg-muted/5 border border-transparent rounded-2xl" 
                      />
                    );
                  }

                  const dayEvents = getEventsOfDay(cellDate);
                  const hasSexual = dayEvents.some(e => e.type === 'sexual');
                  const hasImportant = dayEvents.some(e => e.type === 'important');
                  
                  // Highlight today
                  const isToday = isSameDayDate(new Date(), cellDate.toISOString());

                  return (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      key={`day-${cellDate.getDate()}`}
                      onClick={() => {
                        setSelectedDate(cellDate);
                        setShowAddModal(true);
                      }}
                      className={`aspect-square relative cursor-pointer rounded-2xl border flex flex-col p-2.5 transition-all select-none ${
                        isToday 
                          ? 'bg-accent/5 border-accent shadow-sm shadow-accent/10' 
                          : 'bg-muted/10 border-muted/50 hover:bg-muted/30'
                      }`}
                    >
                      <span className={`text-xs font-black leading-none ${isToday ? 'text-accent' : 'text-foreground/80'}`}>
                        {cellDate.getDate()}
                      </span>

                      {/* Emojis/Icons centered inside cell */}
                      <div className="flex-1 flex items-center justify-center gap-1 mt-1">
                        {hasSexual && (
                          <motion.span 
                            initial={{ scale: 0.8 }} 
                            animate={{ scale: 1 }} 
                            className="text-lg drop-shadow-sm filter saturate-125"
                            title="Actividad Intima"
                          >
                            🔥
                          </motion.span>
                        )}
                        {hasImportant && (
                          <motion.span 
                            initial={{ scale: 0.8 }} 
                            animate={{ scale: 1 }} 
                            className="text-base drop-shadow-sm"
                            title="Evento Especial"
                          >
                            ❤️
                          </motion.span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para detalles y agregar eventos */}
      <AnimatePresence>
        {showAddModal && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 border border-muted flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold capitalize text-foreground">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registros y eventos de este día.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    // Reset fields
                    setEventTitle('');
                    setEventNotes('');
                    setEventCategory('');
                  }} 
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {/* List of existing events for this day */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Registros actuales
                  </h4>
                  {getEventsOfDay(selectedDate).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">
                      No hay ningún registro guardado para este día.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getEventsOfDay(selectedDate).map(event => (
                        <div 
                          key={event.id}
                          className="flex items-center justify-between p-3.5 bg-muted/20 border border-muted/50 rounded-2xl"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl pt-0.5 select-none">
                              {event.type === 'sexual' ? '🔥' : '❤️'}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {event.type === 'sexual' 
                                  ? `Actividad Íntima (${event.category})`
                                  : event.title}
                              </p>
                              {event.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  {event.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-2">
                                {event.user.profilePic ? (
                                  <img 
                                    src={event.user.profilePic} 
                                    alt={event.user.name} 
                                    className="w-4.5 h-4.5 rounded-full object-cover border border-muted/50" 
                                  />
                                ) : (
                                  <div className="w-4.5 h-4.5 bg-accent/20 rounded-full flex items-center justify-center text-[8px] font-bold text-accent">
                                    {event.user.name[0]}
                                  </div>
                                )}
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  Registrado por {event.user.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-500/5 transition-colors ml-2"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to add a new event */}
                <form onSubmit={handleAddEvent} className="border-t border-muted/50 pt-5 space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Agregar nuevo registro
                  </h4>

                  {/* Selector de tipo (Sexual / Evento) */}
                  <div className="flex bg-muted/40 p-1 rounded-2xl border border-muted/20">
                    <button
                      type="button"
                      onClick={() => {
                        setEventType('sexual');
                        setEventCategory('protegido');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        eventType === 'sexual' 
                          ? 'bg-card text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Flame className="w-4 h-4 text-pink-500 fill-pink-500/10" />
                      Actividad Íntima
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEventType('important');
                        setEventCategory('cita');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        eventType === 'important' 
                          ? 'bg-card text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Heart className="w-4 h-4 text-accent fill-accent/10" />
                      Evento Especial
                    </button>
                  </div>

                  {eventType === 'important' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold ml-1 text-muted-foreground">Título del evento</label>
                      <input
                        type="text"
                        required
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Ej. Nuestro Aniversario 💖"
                        className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all"
                      />
                    </div>
                  )}

                  {/* Categorías específicas según tipo */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold ml-1 text-muted-foreground">Categoría</label>
                    <select
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all text-foreground"
                    >
                      {eventType === 'sexual' ? (
                        <>
                          <option value="protegido">Protegido 🛡️</option>
                          <option value="sin proteccion">Sin protección ⚠️</option>
                          <option value="oral">Oral 👅</option>
                          <option value="otro">Otro 🌶️</option>
                        </>
                      ) : (
                        <>
                          <option value="cita">Cita / Salida 🌹</option>
                          <option value="aniversario">Aniversario / Cumpleaños 🎉</option>
                          <option value="viaje">Viaje / Escapada ✈️</option>
                          <option value="otro">Otro Momento 📷</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold ml-1 text-muted-foreground">Notas u observaciones (opcional)</label>
                    <textarea
                      value={eventNotes}
                      onChange={(e) => setEventNotes(e.target.value)}
                      placeholder={
                        eventType === 'sexual'
                          ? "Ej: En el cuarto de invitados, estuvo increíble..."
                          : "Ej: Reservamos cena en el restaurante italiano..."
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-accent focus:bg-card focus:ring-1 focus:ring-accent outline-none text-sm transition-all resize-none h-20"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={saving}
                    className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold shadow-lg shadow-accent/20 flex items-center justify-center transition-all disabled:opacity-70 text-sm mt-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Registro'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
