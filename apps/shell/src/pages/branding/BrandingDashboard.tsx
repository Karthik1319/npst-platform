import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { History, Palette } from '@/components/icons';
import { applicationService } from '@/services/adminService';
import { brandingService } from '@/services/brandingService';
import { AppAvatar } from '@/components/common/AppAvatar';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/format';
import { BUILT_IN_PRESETS, extractStyle } from '@/utils/branding';
import type { BrandingConfig, BrandingPreset } from '@/types';
import { Swatch } from '@/components/branding/Swatch';
import styles from './BrandingDashboard.module.css';

function themeName(
  config: BrandingConfig | undefined,
  customPresets: BrandingPreset[],
): string {
  if (!config) return 'Not configured';
  const current = JSON.stringify(extractStyle(config));
  const all = [...BUILT_IN_PRESETS, ...customPresets];
  const match = all.find((preset) => JSON.stringify(preset.style) === current);
  return match ? match.name : 'Custom theme';
}

export default function BrandingDashboard() {
  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });
  const { data: configs = [] } = useQuery({
    queryKey: ['branding-configs'],
    queryFn: () => brandingService.listConfigs(),
  });
  const { data: customPresets = [] } = useQuery({
    queryKey: ['branding-presets'],
    queryFn: () => brandingService.listCustomPresets(),
  });

  const configByApp = new Map(configs.map((c) => [c.appId, c]));

  return (
    <div className={styles.div}>
      <PageHeader
        title="UI Branding Management"
        description="Centrally customize the look and feel of every integrated application — themes, typography, assets and components."
        testId="branding-title"
      />

      <div className={styles.div2}>
        <Link
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          to="/branding/history"
          data-testid="branding-history-link"
        >
          <History className={`${styles.history} npst-sized`} /> Version History
        </Link>
      </div>

      <div className={styles.div3} data-testid="branding-app-grid">
        {apps.map((app) => {
          const config = configByApp.get(app.id);
          const status = config?.status ?? 'not-configured';
          const primary = config?.primary ?? '#CBD5E1';
          const secondary = config?.secondary ?? '#E2E8F0';
          const accent = config?.accent ?? '#F1F5F9';
          return (
            <Card key={app.id} className={styles.card}>
              <CardContent className={styles.cardContent}>
                <div className={styles.div4}>
                  <div className={styles.div5}>
                    <AppAvatar
                      name={app.name}
                      color={app.color}
                      src={config?.assets?.logo}
                      className={`${styles.appAvatar} npst-sized`}
                    />
                    <div>
                      <p className={styles.p}>{app.name}</p>
                      <p className={styles.p2}>{app.code}</p>
                    </div>
                  </div>
                  <StatusBadge value={status} />
                </div>

                <div className={styles.div6}>
                  <div>
                    <p className={styles.p3}>Current theme</p>
                    <p className={styles.p4}>
                      {themeName(config, customPresets)}
                    </p>
                  </div>
                  <div>
                    <p className={styles.p3}>Font family</p>
                    <p className={styles.p4}>{config?.fontFamily ?? '—'}</p>
                  </div>
                  <div>
                    <p className={styles.p3}>Colors</p>
                    <div className={styles.div7}>
                      {[primary, secondary, accent].map((color, i) => (
                        <Swatch
                          key={`${app.id}-${i}`}
                          color={color}
                          title={
                            i === 0
                              ? `Primary ${primary}`
                              : i === 1
                                ? `Secondary ${secondary}`
                                : `Accent ${accent}`
                          }
                          className={`${styles.span} npst-sized`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={styles.p3}>Last published</p>
                    <p className={styles.p4}>
                      {config?.lastPublished
                        ? formatDate(config.lastPublished)
                        : '—'}
                    </p>
                  </div>
                </div>

                <div className={styles.div8}>
                  <span className={styles.span2}>
                    {config && config.version > 0
                      ? `Version ${config.version}`
                      : 'No version published'}
                  </span>
                  <Link
                    className={buttonVariants({ size: 'sm' })}
                    to={`/branding/configure/${app.id}`}
                    data-testid={`branding-configure-${app.id}`}
                  >
                    <Palette className={`${styles.history} npst-sized`} />{' '}
                    Configure Branding
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
