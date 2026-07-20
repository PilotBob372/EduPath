import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useCreateProfile } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppState } from '@/hooks/use-app-state';
import { Loader2, Sparkles, Target, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = 2026;

const gradeOptions = [
  { label: '9 класс', egeYear: CURRENT_YEAR + 2 },
  { label: '10 класс', egeYear: CURRENT_YEAR + 1 },
  { label: '11 класс', egeYear: CURRENT_YEAR },
];

const subjects = [
  'Математика', 'Русский язык', 'Информатика', 'Физика',
  'Обществознание', 'Биология', 'Химия', 'История',
  'Литература', 'Иностранный язык'
];
const hobbies = [
  'Программирование', 'Видеоигры', 'Чтение', 'Спорт',
  'Рисование', 'Музыка', 'Блогинг', 'Научные проекты',
  'Волонтерство', 'Дебаты'
];
const prioritiesList = [
  'Высокий доход', 'Творчество', 'Стабильность',
  'Помощь людям', 'Технологии', 'Управление'
];
const careerInterests = [
  'IT и разработка', 'Дизайн', 'Медицина', 'Инженерия',
  'Бизнес и финансы', 'Маркетинг', 'Наука', 'Медиа'
];

const orientationQuestions = [
  { id: 'q1', q: 'Как вы предпочитаете работать?', options: ['В команде', 'Самостоятельно', 'Управлять другими'] },
  { id: 'q2', q: 'Что вам интереснее решать?', options: ['Сложные логические задачи', 'Творческие вызовы', 'Практические бытовые проблемы'] },
  { id: 'q3', q: 'Как вы относитесь к рутине?', options: ['Спокойно, люблю порядок', 'Ненавижу, нужно разнообразие', 'Смотря какая цель'] },
  { id: 'q4', q: 'Ваш идеальный рабочий день включает...', options: ['Общение с людьми', 'Работу за компьютером', 'Движение и поездки'] },
  { id: 'q5', q: 'В свободное время вы скорее...', options: ['Изучите что-то новое', 'Создадите что-то свое', 'Проведете время с друзьями'] }
];

// Steps:
// 1  — класс (автоматически устанавливает год ЕГЭ)
// 2  — любимые предметы
// 3  — хобби
// 4  — приоритеты
// 5-9 — профориентационные вопросы
// 10 — сферы интересов
// 11 — финальный экран

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const { setProfileId } = useAppState();
  const createProfile = useCreateProfile();

  const [step, setStep] = useState(1);
  const totalSteps = 11;

  const [answers, setAnswers] = useState<any>({
    grade: '',
    egeYear: 0,
    favoriteSubjects: [],
    hobbies: [],
    priorities: [],
    interests: [],
    orientationAnswers: {}
  });

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleArrayItem = (key: string, item: string) => {
    setAnswers((prev: any) => {
      const arr = prev[key];
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter((i: string) => i !== item) };
      } else {
        return { ...prev, [key]: [...arr, item] };
      }
    });
  };

  const handleSubmit = () => {
    createProfile.mutate({
      data: {
        grade: answers.grade,
        egeYear: answers.egeYear,
        favoriteSubjects: answers.favoriteSubjects,
        hobbies: answers.hobbies,
        priorities: answers.priorities,
        interests: answers.interests,
        orientationAnswers: answers.orientationAnswers
      }
    }, {
      onSuccess: (data) => {
        setProfileId(data.id);
        toast.success('Профиль успешно создан!');
        setLocation('/profile');
      },
      onError: () => {
        toast.error('Произошла ошибка при сохранении профиля');
      }
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return answers.grade !== '';
      case 2: return answers.favoriteSubjects.length > 0;
      case 3: return answers.hobbies.length > 0;
      case 4: return answers.priorities.length > 0;
      case 5: return answers.orientationAnswers['q1'] !== undefined;
      case 6: return answers.orientationAnswers['q2'] !== undefined;
      case 7: return answers.orientationAnswers['q3'] !== undefined;
      case 8: return answers.orientationAnswers['q4'] !== undefined;
      case 9: return answers.orientationAnswers['q5'] !== undefined;
      case 10: return answers.interests.length > 0;
      default: return true;
    }
  };

  // Orientation questions occupy steps 5-9 → index = step - 5
  const orientIdx = step - 5;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">EduPath</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Шаг {step} из {totalSteps}
          </span>
        </div>

        <Progress value={(step / totalSteps) * 100} className="h-2 mb-12" />

        <div className="bg-card border border-border/50 shadow-xl shadow-primary/5 rounded-3xl p-6 md:p-10 min-h-[400px] flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 flex flex-col"
            >
              {/* Step 1 — класс */}
              {step === 1 && (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6">В каком вы классе?</h2>
                  <div className="grid gap-4 mt-auto mb-auto">
                    {gradeOptions.map(({ label, egeYear }) => (
                      <button
                        key={label}
                        onClick={() => {
                          setAnswers((prev: any) => ({ ...prev, grade: label, egeYear }));
                          setTimeout(handleNext, 300);
                        }}
                        className={`p-5 rounded-2xl text-left font-medium text-lg transition-all duration-200 border-2 ${
                          answers.grade === label
                            ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                            : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted'
                        }`}
                      >
                        <span>{label}</span>
                        <span className="ml-3 text-sm font-normal opacity-60">
                          — ЕГЭ в {egeYear} году
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 2 — предметы */}
              {step === 2 && (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Любимые школьные предметы</h2>
                  <p className="text-muted-foreground mb-6">Выберите один или несколько</p>
                  <div className="flex flex-wrap gap-3">
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        onClick={() => toggleArrayItem('favoriteSubjects', subject)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 border-2 ${
                          answers.favoriteSubjects.includes(subject)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3 — хобби */}
              {step === 3 && (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Чем вы увлекаетесь?</h2>
                  <p className="text-muted-foreground mb-6">Ваши хобби помогут нам найти подходящее направление</p>
                  <div className="flex flex-wrap gap-3">
                    {hobbies.map(hobby => (
                      <button
                        key={hobby}
                        onClick={() => toggleArrayItem('hobbies', hobby)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 border-2 ${
                          answers.hobbies.includes(hobby)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        {hobby}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 4 — приоритеты */}
              {step === 4 && (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Что для вас важнее всего в будущей работе?</h2>
                  <p className="text-muted-foreground mb-6">Выберите до 3 приоритетов</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prioritiesList.map(priority => (
                      <button
                        key={priority}
                        onClick={() => toggleArrayItem('priorities', priority)}
                        className={`p-4 rounded-xl font-medium transition-all duration-200 border-2 text-left flex items-center justify-between ${
                          answers.priorities.includes(priority)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        {priority}
                        {answers.priorities.includes(priority) && <Sparkles className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Steps 5-9 — профориентация */}
              {step >= 5 && step <= 9 && (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">
                    {orientationQuestions[orientIdx].q}
                  </h2>
                  <div className="grid gap-4 mt-auto mb-auto">
                    {orientationQuestions[orientIdx].options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => {
                          setAnswers((prev: any) => ({
                            ...prev,
                            orientationAnswers: { ...prev.orientationAnswers, [orientationQuestions[orientIdx].id]: opt }
                          }));
                          setTimeout(handleNext, 300);
                        }}
                        className={`p-5 rounded-2xl text-left font-medium text-lg transition-all duration-200 border-2 ${
                          answers.orientationAnswers[orientationQuestions[orientIdx].id] === opt
                            ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                            : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 10 — сферы интересов */}
              {step === 10 && (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Какие сферы вам интересны?</h2>
                  <p className="text-muted-foreground mb-6">Даже если вы ещё не уверены</p>
                  <div className="flex flex-wrap gap-3">
                    {careerInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleArrayItem('interests', interest)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 border-2 ${
                          answers.interests.includes(interest)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 11 — финальный экран */}
              {step === 11 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                    <Target className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-3">Всё готово!</h2>
                    <p className="text-muted-foreground text-lg max-w-[300px] mx-auto">
                      Наш ИИ готов проанализировать ваши ответы и подобрать идеальное направление
                    </p>
                    {answers.egeYear > 0 && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {answers.grade} · ЕГЭ в {answers.egeYear} году
                      </p>
                    )}
                  </div>
                  <Button
                    size="lg"
                    className="w-full mt-4 h-14 text-lg rounded-xl group"
                    onClick={handleSubmit}
                    disabled={createProfile.isPending}
                  >
                    {createProfile.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Получить рекомендации
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 11 && (
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="lg"
              onClick={handleBack}
              disabled={step === 1}
              className="text-muted-foreground hover:text-foreground"
            >
              Назад
            </Button>
            {/* Show "Далее" only on multi-select steps (not auto-advance single-select ones) */}
            {step !== 1 && !(step >= 5 && step <= 9) && (
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="rounded-xl px-8 shadow-md shadow-primary/20"
              >
                Далее
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
