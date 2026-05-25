import {
  eachDayOfInterval,
  format,
  getDay,
  parseISO,
  startOfMonth,
  addDays,
  differenceInDays,
} from 'date-fns';

export function getSundaysInRange(startDate: Date, endDate: Date): Date[] {
  return eachDayOfInterval({ start: startDate, end: endDate }).filter(
    (d) => getDay(d) === 0,
  );
}

export function isThirdSundayOfMonth(date: Date): boolean {
  const monthStart = startOfMonth(date);
  let sundayCount = 0;
  let current = monthStart;
  while (current <= date) {
    if (getDay(current) === 0) {
      sundayCount++;
      if (current.getTime() === date.getTime()) {
        return sundayCount === 3;
      }
    }
    current = addDays(current, 1);
  }
  return false;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMMM d, yyyy');
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function daysSinceDate(isoDate: string): number {
  return differenceInDays(new Date(), parseISO(isoDate));
}

export function isSunday(date: Date): boolean {
  return getDay(date) === 0;
}

export function getSundayOrdinal(date: Date): number {
  const monthStart = startOfMonth(date);
  let count = 0;
  let current = monthStart;
  while (current <= date) {
    if (getDay(current) === 0) count++;
    current = addDays(current, 1);
  }
  return count;
}

export function getUpcomingSundays(count: number): Date[] {
  const today = new Date();
  const days: Date[] = [];
  let current = today;
  while (days.length < count) {
    if (getDay(current) === 0) days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}
