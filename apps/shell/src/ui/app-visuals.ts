import type { IconName } from '@/ui/Icon';

/** Theme tone (1–5) used for an app's icon and tags. */
export type Tone = 1 | 2 | 3 | 4 | 5;

const VISUALS: Record<string, { icon: IconName; tone: Tone; short: string }> = {
  'sales-hub': { icon: 'sales', tone: 1, short: 'Sales Hub' },
  projects: { icon: 'projects', tone: 2, short: 'Projects' },
  'people-hr': { icon: 'people', tone: 3, short: 'People & HR' },
  'admin-console': { icon: 'admin', tone: 4, short: 'Admin' },
};

/** Icon, colour tone and short label for an app id (a neutral default for others). */
export function appVisual(appId: string | undefined): {
  icon: IconName;
  tone: Tone;
  short: string;
} {
  return (
    (appId && VISUALS[appId]) || { icon: 'grid', tone: 5, short: 'Portal' }
  );
}
