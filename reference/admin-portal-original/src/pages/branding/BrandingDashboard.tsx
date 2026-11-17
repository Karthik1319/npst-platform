import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { History, Palette } from 'lucide-react';
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

function themeName(config: BrandingConfig | undefined, customPresets: BrandingPreset[]): string {
  if (!config) return 'Not configured';
  const current = JSON.stringify(extractStyle(config));
  const all = [...BUILT_IN_PRESETS, ...customPresets];
  const match = all.find((preset) => JSON.stringify(preset.style) === current);
  return match ? match.name : 'Custom theme';
}

export default function BrandingDashboard() {
  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const { data: configs = [] } = useQuery({ queryKey: ['branding-configs'], queryFn: () => brandingService.listConfigs() });
  const { data: customPresets = [] } = useQuery({ queryKey: ['branding-presets'], queryFn: () => brandingService.listCustomPresets() });

  const configByApp = new Map(configs.map((c) => [c.appId, c]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="UI Branding Management"
        description="Centrally customize the look and feel of every integrated application — themes, typography, assets and components."
        testId="branding-title"
      />

      <div className="flex items-center justify-end">
        <Link
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          to="/branding/history"
          data-testid="branding-history-link"
        >
          <History className="size-4" /> Version History
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="branding-app-grid">
        {apps.map((app) => {
          const config = configByApp.get(app.id);
          const status = config?.status ?? 'not-configured';
          const primary = config?.primary ?? '#CBD5E1';
          const secondary = config?.secondary ?? '#E2E8F0';
          const accent = config?.accent ?? '#F1F5F9';
          return (
            <Card key={app.id} className="shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AppAvatar name={app.name} color={app.color} src={config?.assets?.logo} className="size-11" />
                    <div>
                      <p className="font-heading font-bold text-foreground">{app.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{app.code}</p>
                    </div>
                  </div>
                  <StatusBadge value={status} />
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/40 p-3.5 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current theme</p>
                    <p className="mt-1 font-medium">{themeName(config, customPresets)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Font family</p>
                    <p className="mt-1 font-medium">{config?.fontFamily ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Colors</p>
                    <div className="mt-1.5 flex gap-1.5">
                      {[primary, secondary, accent].map((color, i) => (
                        <span
                          key={`${app.id}-${i}`}
                          title={i === 0 ? `Primary ${primary}` : i === 1 ? `Secondary ${secondary}` : `Accent ${accent}`}
                          className="size-6 rounded-md border border-border shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last published</p>
                    <p className="mt-1 font-medium">{config?.lastPublished ? formatDate(config.lastPublished) : '—'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {config && config.version > 0 ? `Version ${config.version}` : 'No version published'}
                  </span>
                  <Link
                    className={buttonVariants({ size: 'sm' })}
                    to={`/branding/configure/${app.id}`}
                    data-testid={`branding-configure-${app.id}`}
                  >
                    <Palette className="size-4" /> Configure Branding
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
