const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Parse YYYY-MM-DD string in local calendar date without timezone drift
 */
export function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Inclusive day count (e.g., 10/10 ~ 10/14 = 5 days, matching Excel DAYS + 1)
 */
export function calculateTripDays(startStr: string, endStr: string): number {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  if (!start || !end) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Format YYYY-MM-DD into Excel-style "10/9" + weekday "금"
 */
export function formatShortDateWithDay(dateStr: string): { date: string; day: string } | null {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  const month = d.getMonth() + 1;
  const dayNum = d.getDate();
  const weekday = WEEKDAYS_KO[d.getDay()];
  return {
    date: `${month}/${dayNum}`,
    day: weekday,
  };
}

export function formatDateRangeCompact(startStr: string, endStr: string): string {
  const s = formatShortDateWithDay(startStr);
  const e = formatShortDateWithDay(endStr);
  if (!s && !e) return '-';
  if (s && !e) return `${s.date}(${s.day}) ~`;
  if (!s && e) return `~ ${e.date}(${e.day})`;
  return `${s!.date}(${s!.day}) ~ ${e!.date}(${e!.day})`;
}

export function formatCurrencyKRW(amount: number): string {
  if (!amount) return '-';
  return amount.toLocaleString('ko-KR');
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
