import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useGenerateRecommendations } from '@workspace/api-client-react';
import { useAppState } from '@/hooks/use-app-state';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, BrainCircuit, GraduationCap, ChevronRight, Briefcase, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { toast } from 'sonner';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { profileId, setSelectedSpecialty } = useAppState();
  const [result, setResult] = useState<any>(null);
  
  const generateRecommendations = useGenerateRecommendations();

  useEffect(() => {
    if (!profileId) {
      setLocation('/');
      return;
    }

    if (!result && !generateRecommendations.isPending) {
      generateRecommendations.mutate({
        data: { profileId }
      }, {
        onSuccess: (data) => setResult(data),
        onError: () => toast.error('Не удалось загрузить рекомендации')
      });
    }
  }, [profileId]);

  if (!result) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
            <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Анализируем профиль</h2>
            <p className="text-muted-foreground">ИИ обрабатывает ваши ответы и подбирает лучшие образовательные направления...</p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = result.studyDirections.map((dir: any) => ({
    name: dir.name,
    score: dir.matchScore,
    shortName: dir.name.split(' ')[0]
  }));

  const handleSelectDirection = (name: string) => {
    setSelectedSpecialty(name);
    setLocation('/universities');
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-70 transition-opacity"
          >
            <Sparkles className="w-6 h-6" /> EduPath
          </button>
          <div className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
            Ваш профиль
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4 text-accent">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold mb-3">Ваши сильные стороны</h2>
              <p className="text-muted-foreground leading-relaxed">
                {result.strengths}
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Сферы интересов</h3>
              <div className="flex flex-wrap gap-2">
                {result.interestAreas.map((area: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-lg font-medium">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Совпадение по направлениям</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="shortName" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.4)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Подходящие направления</h2>
              <span className="text-muted-foreground text-sm font-medium">{result.studyDirections.length} варианта</span>
            </div>

            <div className="grid gap-4">
              {result.studyDirections.map((dir: any, idx: number) => (
                <div key={idx} className="bg-card border border-border hover:border-primary/50 transition-colors rounded-3xl p-6 shadow-sm group">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {dir.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                          <Target className="w-4 h-4" />
                          {dir.matchScore}% совпадение
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6 line-clamp-2">
                    {dir.description}
                  </p>

                  <div className="bg-muted/50 rounded-2xl p-4 mb-6 border border-border/50">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" /> Почему вам подходит:
                    </h4>
                    <p className="text-sm text-muted-foreground">{dir.whyFits}</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" /> Профессии:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {dir.professions.map((prof: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-background border border-border rounded-md text-foreground">
                          {prof}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full sm:w-auto rounded-xl"
                    onClick={() => handleSelectDirection(dir.name)}
                  >
                    Посмотреть университеты
                    <GraduationCap className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}