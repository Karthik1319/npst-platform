/**
 * Joins class names, skipping falsy values (in-house replacement for
 * `clsx` + `tailwind-merge`). Conflicting styles are resolved by CSS order
 * instead: shared components sit in the `ui` cascade layer, so classes passed
 * in from a page always win, as they did with tailwind-merge.
 */
export type ClassValue =
  string | number | false | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else out.push(String(input));
  }
  return out.join(' ');
}
