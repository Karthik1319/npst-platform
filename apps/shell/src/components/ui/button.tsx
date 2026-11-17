import type { ComponentProps, ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from '@/lib/variants';
import { renderElement } from './primitives';
import styles from './button.module.css';

/* Same variants as the original (shadcn on Base UI); styles converted to CSS modules. */
const variants = cva(`${styles.buttonVariants} npst-g-button`, {
  variants: {
    variant: {
      default: styles.default,
      outline: styles.outline,
      secondary: styles.secondary,
      ghost: styles.ghost,
      destructive: styles.destructive,
      link: styles.link,
    },
    size: {
      default: styles.default2,
      xs: styles.xs,
      sm: styles.sm,
      lg: styles.lg,
      icon: `${styles.icon} npst-sized`,
      'icon-xs': `${styles.iconXs} npst-sized`,
      'icon-sm': `${styles.iconSm} npst-sized`,
      'icon-lg': `${styles.iconLg} npst-sized`,
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof variants> & {
    /** Render the button's behaviour and style onto another element (e.g. a router link). */
    render?: ReactElement;
    nativeButton?: boolean;
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  render,
  nativeButton,
  type,
  ...props
}: ButtonProps) {
  void nativeButton; // accepted for compatibility with the original API; not needed here
  const own = {
    'data-slot': 'button',
    className: cn(variants({ variant, size, className })),
    ...props,
  };
  if (render) return renderElement(render, own);
  return <button type={type ?? 'button'} {...own} />;
}

/**
 * Button classes for other elements (e.g. a router link styled as a button).
 * Like the original, these are not merged the way the Button component's
 * classes are, so a few base styles win (CSS: `npst-unmerged`).
 */
function buttonVariants(props?: Parameters<typeof variants>[0]): string {
  return cn(variants(props), 'npst-unmerged');
}

export { Button, buttonVariants };
