import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGeneratePrograms } from '@workspace/api-client-react';
import { useAppState } from '@/hooks/use-app-state';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar, BookOpen, GraduationCap, Clock, Receipt, User, ArrowRight, Star, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Plan() {
  const [, setLocation] = useLocation();
  const { profileId, selectedUniversityId, selectedSpecialty } = useAppState();
  const [result, setResult] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  
  const generatePrograms = useGeneratePrograms();

  useEffect(() => {
    if (!profileId || !selectedUniversityId) {
      setLocation('/universities');
      return;
    }

    if (!result && !generatePrograms.isPending) {
      generatePrograms.mutate({
        data: { 
          profileId,
          universityId: selectedUniversityId,
          specialty: selectedSpecialty || 'Общее направление'
        }
      }, {
        onSuccess: (data) => {
          setResult(data);
          if (data.programs && data.programs.length > 0) {
            setSelectedType(data.programs[0].type);
          }
        },
        onError: () => toast.error('Не удалось загрузить план подготовки')
      });
    }
  }, [profileId, selectedUniversityId, selectedSpecialty]);

  if (!result) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
            <Calendar className="w-12 h-12 text-primary animate-pulse" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Составляем план</h2>
            <p className="text-muted-foreground">Рассчитываем нагрузку и подбираем программы подготовки...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(cost);
  };

  const selectedProgram = result.programs.find((p: any) => p.type === selectedType) || result.programs[0];

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation('/universities')} className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-lg">План подготовки</div>
          </div>
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-1.5 text-primary font-bold hover:opacity-70 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            EduPath
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8 max-w-5xl">
        <div className="bg-primary text-primary-foreground rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden shadow-lg shadow-primary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex flex-wrap items-center gap-2 mb-6">
              <span className="bg-background/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium">
                {result.universityName}
              </span>
              <span className="bg-background/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium">
                {result.specialty}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Ваш маршрут к поступлению</h1>
            
            <div className="flex flex-wrap gap-4 md:gap-8 mt-8">
              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/70 font-medium uppercase tracking-wider mb-0.5">Предметы</div>
                  <div className="font-bold text-sm">{result.exams.join(' • ')}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/70 font-medium uppercase tracking-wider mb-0.5">Срок подготовки</div>
                  <div className="font-bold text-sm">{result.preparationMonths} месяцев</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Варианты подготовки</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {result.programs.map((program: any) => (
            <button
              key={program.type}
              onClick={() => setSelectedType(program.type)}
              className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 relative overflow-hidden ${
                selectedType === program.type 
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]' 
                  : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <h3 className={`text-xl font-bold mb-2 ${selectedType === program.type ? 'text-primary' : 'text-foreground'}`}>
                {program.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {program.durationMonths} мес. интенсивной подготовки
              </p>
              <div className="font-bold text-lg flex items-center gap-2">
                <Receipt className={`w-5 h-5 ${selectedType === program.type ? 'text-primary' : 'text-muted-foreground'}`} />
                {formatCost(program.totalCostEstimate)}
              </div>
            </button>
          ))}
        </div>

        {selectedProgram && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                Курсы в этой программе
              </h3>
              
              <div className="grid gap-4">
                {selectedProgram.courses.map((course: any, idx: number) => (
                  <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg">{course.name}</h4>
                      <span className="text-xs font-bold px-2 py-1 bg-secondary text-secondary-foreground rounded-md uppercase tracking-wider">
                        {course.subject}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        Формат: <span className="font-medium text-foreground">{course.format}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Длительность: <span className="font-medium text-foreground">{course.durationWeeks} нед.</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 font-medium text-primary">
                      {formatCost(course.costPerMonth)} / месяц
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Рекомендованные репетиторы
              </h3>
              
              <div className="grid gap-4">
                {selectedProgram.tutors.map((tutor: any, idx: number) => (
                  <div key={idx} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="font-bold text-accent text-lg">{tutor.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{tutor.name}</h4>
                      <p className="text-sm text-primary font-medium mb-3">{tutor.subject}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground items-center">
                        <span>Опыт: {tutor.experience}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {tutor.rating}
                        </span>
                        {tutor.format && (
                          <>
                            <span>•</span>
                            <span>{tutor.format}</span>
                          </>
                        )}
                      </div>

                      {tutor.bio && (
                        <p className="mt-2 text-sm text-muted-foreground leading-snug">{tutor.bio}</p>
                      )}
                      
                      <div className="mt-3 font-medium flex items-center justify-between">
                        <span>{formatCost(tutor.costPerHour)} / час</span>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-primary/20 hover:bg-primary/5 text-primary">
                          Записаться
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border p-4 z-20">
        <div className="container mx-auto max-w-3xl flex items-center justify-center">
          <Button size="lg" className="w-full md:w-auto min-w-[300px] rounded-xl px-8 h-14 text-lg shadow-xl shadow-primary/20" onClick={() => setLocation('/booking')}>
            Записаться на консультацию
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}