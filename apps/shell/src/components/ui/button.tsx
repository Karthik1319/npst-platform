import type { ComponentProps, ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from '@/lib/variants';
import { renderElement } from './primitives';
import styles from './button.module.css';

/* Same variants as the original (shadcn on Base UI); styles converted to CSS modules. */
const buttonVariants = cva(`${styles.buttonVariants} npst-g-button`, {
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
  VariantProps<typeof buttonVariants> & {
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
    className: cn(buttonVariants({ variant, size, className })),
    ...props,
  };
  if (render) return renderElement(render, own);
  return <button type={type ?? 'button'} {...own} />;
}

export { Button, buttonVariants };
