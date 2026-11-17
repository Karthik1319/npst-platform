import type { ComponentProps } from 'react';
import { useCssVars } from '@/lib/css-vars';
import { cn } from '@/lib/utils';
import styles from './Swatch.module.css';

/**
 * A colour sample (brand colours on the Branding pages). The colour is only
 * known at runtime, so it is passed to CSS as a variable (no inline style).
 */
export function Swatch({
  color,
  className,
  ...props
}: ComponentProps<'span'> & { color: string }) {
  const ref = useCssVars<HTMLSpanElement>({ '--swatch-color': color });
  return <span ref={ref} className={cn(styles.swatch, className)} {...props} />;
}
