import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Clock, User, Video, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';

const EXPERTS = [
  {
    id: 1,
    name: 'Елена Воронова',
    role: 'Эксперт по поступлению в МГУ и ВШЭ',
    avatar: 'Е',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    id: 2,
    name: 'Сергей Данилов',
    role: 'Специалист по техническим специальностям',
    avatar: 'С',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    id: 3,
    name: 'Наталья Кирова',
    role: 'Консультант по медицинским и биологическим вузам',
    avatar: 'Н',
    color: 'bg-emerald-100 text-emerald-700',
  },
];

// Returns slots for a given day index within the month (1-based)
function getSlotsForDay(day: number, month: number, expertId: number): string[] {
  const seed = day * 31 + month * 7 + expertId * 13;
  const allSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  return allSlots.filter((_, i) => (seed + i * 3) % 4 !== 0);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekday(year: number, month: number) {
  // 0=Sun…6=Sat → convert to Mon-first (0=Mon…6=Sun)
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function Booking() {
  const [, setLocation] = useLocation();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedExpert, setSelectedExpert] = useState(EXPERTS[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showModal, setShowModal] = useState(false);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };
  const isWeekend = (day: number) => {
    const wd = new Date(viewYear, viewMonth, day).getDay();
    return wd === 0 || wd === 6;
  };
  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
    setSelectedSlot(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const selectDay = (day: number) => {
    if (isPast(day) || isWeekend(day)) return;
    setSelectedDay(day);
    setSelectedSlot(null);
  };

  const slots = selectedDay ? getSlotsForDay(selectedDay, viewMonth, selectedExpert.id) : [];

  const handleBook = () => {
    if (!name.trim() || !phone.trim()) { toast.error('Заполните имя и телефон'); return; }
    setShowModal(false);
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Запись подтверждена!</h1>
            <p className="text-muted-foreground">
              Встреча с <span className="font-medium text-foreground">{selectedExpert.name}</span> запланирована
              на <span className="font-medium text-foreground">
                {selectedDay} {MONTH_NAMES[viewMonth].toLowerCase()} в {selectedSlot}
              </span>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Мы отправим ссылку на видеозвонок за 30 минут до начала.
            </p>
          </div>
          <button
            onClick={() => setLocation('/plan')}
            className="w-full bg-primary text-primary-foreground rounded-xl h-12 font-semibold hover:opacity-90 transition-opacity"
          >
            Вернуться к плану
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-10">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => setLocation('/plan')} className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-lg">Запись на консультацию</div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 max-w-4xl">
        {/* Expert selector */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Выберите эксперта</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXPERTS.map(ex => (
              <button
                key={ex.id}
                onClick={() => { setSelectedExpert(ex); setSelectedDay(null); setSelectedSlot(null); }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selectedExpert.id === ex.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${ex.color}`}>
                  {ex.avatar}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{ex.name}</div>
                  <div className="text-xs text-muted-foreground leading-tight mt-0.5">{ex.role}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <section className="bg-card border border-border rounded-3xl p-5 shadow-sm">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-base">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className={`text-center text-xs font-semibold py-1 ${d === 'Сб' || d === 'Вс' ? 'text-rose-400' : 'text-muted-foreground'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const past = isPast(day);
                const weekend = isWeekend(day);
                const disabled = past || weekend;
                const active = selectedDay === day;
                const todayMark = isToday(day);
                const hasSlots = !disabled && getSlotsForDay(day, viewMonth, selectedExpert.id).length > 0;

                return (
                  <button
                    key={day}
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    className={`relative mx-auto w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-150
                      ${active ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : ''}
                      ${!active && !disabled ? 'hover:bg-muted cursor-pointer' : ''}
                      ${disabled ? 'opacity-30 cursor-default' : ''}
                      ${todayMark && !active ? 'ring-2 ring-primary/40' : ''}
                      ${weekend ? 'text-rose-400' : ''}
                    `}
                  >
                    {day}
                    {hasSlots && !active && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/60" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/60 inline-block" />
                Есть слоты
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                Выходной
              </span>
            </div>
          </section>

          {/* Slots panel */}
          <section className="bg-card border border-border rounded-3xl p-5 shadow-sm">
            {!selectedDay ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3 py-10">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-7 h-7 opacity-40" />
                </div>
                <p className="text-sm">Выберите дату в календаре,<br />чтобы увидеть свободные слоты</p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-base mb-1">
                  {selectedDay} {MONTH_NAMES[viewMonth].toLowerCase()}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {slots.length} свободных слотов · {selectedExpert.name.split(' ')[0]}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                        selectedSlot === slot
                          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                          : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                {/* Format info */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="w-4 h-4" />
                    Видеозвонок (Google Meet)
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Длительность: 45 минут
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {selectedExpert.role}
                  </div>
                </div>

                <button
                  disabled={!selectedSlot}
                  onClick={() => setShowModal(true)}
                  className="w-full bg-primary text-primary-foreground rounded-xl h-12 font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedSlot ? `Записаться на ${selectedSlot}` : 'Выберите время'}
                </button>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Booking modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Подтверждение записи</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-2xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Эксперт</span>
                <span className="font-medium">{selectedExpert.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Дата</span>
                <span className="font-medium">{selectedDay} {MONTH_NAMES[viewMonth].toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Время</span>
                <span className="font-medium">{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Формат</span>
                <span className="font-medium">Видеозвонок, 45 мин</span>
              </div>
            </div>

            {/* Contact fields */}
            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="tel"
                placeholder="Телефон или Telegram"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={handleBook}
              className="w-full bg-primary text-primary-foreground rounded-xl h-12 font-semibold hover:opacity-90 transition-opacity"
            >
              Подтвердить запись
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
