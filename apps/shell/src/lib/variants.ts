import { cn, type ClassValue } from '@/lib/utils';

/**
 * Component variants (in-house replacement for `class-variance-authority`):
 * a base class plus one class per chosen variant, in order, so later
 * variants override earlier ones.
 */
type VariantMap = Record<string, Record<string, ClassValue>>;
type Selection<V extends VariantMap> = { [K in keyof V]?: keyof V[K] | null };

export type VariantProps<F> = F extends (props?: infer P) => string
  ? Omit<NonNullable<P>, 'className' | 'class'>
  : never;

export function cva<V extends VariantMap>(
  base: ClassValue,
  config: { variants: V; defaultVariants?: Selection<V> },
) {
  return (
    props?: Selection<V> & { className?: ClassValue; class?: ClassValue },
  ): string => {
    const chosen = Object.keys(config.variants).map((key) => {
      const value =
        props?.[key as keyof V] ?? config.defaultVariants?.[key as keyof V];
      return value == null
        ? undefined
        : config.variants[key]?.[value as string];
    });
    return cn(base, ...chosen, props?.className, props?.class);
  };
}
