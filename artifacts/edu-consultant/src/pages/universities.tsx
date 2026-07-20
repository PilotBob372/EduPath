import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMatchUniversities } from '@workspace/api-client-react';
import { useAppState } from '@/hooks/use-app-state';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, MapPin, CheckCircle2, ChevronRight, GraduationCap, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Universities() {
  const [, setLocation] = useLocation();
  const { profileId, selectedSpecialty, selectedUniversityId, setSelectedUniversityId } = useAppState();
  const [result, setResult] = useState<any>(null);
  
  const matchUniversities = useMatchUniversities();

  useEffect(() => {
    if (!profileId) {
      setLocation('/');
      return;
    }

    if (!result && !matchUniversities.isPending) {
      matchUniversities.mutate({
        data: { 
          profileId,
          studyDirectionName: selectedSpecialty
        }
      }, {
        onSuccess: (data) => setResult(data),
        onError: () => toast.error('Не удалось загрузить список вузов')
      });
    }
  }, [profileId, selectedSpecialty]);

  if (!result) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
            <Building2 className="w-12 h-12 text-primary animate-pulse" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Подбираем вузы</h2>
            <p className="text-muted-foreground">Ищем лучшие университеты под ваш профиль и баллы...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSelect = (id: number) => {
    setSelectedUniversityId(id);
    toast.success('Университет выбран!');
  };

  const handleNext = () => {
    if (!selectedUniversityId) {
      toast.error('Выберите один университет для продолжения');
      return;
    }
    setLocation('/plan');
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation('/profile')} className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-lg">Подбор вузов</div>
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

      <main className="container mx-auto px-4 pt-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Рекомендованные университеты</h1>
            <p className="text-muted-foreground text-lg">
              Мы подобрали эти варианты на основе ваших приоритетов, уровня подготовки и интересов.
            </p>
          </div>

          <div className="grid gap-6">
            {result.matches.map((match: any, idx: number) => {
              const isSelected = selectedUniversityId === match.university.id;
              
              return (
                <div 
                  key={idx} 
                  className={`bg-card border-2 transition-all duration-300 rounded-3xl p-6 md:p-8 cursor-pointer relative overflow-hidden group ${
                    isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleSelect(match.university.id)}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-[100px] flex items-start justify-end p-4">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="font-bold text-lg bg-primary text-primary-foreground px-3 py-1 rounded-lg">
                          {match.university.shortName}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                          <Trophy className="w-4 h-4" />
                          Топ-{match.university.rank}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                          <MapPin className="w-4 h-4" />
                          Москва
                        </div>
                      </div>

                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {match.university.name}
                      </h3>
                      
                      <p className="text-muted-foreground mb-6 line-clamp-2 md:line-clamp-none">
                        {match.university.description}
                      </p>

                      <div className="bg-muted/50 rounded-2xl p-4 mb-6 border border-border/50">
                        <h4 className="font-semibold text-sm mb-2 text-foreground">Рекомендуемый факультет:</h4>
                        <p className="text-primary font-medium mb-3">{match.recommendedFaculty}</p>
                        <p className="text-sm text-muted-foreground">{match.matchReason}</p>
                      </div>
                    </div>

                    <div className="md:w-[240px] flex flex-col gap-4">
                      <div className="bg-secondary/50 rounded-2xl p-4 text-center">
                        <div className="text-3xl font-bold text-primary mb-1">{match.matchScore}%</div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Индекс совпадения</div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">Предметы ЕГЭ:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {match.university.egeSubjects.map((sub: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-1 bg-background border border-border rounded text-foreground font-medium">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1.5">Математика:</div>
                          <span className="text-xs px-2 py-1 bg-background border border-border rounded text-foreground font-medium">
                            {match.university.mathLevel}
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant={isSelected ? "default" : "outline"} 
                        className={`w-full mt-auto rounded-xl border-2 ${isSelected ? 'shadow-md shadow-primary/20' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(match.university.id);
                        }}
                      >
                        {isSelected ? 'Выбрано' : 'Выбрать этот университет'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border p-4 z-20">
        <div className="container mx-auto max-w-3xl flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
             <Button variant="secondary" className="rounded-xl px-6" onClick={() => setLocation('/chat')}>
                Обсудить с ИИ
              </Button>
          </div>
          <Button 
            size="lg" 
            className="w-full sm:w-auto rounded-xl px-8 h-12 shadow-lg shadow-primary/20"
            disabled={!selectedUniversityId}
            onClick={handleNext}
          >
            Смотреть план подготовки
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}