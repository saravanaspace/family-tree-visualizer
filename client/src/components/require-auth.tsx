import type { ReactNode } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, error, refresh } = useAuth();
  const [location] = useLocation();
  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center" role="status">Checking sign-in…</main>;
  }
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p role="alert">Authentication service unavailable. Family data is not shown.</p>
        <Button onClick={refresh}>Try again</Button>
      </main>
    );
  }
  return user ? <>{children}</> : <Redirect to={`/login?next=${encodeURIComponent(location)}`} />;
}
