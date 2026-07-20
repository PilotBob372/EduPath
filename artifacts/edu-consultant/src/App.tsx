import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Welcome from '@/pages/welcome';
import Questionnaire from '@/pages/questionnaire';
import Profile from '@/pages/profile';
import Universities from '@/pages/universities';
import Chat from '@/pages/chat';
import Plan from '@/pages/plan';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/questionnaire" component={Questionnaire} />
      <Route path="/profile" component={Profile} />
      <Route path="/universities" component={Universities} />
      <Route path="/chat" component={Chat} />
      <Route path="/plan" component={Plan} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;