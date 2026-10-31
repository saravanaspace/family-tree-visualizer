let demoMode = false;

/** Turns demo mode on for this process. Only the demo entry point calls this. */
export function enableDemoMode(): void {
  demoMode = true;
}

export function isDemoMode(): boolean {
  return demoMode;
}

/** Returns an error message when demo mode must not run in this environment, otherwise null. */
export function assertNotProduction(env: Record<string, string | undefined>): string | null {
  return env.NODE_ENV === 'production'
    ? 'Demo mode cannot run when NODE_ENV=production. Use `npm run dev` or `npm start` with a database instead.'
    : null;
}

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export function isLoopbackAddress(address: string | undefined): boolean {
  return address !== undefined && LOOPBACK_ADDRESSES.has(address);
}
