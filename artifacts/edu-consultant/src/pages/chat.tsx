import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  useCreateAnthropicConversation, 
  useListAnthropicMessages 
} from '@workspace/api-client-react';
import { useAppState } from '@/hooks/use-app-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Send, Bot, User, BrainCircuit, GraduationCap, 
  Loader2, Zap, MessageSquare, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const objections = [
  'Слишком сложно поступить',
  'Не уверен что мне подходит',
  'Не хочу сдавать эти предметы',
  'Слишком долго готовиться',
  'Не уверен в выборе вуза'
];

interface Message {
  id: number | string;
  role: string;
  content: string;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const { profileId, selectedSpecialty, selectedUniversityId, conversationId, setConversationId } = useAppState();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const createConversation = useCreateAnthropicConversation();
  const { data: history, isLoading: isHistoryLoading } = useListAnthropicMessages(
    conversationId as number, 
    { query: { enabled: !!conversationId, queryKey: ['messages', conversationId] } }
  );

  useEffect(() => {
    if (!profileId) {
      setLocation('/');
      return;
    }

    if (!conversationId && !createConversation.isPending) {
      createConversation.mutate({
        data: { title: `Консультация: ${selectedSpecialty || 'Общие вопросы'}` }
      }, {
        onSuccess: (data) => setConversationId(data.id),
        onError: () => toast.error('Не удалось начать чат')
      });
    }
  }, [profileId, conversationId]);

  useEffect(() => {
    if (history) {
      setMessages(history.map(m => ({ id: m.id, role: m.role, content: m.content })));
    }
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !conversationId || isStreaming) return;
    
    const userMsgId = Date.now();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }]);
    setInput('');
    setIsStreaming(true);
    
    const botMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: botMsgId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch(`/api/anthropic/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });

      if (!response.ok) throw new Error('Network error');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No reader available');

      let currentText = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.content) {
                currentText += data.content;
                setMessages(prev => 
                  prev.map(m => m.id === botMsgId ? { ...m, content: currentText } : m)
                );
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Произошла ошибка при отправке сообщения');
      setMessages(prev => prev.filter(m => m.id !== botMsgId));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <header className="bg-card border-b border-border shrink-0 z-10 h-16">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">EduPath AI</h1>
                <div className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> В сети
                </div>
              </div>
            </div>
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

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/20">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              
              {messages.length === 0 && !isHistoryLoading && (
                <div className="text-center py-12 px-4 space-y-4 text-muted-foreground flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <p className="max-w-md mx-auto">
                    Я ваш личный консультант. Задавайте любые вопросы про поступление, 
                    ЕГЭ, проходные баллы или выбранные направления.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center text-primary mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-card border border-border shadow-sm rounded-tl-sm text-foreground'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                      {msg.content || (
                        <div className="flex gap-1 items-center h-5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-accent/20 shrink-0 flex items-center justify-center text-accent mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 bg-card border-t border-border">
            <div className="max-w-3xl mx-auto space-y-4">
              
              {!isStreaming && messages.length > 0 && messages[messages.length-1].role === 'assistant' && (
                <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                  {objections.map(obj => (
                    <button 
                      key={obj}
                      onClick={() => sendMessage(obj)}
                      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors border border-border flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      {obj}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative flex items-end gap-2 bg-background border-2 border-border focus-within:border-primary/50 rounded-2xl p-2 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Задайте вопрос о поступлении..."
                  className="w-full bg-transparent resize-none max-h-32 min-h-[44px] py-2 px-3 focus:outline-none text-sm sm:text-base"
                  rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 4) : 1}
                />
                <Button 
                  size="icon" 
                  className="rounded-xl shrink-0 h-11 w-11" 
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isStreaming || !conversationId}
                >
                  {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Context */}
        <div className="hidden lg:flex w-80 shrink-0 border-l border-border bg-card flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold mb-1 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              Контекст разговора
            </h2>
            <p className="text-sm text-muted-foreground">ИИ учитывает ваши предпочтения при ответах</p>
          </div>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {selectedSpecialty && (
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Выбранное направление</div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="font-medium text-primary mb-1">{selectedSpecialty}</div>
                  </div>
                </div>
              )}

              {selectedUniversityId && (
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Целевой вуз</div>
                  <div className="bg-secondary border border-border rounded-xl p-4 flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-sm font-medium">Университет выбран и учтён в плане</div>
                  </div>
                </div>
              )}

              {!selectedSpecialty && !selectedUniversityId && (
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-xl text-center border border-border border-dashed">
                  Пройдите опрос и выберите направление, чтобы персонализировать советы.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}