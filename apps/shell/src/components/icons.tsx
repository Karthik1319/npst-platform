/*
 * In-house SVG icons used by the Admin Portal (no icon library at runtime).
 * Shapes copied from Lucide (https://lucide.dev), ISC License,
 * Copyright (c) Lucide Icons and Contributors. Rendered with the same attributes
 * as lucide-react, so the original screens look the same.
 * Generated in Step 18 from the icons the original code imports.
 */
import { forwardRef, type SVGProps } from 'react';

type IconNode = readonly (readonly [string, Record<string, string>])[];

export interface LucideProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
}
export type LucideIcon = ReturnType<typeof icon>;

function icon(cssName: string, node: IconNode) {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function Icon(
    {
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const labelled =
      rest['aria-label'] !== undefined ||
      rest['aria-labelledby'] !== undefined ||
      rest.role !== undefined;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={
          absoluteStrokeWidth
            ? (Number(strokeWidth) * 24) / Number(size)
            : strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        className={['lucide', cssName, className].filter(Boolean).join(' ')}
        aria-hidden={labelled ? undefined : true}
        {...rest}
      >
        {node.map(([tag, attrs], i) => {
          const Tag = tag as 'path';
          return <Tag key={i} {...attrs} />;
        })}
        {children}
      </svg>
    );
  });
  return Icon;
}

export const Accessibility = icon('lucide-accessibility', [
  ['circle', { cx: '16', cy: '4', r: '1' }],
  ['path', { d: 'm18 19 1-7-6 1' }],
  ['path', { d: 'm5 8 3-3 5.5 3-2.36 3.5' }],
  ['path', { d: 'M4.24 14.5a5 5 0 0 0 6.88 6' }],
  ['path', { d: 'M13.76 17.5a5 5 0 0 0-6.88-6' }],
]);
export const AlarmClock = icon('lucide-alarm-clock', [
  ['circle', { cx: '12', cy: '13', r: '8' }],
  ['path', { d: 'M12 9v4l2 2' }],
  ['path', { d: 'M5 3 2 6' }],
  ['path', { d: 'm22 6-3-3' }],
  ['path', { d: 'M6.38 18.7 4 21' }],
  ['path', { d: 'M17.64 18.67 20 21' }],
]);
export const AlertTriangle = icon('lucide-triangle-alert', [
  [
    'path',
    {
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
    },
  ],
  ['path', { d: 'M12 9v4' }],
  ['path', { d: 'M12 17h.01' }],
]);
export const ArrowLeft = icon('lucide-arrow-left', [
  ['path', { d: 'm12 19-7-7 7-7' }],
  ['path', { d: 'M19 12H5' }],
]);
export const ArrowRight = icon('lucide-arrow-right', [
  ['path', { d: 'M5 12h14' }],
  ['path', { d: 'm12 5 7 7-7 7' }],
]);
export const ArrowUp = icon('lucide-arrow-up', [
  ['path', { d: 'm5 12 7-7 7 7' }],
  ['path', { d: 'M12 19V5' }],
]);
export const Bell = icon('lucide-bell', [
  ['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }],
  [
    'path',
    {
      d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
    },
  ],
]);
export const BellRing = icon('lucide-bell-ring', [
  ['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }],
  ['path', { d: 'M22 8c0-2.3-.8-4.3-2-6' }],
  [
    'path',
    {
      d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
    },
  ],
  ['path', { d: 'M4 2C2.8 3.7 2 5.7 2 8' }],
]);
export const BookOpen = icon('lucide-book-open', [
  ['path', { d: 'M12 5v16' }],
  [
    'path',
    {
      d: 'M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z',
    },
  ],
]);
export const CalendarClock = icon('lucide-calendar-clock', [
  ['path', { d: 'M16 14v2.2l1.6 1' }],
  ['path', { d: 'M16 2v4' }],
  [
    'path',
    { d: 'M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5' },
  ],
  ['path', { d: 'M3 10h5' }],
  ['path', { d: 'M8 2v4' }],
  ['circle', { cx: '16', cy: '16', r: '6' }],
]);
export const Check = icon('lucide-check', [['path', { d: 'M20 6 9 17l-5-5' }]]);
export const CheckCircle2 = icon('lucide-circle-check', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'm9 12 2 2 4-4' }],
]);
export const CheckIcon = icon('lucide-check', [
  ['path', { d: 'M20 6 9 17l-5-5' }],
]);
export const ChevronDown = icon('lucide-chevron-down', [
  ['path', { d: 'm6 9 6 6 6-6' }],
]);
export const ChevronDownIcon = icon('lucide-chevron-down', [
  ['path', { d: 'm6 9 6 6 6-6' }],
]);
export const ChevronLeft = icon('lucide-chevron-left', [
  ['path', { d: 'm15 18-6-6 6-6' }],
]);
export const ChevronLeftIcon = icon('lucide-chevron-left', [
  ['path', { d: 'm15 18-6-6 6-6' }],
]);
export const ChevronRight = icon('lucide-chevron-right', [
  ['path', { d: 'm9 18 6-6-6-6' }],
]);
export const ChevronRightIcon = icon('lucide-chevron-right', [
  ['path', { d: 'm9 18 6-6-6-6' }],
]);
export const ChevronUpIcon = icon('lucide-chevron-up', [
  ['path', { d: 'm18 15-6-6-6 6' }],
]);
export const CircleCheckIcon = icon('lucide-circle-check', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'm9 12 2 2 4-4' }],
]);
export const Clock = icon('lucide-clock', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M12 6v6l4 2' }],
]);
export const Contrast = icon('lucide-contrast', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M12 18a6 6 0 0 0 0-12v12z' }],
]);
export const Copy = icon('lucide-copy', [
  ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }],
  ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }],
]);
export const Database = icon('lucide-database', [
  ['ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }],
  ['path', { d: 'M3 5V19A9 3 0 0 0 21 19V5' }],
  ['path', { d: 'M3 12A9 3 0 0 0 21 12' }],
]);
export const Download = icon('lucide-download', [
  ['path', { d: 'M12 15V3' }],
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
  ['path', { d: 'm7 10 5 5 5-5' }],
]);
export const ExternalLink = icon('lucide-external-link', [
  ['path', { d: 'M15 3h6v6' }],
  ['path', { d: 'M10 14 21 3' }],
  ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }],
]);
export const Eye = icon('lucide-eye', [
  [
    'path',
    {
      d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
    },
  ],
  ['circle', { cx: '12', cy: '12', r: '3' }],
]);
export const EyeOff = icon('lucide-eye-off', [
  [
    'path',
    {
      d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49',
    },
  ],
  ['path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' }],
  [
    'path',
    {
      d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143',
    },
  ],
  ['path', { d: 'm2 2 20 20' }],
]);
export const FileText = icon('lucide-file-text', [
  [
    'path',
    {
      d: 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z',
    },
  ],
  ['path', { d: 'M14 2v5a1 1 0 0 0 1 1h5' }],
  ['path', { d: 'M10 9H8' }],
  ['path', { d: 'M16 13H8' }],
  ['path', { d: 'M16 17H8' }],
]);
export const Globe = icon('lucide-globe', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }],
  ['path', { d: 'M2 12h20' }],
]);
export const Globe2 = icon('lucide-earth', [
  ['path', { d: 'M21.54 15H17a2 2 0 0 0-2 2v4.54' }],
  [
    'path',
    {
      d: 'M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17',
    },
  ],
  [
    'path',
    { d: 'M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05' },
  ],
  ['circle', { cx: '12', cy: '12', r: '10' }],
]);
export const HelpCircle = icon('lucide-circle-question-mark', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }],
  ['path', { d: 'M12 17h.01' }],
]);
export const History = icon('lucide-rotate-ccw-clock', [
  ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
  ['path', { d: 'M3 3v5h5' }],
  ['path', { d: 'M12 7v5l4 2' }],
]);
export const ImagePlus = icon('lucide-image-plus', [
  ['path', { d: 'M16 5h6' }],
  ['path', { d: 'M19 2v6' }],
  [
    'path',
    { d: 'M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5' },
  ],
  ['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }],
  ['circle', { cx: '9', cy: '9', r: '2' }],
]);
export const Inbox = icon('lucide-inbox', [
  ['polyline', { points: '22 12 16 12 14 15 10 15 8 12 2 12' }],
  [
    'path',
    {
      d: 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    },
  ],
]);
export const InfoIcon = icon('lucide-info', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M12 16v-4' }],
  ['path', { d: 'M12 8h.01' }],
]);
export const KeyRound = icon('lucide-key-round', [
  [
    'path',
    {
      d: 'M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z',
    },
  ],
  ['circle', { cx: '16.5', cy: '7.5', r: '.5', fill: 'currentColor' }],
]);
export const LayoutDashboard = icon('lucide-layout-dashboard', [
  ['rect', { width: '7', height: '9', x: '3', y: '3', rx: '1' }],
  ['rect', { width: '7', height: '5', x: '14', y: '3', rx: '1' }],
  ['rect', { width: '7', height: '9', x: '14', y: '12', rx: '1' }],
  ['rect', { width: '7', height: '5', x: '3', y: '16', rx: '1' }],
]);
export const LayoutGrid = icon('lucide-layout-grid', [
  ['rect', { width: '7', height: '7', x: '3', y: '3', rx: '1' }],
  ['rect', { width: '7', height: '7', x: '14', y: '3', rx: '1' }],
  ['rect', { width: '7', height: '7', x: '14', y: '14', rx: '1' }],
  ['rect', { width: '7', height: '7', x: '3', y: '14', rx: '1' }],
]);
export const LifeBuoy = icon('lucide-life-buoy', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'm4.93 4.93 4.24 4.24' }],
  ['path', { d: 'm14.83 9.17 4.24-4.24' }],
  ['path', { d: 'm14.83 14.83 4.24 4.24' }],
  ['path', { d: 'm9.17 14.83-4.24 4.24' }],
  ['circle', { cx: '12', cy: '12', r: '4' }],
]);
export const List = icon('lucide-list', [
  ['path', { d: 'M3 5h.01' }],
  ['path', { d: 'M3 12h.01' }],
  ['path', { d: 'M3 19h.01' }],
  ['path', { d: 'M8 5h13' }],
  ['path', { d: 'M8 12h13' }],
  ['path', { d: 'M8 19h13' }],
]);
export const Loader2 = icon('lucide-loader-circle', [
  ['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' }],
]);
export const Loader2Icon = icon('lucide-loader-circle', [
  ['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56' }],
]);
export const LogOut = icon('lucide-log-out', [
  ['path', { d: 'm16 17 5-5-5-5' }],
  ['path', { d: 'M21 12H9' }],
  ['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }],
]);
export const Mail = icon('lucide-mail', [
  ['path', { d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7' }],
  ['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }],
]);
export const Menu = icon('lucide-menu', [
  ['path', { d: 'M4 5h16' }],
  ['path', { d: 'M4 12h16' }],
  ['path', { d: 'M4 19h16' }],
]);
export const MessageSquare = icon('lucide-message-square', [
  [
    'path',
    {
      d: 'M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z',
    },
  ],
]);
export const Moon = icon('lucide-moon', [
  [
    'path',
    {
      d: 'M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401',
    },
  ],
]);
export const OctagonXIcon = icon('lucide-octagon-x', [
  ['path', { d: 'm15 9-6 6' }],
  [
    'path',
    {
      d: 'M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z',
    },
  ],
  ['path', { d: 'm9 9 6 6' }],
]);
export const Palette = icon('lucide-palette', [
  [
    'path',
    {
      d: 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
    },
  ],
  ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor' }],
  ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor' }],
  ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor' }],
  ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor' }],
]);
export const PanelLeftClose = icon('lucide-panel-left-close', [
  ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
  ['path', { d: 'M9 3v18' }],
  ['path', { d: 'm16 15-3-3 3-3' }],
]);
export const PanelLeftOpen = icon('lucide-panel-left-open', [
  ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
  ['path', { d: 'M9 3v18' }],
  ['path', { d: 'm14 9 3 3-3 3' }],
]);
export const Pencil = icon('lucide-pencil', [
  [
    'path',
    {
      d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
    },
  ],
  ['path', { d: 'm15 5 4 4' }],
]);
export const Plus = icon('lucide-plus', [
  ['path', { d: 'M5 12h14' }],
  ['path', { d: 'M12 5v14' }],
]);
export const Power = icon('lucide-power', [
  ['path', { d: 'M12 2v10' }],
  ['path', { d: 'M18.4 6.6a9 9 0 1 1-12.77.04' }],
]);
export const RotateCcw = icon('lucide-rotate-ccw', [
  ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
  ['path', { d: 'M3 3v5h5' }],
]);
export const Save = icon('lucide-save', [
  [
    'path',
    {
      d: 'M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
    },
  ],
  ['path', { d: 'M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7' }],
  ['path', { d: 'M7 3v4a1 1 0 0 0 1 1h7' }],
]);
export const ScrollText = icon('lucide-scroll-text', [
  ['path', { d: 'M15 12h-5' }],
  ['path', { d: 'M15 8h-5' }],
  ['path', { d: 'M19 17V5a2 2 0 0 0-2-2H4' }],
  [
    'path',
    {
      d: 'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3',
    },
  ],
]);
export const Search = icon('lucide-search', [
  ['path', { d: 'm21 21-4.34-4.34' }],
  ['circle', { cx: '11', cy: '11', r: '8' }],
]);
export const Send = icon('lucide-send', [
  [
    'path',
    {
      d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
    },
  ],
  ['path', { d: 'm21.854 2.147-10.94 10.939' }],
]);
export const Settings = icon('lucide-settings', [
  [
    'path',
    {
      d: 'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915',
    },
  ],
  ['circle', { cx: '12', cy: '12', r: '3' }],
]);
export const Settings2 = icon('lucide-settings2', [
  ['path', { d: 'M14 17H5' }],
  ['path', { d: 'M19 7h-9' }],
  ['circle', { cx: '17', cy: '17', r: '3' }],
  ['circle', { cx: '7', cy: '7', r: '3' }],
]);
export const ShieldAlert = icon('lucide-shield-alert', [
  [
    'path',
    {
      d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    },
  ],
  ['path', { d: 'M12 8v4' }],
  ['path', { d: 'M12 16h.01' }],
]);
export const ShieldCheck = icon('lucide-shield-check', [
  [
    'path',
    {
      d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    },
  ],
  ['path', { d: 'm9 12 2 2 4-4' }],
]);
export const Smartphone = icon('lucide-smartphone', [
  ['rect', { width: '14', height: '20', x: '5', y: '2', rx: '2', ry: '2' }],
  ['path', { d: 'M12 18h.01' }],
]);
export const Sparkles = icon('lucide-sparkles', [
  [
    'path',
    {
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
    },
  ],
  ['path', { d: 'M20 2v4' }],
  ['path', { d: 'M22 4h-4' }],
  ['circle', { cx: '4', cy: '20', r: '2' }],
]);
export const Sun = icon('lucide-sun', [
  ['circle', { cx: '12', cy: '12', r: '4' }],
  ['path', { d: 'M12 2v2' }],
  ['path', { d: 'M12 20v2' }],
  ['path', { d: 'm4.93 4.93 1.41 1.41' }],
  ['path', { d: 'm17.66 17.66 1.41 1.41' }],
  ['path', { d: 'M2 12h2' }],
  ['path', { d: 'M20 12h2' }],
  ['path', { d: 'm6.34 17.66-1.41 1.41' }],
  ['path', { d: 'm19.07 4.93-1.41 1.41' }],
]);
export const Timer = icon('lucide-timer', [
  ['line', { x1: '10', x2: '14', y1: '2', y2: '2' }],
  ['line', { x1: '12', x2: '15', y1: '14', y2: '11' }],
  ['circle', { cx: '12', cy: '14', r: '8' }],
]);
export const Trash2 = icon('lucide-trash2', [
  ['path', { d: 'M10 11v6' }],
  ['path', { d: 'M14 11v6' }],
  ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }],
  ['path', { d: 'M3 6h18' }],
  ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
]);
export const TriangleAlertIcon = icon('lucide-triangle-alert', [
  [
    'path',
    {
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
    },
  ],
  ['path', { d: 'M12 9v4' }],
  ['path', { d: 'M12 17h.01' }],
]);
export const Upload = icon('lucide-upload', [
  ['path', { d: 'M12 3v12' }],
  ['path', { d: 'm17 8-5-5-5 5' }],
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }],
]);
export const UserPlus = icon('lucide-user-plus', [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
  ['circle', { cx: '9', cy: '7', r: '4' }],
  ['line', { x1: '19', x2: '19', y1: '8', y2: '14' }],
  ['line', { x1: '22', x2: '16', y1: '11', y2: '11' }],
]);
export const Users = icon('lucide-users', [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
  ['path', { d: 'M16 3.128a4 4 0 0 1 0 7.744' }],
  ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
  ['circle', { cx: '9', cy: '7', r: '4' }],
]);
export const X = icon('lucide-x', [
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }],
]);
export const XCircle = icon('lucide-circle-x', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'm15 9-6 6' }],
  ['path', { d: 'm9 9 6 6' }],
]);
export const XIcon = icon('lucide-x', [
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }],
]);
export const ZoomIn = icon('lucide-zoom-in', [
  ['circle', { cx: '11', cy: '11', r: '8' }],
  ['line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65' }],
  ['line', { x1: '11', x2: '11', y1: '8', y2: '14' }],
  ['line', { x1: '8', x2: '14', y1: '11', y2: '11' }],
]);
export const ZoomOut = icon('lucide-zoom-out', [
  ['circle', { cx: '11', cy: '11', r: '8' }],
  ['line', { x1: '21', x2: '16.65', y1: '21', y2: '16.65' }],
  ['line', { x1: '8', x2: '14', y1: '11', y2: '11' }],
]);
