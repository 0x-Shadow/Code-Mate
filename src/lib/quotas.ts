export const FREE_DAILY_RUNS = 30;
export const PRO_DAILY_RUNS = 1000;

export function getDayKey(d: Date = new Date()): string {
  // UTC to match the server quota key in convex/codeExecutions.ts.
  return d.toISOString().slice(0, 10);
}
