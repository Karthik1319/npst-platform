import type { ReactNode } from 'react';
import { useCssVars } from '@/lib/css-vars';
import styles from './Charts.module.css';

export interface TooltipState {
  x: number;
  y: number;
  label?: ReactNode;
  items: { name: string; value: number; className?: string }[];
}

/** Hover tooltip next to the pointer (same content as the original: "Name : value" in the series colour). */
export function ChartTooltip({
  state,
  width,
}: {
  state: TooltipState;
  width: number;
}) {
  const ref = useCssVars<HTMLDivElement>({
    '--tooltip-x': `${Math.min(state.x + 10, Math.max(width - 160, 0))}px`,
    '--tooltip-y': `${state.y + 10}px`,
  });
  return (
    <div ref={ref} className={styles.tooltip} role="tooltip">
      {state.label !== undefined && (
        <p className={styles.tooltipLabel}>{state.label}</p>
      )}
      <ul className={styles.tooltipList}>
        {state.items.map((item) => (
          <li
            key={item.name}
            className={`${styles.tooltipItem} ${item.className ?? ''}`}
          >
            {item.name} : {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
