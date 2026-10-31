import { useState, type FormEvent } from "react";
import { Redirect, useLocation } from "wouter";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

function requestedPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function Login() {
  const { user, isLoading, error: authError, signIn, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center" role="status">Checking sign-in…</main>;
  }
  if (user) return <Redirect to="/" />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(username, password);
      setPassword("");
      navigate(requestedPath());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="login-title">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TreePine aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 id="login-title" className="text-2xl font-semibold">Sign in to Family Tree</h1>
          <p className="text-sm text-muted-foreground">Use the account configured for this application.</p>
        </div>

        <div id="auth-notice" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="note">
          Sign-in verifies your credentials and creates a server session. Direct family-data API requests
          are not protected in this phase.
        </div>

        {authError && (
          <div className="space-y-2">
            <p className="text-sm text-destructive" role="alert">Authentication service unavailable. Try again.</p>
            <Button className="w-full" type="button" variant="outline" onClick={refresh}>Retry</Button>
          </div>
        )}

        <form className="space-y-4" onSubmit={submit} aria-describedby={authError ? undefined : "auth-notice"}>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              required
              maxLength={50}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={12}
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button className="w-full" type="submit" disabled={submitting || !!authError}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
