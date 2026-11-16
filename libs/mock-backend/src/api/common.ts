/** One page of a longer list. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function paginate<T>(
  items: readonly T[],
  page = 1,
  pageSize = 10,
): Page<T> {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    total: items.length,
    page: current,
    pageSize,
  };
}

/** Case-insensitive match of `search` in any of the values. */
export function matches(
  search: string | undefined,
  ...values: (string | undefined)[]
): boolean {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  return values.some((value) => value?.toLowerCase().includes(needle));
}

/** Today's local date as YYYY-MM-DD. */
export function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const clone = <T>(value: T): T => structuredClone(value);
