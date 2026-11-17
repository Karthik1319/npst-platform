import { useLayoutEffect, useRef, useState } from 'react';
import { pieAngles, sectorPath } from './geometry';
import { ChartTooltip, type TooltipState } from './Tooltip';
import { useElementSize } from './useElementSize';
import styles from './Charts.module.css';

export interface DonutSlice {
  name: string;
  value: number;
  /** Class that sets the slice colour (`fill` and `color`, from theme variables). */
  className: string;
}

interface DonutChartProps {
  data: readonly DonutSlice[];
  innerRadius: number;
  outerRadius: number;
  /** Degrees between slices. */
  paddingAngle?: number;
  /** Accessible name of the chart. */
  label: string;
}

const MARGIN = 5;

/**
 * Donut chart with a legend below (in-house; same geometry as the original's
 * chart library: first slice starts at 3 o'clock, counter-clockwise).
 */
export function DonutChart({
  data,
  innerRadius,
  outerRadius,
  paddingAngle = 0,
  label,
}: DonutChartProps) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const legendRef = useRef<HTMLUListElement>(null);
  const [legendHeight, setLegendHeight] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useLayoutEffect(() => {
    setLegendHeight(legendRef.current?.getBoundingClientRect().height ?? 0);
  }, [width, data]);

  const cx = width / 2;
  const cy = MARGIN + (height - 2 * MARGIN - legendHeight) / 2;
  const angles = pieAngles(
    data.map((slice) => slice.value),
    paddingAngle,
  );
  // The legend lists the series by name, like the original.
  const legend = [...data].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      ref={ref}
      className={styles.chart}
      onMouseLeave={() => setTooltip(null)}
    >
      {width > 0 && (
        <svg
          className={styles.surface}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
        >
          {data.map((slice, i) => {
            const angle = angles[i];
            if (!angle || slice.value === 0) return null;
            return (
              <path
                key={slice.name}
                className={slice.className}
                d={sectorPath(
                  cx,
                  cy,
                  innerRadius,
                  outerRadius,
                  angle.start,
                  angle.end,
                )}
                onMouseMove={(event) => {
                  const box =
                    event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                  setTooltip({
                    x: event.clientX - (box?.left ?? 0),
                    y: event.clientY - (box?.top ?? 0),
                    items: [
                      {
                        name: slice.name,
                        value: slice.value,
                        className: slice.className,
                      },
                    ],
                  });
                }}
              >
                <title>{`${slice.name}: ${slice.value}`}</title>
              </path>
            );
          })}
        </svg>
      )}
      <ul ref={legendRef} className={styles.legend}>
        {legend.map((slice) => (
          <li
            key={slice.name}
            className={`${styles.legendItem} ${slice.className}`}
          >
            <svg
              className={styles.legendIcon}
              width="14"
              height="14"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path d="M0,4h32v24h-32z" />
            </svg>
            <span>{slice.name}</span>
          </li>
        ))}
      </ul>
      {tooltip && <ChartTooltip state={tooltip} width={width} />}
    </div>
  );
}
