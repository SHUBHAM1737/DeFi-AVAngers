import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/use-auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Router, Switch, Route } from 'wouter';
import HomePage from './pages/home-page';
import AuthPage from './pages/auth-page';
import NotFound from './pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/auth" component={AuthPage} />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}