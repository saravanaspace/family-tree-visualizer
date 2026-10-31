import { assertNotProduction, enableDemoMode } from './demo-guard';

const problem = assertNotProduction(process.env);
if (problem) {
  console.error(problem);
  process.exit(1);
}

process.env.NODE_ENV ??= 'development';
enableDemoMode();
console.log('DEMO MODE: using in-memory sample data, no database is used. Changes are lost when the server stops.');

// Imported after enableDemoMode() so the storage module sees demo mode.
import('./index').catch((error) => {
  console.error(error);
  process.exit(1);
});
