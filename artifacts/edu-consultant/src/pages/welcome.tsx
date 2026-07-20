import { useLocation } from 'wouter';

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">EduPath</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Мы помогаем выбрать университет и создать индивидуальный план поступления.
            Для начала тестирования нажмите «Начать».
          </p>
        </div>

        <button
          onClick={() => setLocation('/questionnaire')}
          className="w-full bg-primary text-primary-foreground rounded-xl h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        >
          Начать
        </button>
      </div>
    </div>
  );
}
