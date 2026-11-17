import type { ComponentProps, ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from '@/lib/variants';
import { renderElement } from './primitives';
import styles from './badge.module.css';

const badgeVariants = cva(`${styles.badgeVariants} npst-g-badge`, {
  variants: {
    variant: {
      default: styles.default,
      secondary: styles.secondary,
      destructive: styles.destructive,
      outline: styles.outline,
      ghost: styles.ghost,
      link: styles.link,
    },
  },
  defaultVariants: { variant: 'default' },
});

type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { render?: ReactElement };

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: BadgeProps) {
  const own = {
    'data-slot': 'badge',
    'data-variant': variant,
    className: cn(badgeVariants({ variant }), className),
    ...props,
  };
  return render ? renderElement(render, own) : <span {...own} />;
}

export { Badge, badgeVariants };
