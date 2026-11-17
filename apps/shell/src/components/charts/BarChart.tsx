import { useState } from 'react';
import { niceTicks, topRoundedBar } from './geometry';
import { ChartTooltip, type TooltipState } from './Tooltip';
import { useElementSize } from './useElementSize';
import styles from './Charts.module.css';

interface BarChartProps {
  data: readonly { label: string; value: number }[];
  /** Name of the series (tooltip). */
  seriesName: string;
  /** Class that sets the bar colour (`fill` and `color`, from theme variables). */
  barClassName: string;
  margin?: { top: number; right: number; bottom: number; left: number };
  xTickFontSize?: number;
  yTickFontSize?: number;
  /** Accessible name of the chart. */
  label: string;
}

const Y_AXIS_WIDTH = 60;
const X_AXIS_HEIGHT = 30;
const TICK_GAP = 8; // tick size (6) + margin (2), as in the original's chart library
const CATEGORY_GAP = 0.1; // 10% of each category on both sides
const RADIUS = 4;

/**
 * Vertical bar chart with a dashed horizontal grid and integer ticks
 * (in-house; same layout as the original's chart library).
 */
export function BarChart({
  data,
  seriesName,
  barClassName,
  margin = { top: 5, right: 5, bottom: 5, left: 5 },
  xTickFontSize = 12,
  yTickFontSize = 12,
  label,
}: BarChartProps) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<{
    index: number;
    tooltip: TooltipState;
  } | null>(null);

  const left = margin.left + Y_AXIS_WIDTH;
  const right = width - margin.right;
  const top = margin.top;
  const bottom = height - margin.bottom - X_AXIS_HEIGHT;
  const plotHeight = Math.max(bottom - top, 0);
  const band = data.length > 0 ? (right - left) / data.length : 0;
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)));
  const maxTick = ticks[ticks.length - 1] ?? 1;
  const yOf = (value: number) => bottom - (value / maxTick) * plotHeight;
  const barOffset = band * CATEGORY_GAP;
  const barWidth = Math.round(band - 2 * barOffset);

  return (
    <div ref={ref} className={styles.chart} onMouseLeave={() => setHover(null)}>
      {width > 0 && (
        <svg
          className={styles.surface}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - box.left;
            const y = event.clientY - box.top;
            const index = Math.floor((x - left) / band);
            const item = data[index];
            if (!item || x < left || x > right || y < top || y > bottom) {
              setHover(null);
              return;
            }
            setHover({
              index,
              tooltip: {
                x,
                y,
                label: item.label,
                items: [
                  {
                    name: seriesName,
                    value: item.value,
                    className: barClassName,
                  },
                ],
              },
            });
          }}
        >
          {ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              className={styles.grid}
              x1={left}
              y1={yOf(tick)}
              x2={right}
              y2={yOf(tick)}
            />
          ))}
          {hover && (
            <rect
              className={styles.cursor}
              x={left + hover.index * band}
              y={top}
              width={band}
              height={plotHeight}
            />
          )}
          {data.map((item, i) =>
            item.value > 0 ? (
              <path
                key={item.label}
                className={barClassName}
                d={topRoundedBar(
                  left + i * band + barOffset,
                  yOf(item.value),
                  barWidth,
                  bottom - yOf(item.value),
                  RADIUS,
                )}
              />
            ) : null,
          )}
          {data.map((item, i) => (
            <text
              key={`x-${item.label}`}
              className={styles.tick}
              x={left + (i + 0.5) * band}
              y={bottom + TICK_GAP}
              fontSize={xTickFontSize}
              textAnchor="middle"
            >
              <tspan x={left + (i + 0.5) * band} dy="0.71em">
                {item.label}
              </tspan>
            </text>
          ))}
          {ticks.map((tick) => {
            // The top label is kept inside the chart, like the original.
            const y = Math.max(yOf(tick), top + 5);
            return (
              <text
                key={`y-${tick}`}
                className={styles.tick}
                x={left - TICK_GAP}
                y={y}
                fontSize={yTickFontSize}
                textAnchor="end"
              >
                <tspan x={left - TICK_GAP} dy="0.355em">
                  {tick}
                </tspan>
              </text>
            );
          })}
        </svg>
      )}
      {hover && <ChartTooltip state={hover.tooltip} width={width} />}
    </div>
  );
}
