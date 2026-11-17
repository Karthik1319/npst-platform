import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Sets CSS custom properties on an element from code, for values only known
 * at runtime (an application's brand colour, a branding draft in the live
 * preview). The element's styles read them with `var(--name)`; components
 * never pass a `style` prop.
 */
export function useCssVars<T extends HTMLElement>(
  vars: Readonly<Record<`--${string}`, string | number | undefined>>,
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const key = JSON.stringify(vars);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const entries = Object.entries(
      JSON.parse(key) as Record<string, string | number | null>,
    );
    for (const [name, value] of entries) {
      if (value === null || value === undefined)
        element.style.removeProperty(name);
      else element.style.setProperty(name, String(value));
    }
    return () =>
      entries.forEach(([name]) => element.style.removeProperty(name));
  }, [key]);
  return ref;
}
