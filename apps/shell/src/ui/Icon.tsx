/**
 * Inline SVG icons (no icon library). 24×24, drawn with the current text
 * colour, so they follow the theme.
 */
const CIRCLE = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z';

const PATHS = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M10 21v-6h4v6'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  bell: [
    'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9',
    'M10.3 21a1.94 1.94 0 0 0 3.4 0',
  ],
  tasks: [
    'M3 6l1.5 1.5L7 5',
    'M3 12l1.5 1.5L7 11',
    'M3 18l1.5 1.5L7 17',
    'M11 6h10',
    'M11 12h10',
    'M11 18h10',
  ],
  admin: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
  chevronDown: ['M6 9l6 6 6-6'],
  chevronRight: ['M9 6l6 6-6 6'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M21 21l-4.3-4.3'],
  sales: ['M3 17l6-6 4 4 8-8', 'M14 7h7v7'],
  projects: ['M12 2 2 7l10 5 10-5-10-5z', 'M2 12l10 5 10-5', 'M2 17l10 5 10-5'],
  people: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  target: [
    CIRCLE,
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
    'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  ],
  folder: [
    'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  ],
  clock: [CIRCLE, 'M12 7v5l3 3'],
  approvals: [
    'M9 3h6v3H9z',
    'M9 4.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-3',
    'M9 14l2 2 4-4',
  ],
  trendUp: ['M3 17l6-6 4 4 8-8', 'M14 7h7v7'],
  trendDown: ['M3 7l6 6 4-4 8 8', 'M14 17h7v-7'],
  alert: [CIRCLE, 'M12 8v5', 'M12 16h.01'],
  checkCircle: [CIRCLE, 'M8 12l3 3 5-6'],
  calendar: [
    'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
    'M4 10h16',
    'M8 2v4',
    'M16 2v4',
  ],
  info: [CIRCLE, 'M12 11v5', 'M12 8h.01'],
  logout: [
    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
    'M16 17l5-5-5-5',
    'M21 12H9',
  ],
  refresh: ['M21 12a9 9 0 1 1-3-6.7L21 8', 'M21 3v5h-5'],
  gift: [
    'M3 8h18v4H3z',
    'M5 12v9h14v-9',
    'M12 8v13',
    'M12 8S10 3 7.5 4.5 9 8 12 8z',
    'M12 8s2-5 4.5-3.5S15 8 12 8z',
  ],
  check: ['M5 12l5 5 9-11'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  minus: ['M5 12h14'],
  user: [
    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  ],
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
