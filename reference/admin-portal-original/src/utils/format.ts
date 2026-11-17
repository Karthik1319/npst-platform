import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function formatDate(value?: string | Date): string {
  const d = value ? toDate(value) : new Date();
  return isValid(d) ? format(d, 'dd MMM yyyy') : '—';
}

export function formatDateTime(value?: string | Date): string {
  const d = value ? toDate(value) : new Date();
  return isValid(d) ? format(d, 'dd MMM yyyy, HH:mm') : '—';
}

export function timeAgo(value: string | Date): string {
  const d = toDate(value);
  return isValid(d) ? `${formatDistanceToNowStrict(d)} ago` : '—';
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'NP';
}

/** Extracts {{variables}} from a notification template subject/body. */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}|\s/g, ''))));
}
