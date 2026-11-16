const CRORE = 10_000_000;
const LAKH = 100_000;

/** Indian rupees in crore or lakh, e.g. `₹18.4 Cr`, `₹85 L`. */
export function formatInr(value: number): string {
  if (value >= CRORE) return `₹${(value / CRORE).toFixed(1)} Cr`;
  if (value >= LAKH) return `₹${Math.round(value / LAKH)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-IN');
}

/** "just now", "10 min ago", "2 hr ago", "3 days ago", then a date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(iso.slice(0, 10));
}

const localDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** `18 Nov`, or `18 Nov 2027` outside the current year. */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export type DueState = 'overdue' | 'today' | 'soon' | 'later';

/** How urgent a due date is, and a short label for it. */
export function dueInfo(isoDate: string): { state: DueState; label: string } {
  const today = localDate();
  if (isoDate < today) return { state: 'overdue', label: 'Overdue' };
  if (isoDate === today) return { state: 'today', label: 'Today' };
  if (isoDate === localDate(1)) return { state: 'soon', label: 'Tomorrow' };
  return { state: 'later', label: formatDate(isoDate) };
}

/** "Good morning" / "Good afternoon" / "Good evening". */
export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
