export const FREE_DAILY_RUNS = 30;
export const PRO_DAILY_RUNS = 1000;

export function getDayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
