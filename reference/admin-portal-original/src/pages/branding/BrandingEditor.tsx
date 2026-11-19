import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  History,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { applicationService } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';
import { brandingService } from '@/services/brandingService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AppAvatar } from '@/components/common/AppAvatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ColorPicker } from '@/components/branding/ColorPicker';
import { AssetUploader } from '@/components/branding/AssetUploader';
import { BrandingPreview } from '@/components/branding/BrandingPreview';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { COMPONENT_STYLE_LABELS, FONT_OPTIONS } from '@/utils/branding';
import type { BrandingAssets, BrandingStyle } from '@/types';
import type { BrandingConfig } from '@/types';

const COLOR_FIELDS: { key: keyof BrandingStyle; label: string }[] = [
  { key: 'primary', label: 'Primary color' },
  { key: 'secondary', label: 'Secondary color' },
  { key: 'accent', label: 'Accent color' },
  { key: 'bg', label: 'Background color' },
  { key: 'sidebarBg', label: 'Sidebar background' },
  { key: 'headerBg', label: 'Header background' },
  { key: 'cardBg', label: 'Card background' },
  { key: 'text', label: 'Text color' },
  { key: 'borderColor', label: 'Border color' },
  { key: 'button', label: 'Button color' },
  { key: 'buttonHover', label: 'Button hover color' },
];

function styleOf(config: BrandingConfig): BrandingStyle {
  return {
    primary: config.primary,
    secondary: config.secondary,
    accent: config.accent,
    bg: config.bg,
    sidebarBg: config.sidebarBg,
    headerBg: config.headerBg,
    cardBg: config.cardBg,
    text: config.text,
    borderColor: config.borderColor,
    button: config.button,
    buttonHover: config.buttonHover,
    fontFamily: config.fontFamily,
    headingSize: config.headingSize,
    bodySize: config.bodySize,
    fontWeight: config.fontWeight,
    lineHeight: config.lineHeight,
    radius: config.radius,
    componentStyle: config.componentStyle,
    shadow: config.shadow,
    tableStriped: config.tableStriped,
  };
}

const STEPS = ['Draft', 'Preview', 'Validate', 'Approve'] as const;

export default function BrandingEditor() {
  const { appId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: apps = [] } = useQuery({ queryKey: ['apps'], queryFn: () => applicationService.list() });
  const { data: config } = useQuery({
    queryKey: ['branding-config', appId],
    queryFn: () => brandingService.getOrCreateDraft(appId),
  });
  const { data: customPresets = [] } = useQuery({
    queryKey: ['branding-presets'],
    queryFn: () => brandingService.listCustomPresets(),
  });

  const app = apps.find((a) => a.id === appId);

  const [style, setStyle] = useState<BrandingStyle | null>(null);
  const [assets, setAssets] = useState<BrandingAssets>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitScopeOpen, setSubmitScopeOpen] = useState(false);
  const [submitScope, setSubmitScope] = useState<'SINGLE_APPLICATION' | 'ALL_APPLICATIONS'>('SINGLE_APPLICATION');
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    if (config && style === null) {
      setStyle(styleOf(config));
      setAssets(config.assets ?? {});
    }
  }, [config, style]);

  const checks = useMemo(() => (style ? brandingService.validate(appId, style) : []), [appId, style]);
  const dirty = useMemo(
    () => (config && style ? JSON.stringify(styleOf(config)) !== JSON.stringify(style) : false),
    [config, style],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['branding-configs'] });
    queryClient.invalidateQueries({ queryKey: ['branding-config', appId] });
    queryClient.invalidateQueries({ queryKey: ['apps'] });
    queryClient.invalidateQueries({ queryKey: ['branding-versions'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    queryClient.invalidateQueries({ queryKey: ['branding-presets'] });
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  const saveDraft = useMutation({
    mutationFn: () => Promise.resolve(brandingService.saveDraft(appId, style!, assets)),
    onSuccess: () => {
      invalidate();
      toast.success('Draft saved — you can pick this up any time');
    },
  });
  const submitApproval = useMutation({
    mutationFn: () => Promise.resolve(brandingService.submitForApproval(
      appId,
      style!,
      assets,
      submitScope,
      submitScope === 'ALL_APPLICATIONS' ? apps.map((application) => application.id) : [appId],
    )),
    onSuccess: () => {
      invalidate();
      toast.success('Submitted for approval');
      setSubmitScopeOpen(false);
    },
  });
  const reset = useMutation({
    mutationFn: () => Promise.resolve(brandingService.resetToPublished(appId)),
    onSuccess: (restored) => {
      setStyle(styleOf(restored));
      setAssets(restored.assets ?? {});
      invalidate();
      toast.success('Changes reset to the last published theme');
      setResetOpen(false);
    },
  });
  const deleteApplication = useMutation({
    mutationFn: () => {
      if (brandingService.listApprovalRequests().some((request) => request.appId === appId && request.status === 'pending')) {
        throw new Error('This application has a pending branding approval request. Resolve it before deletion.');
      }
      return Promise.resolve(applicationService.deactivate(appId));
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      queryClient.invalidateQueries({ queryKey: ['search-index'] });
      queryClient.invalidateQueries({ queryKey: ['branding-configs'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success(`${deleted.name} was deleted`);
      setDeleteOpen(false);
      navigate('/');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (apps.length > 0 && !app) {
    return (
      <EmptyState
        title="Application not found"
        description="The application you are trying to configure no longer exists."
        action={
          <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/branding" data-testid="branding-editor-back-after-missing">
            <ArrowLeft className="size-4" /> Back to branding
          </Link>
        }
      />
    );
  }

  if (!style || !config || !app) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-8 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="h-96 animate-pulse rounded-xl bg-muted xl:col-span-5" />
          <div className="h-96 animate-pulse rounded-xl bg-muted xl:col-span-7" />
        </div>
      </div>
    );
  }

  const patch = (partial: Partial<BrandingStyle>) => setStyle({ ...style, ...partial });
  const statusStepIndex = config.status === 'published' ? 3 : config.status === 'pending-approval' ? 3 : dirty ? 0 : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link to="/branding" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline" data-testid="branding-editor-back-link">
            <ArrowLeft className="size-4" /> Back to branding
          </Link>
          <div className="flex items-center gap-3">
            <AppAvatar name={app.name} color={app.color} src={assets.logo} className="size-12" />
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground" data-testid="branding-editor-title">
                {app.name} — Branding
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <StatusBadge value={config.status} />
                {config.version > 0 && <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">v{config.version}</span>}
                {dirty && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">Unsaved changes</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" data-testid="branding-validate-button">
                  <ShieldCheck className="size-4" /> Validate
                </Button>
              }
            />
            <PopoverContent align="end" className="w-80">
              <p className="font-heading text-sm font-semibold">Validation checks</p>
              <div className="mt-2 space-y-2">
                {checks.map((check) => (
                  <div key={check.message} className="flex items-start gap-2 text-xs">
                    {check.level === 'pass' ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    )}
                    <span className="text-muted-foreground">{check.message}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => setResetOpen(true)} data-testid="branding-reset-button">
            <RotateCcw className="size-4" /> Reset Changes
          </Button>
          {user?.role === 'Super Admin' && (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} data-testid="branding-delete-application-button">
              <Trash2 className="size-4" /> Delete Application
            </Button>
          )}
          <Button variant="outline" onClick={() => setPreviewOpen(true)} data-testid="branding-preview-button">
            <Eye className="size-4" /> Preview
          </Button>
          <Button variant="outline" onClick={() => saveDraft.mutate()} disabled={saveDraft.isPending} data-testid="branding-save-draft-button">
            <Save className="size-4" /> Save as Draft
          </Button>
          {config.status !== 'pending-approval' && (
            <Button variant="outline" onClick={() => setSubmitScopeOpen(true)} disabled={submitApproval.isPending} data-testid="branding-submit-button">
              <Send className="size-4" /> Submit for Approval
            </Button>
          )}
        </div>
      </div>

      {/* Workflow stepper */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm" data-testid="branding-workflow-stepper">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full text-xs font-bold',
                i <= statusStepIndex ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('text-sm', i <= statusStepIndex ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{step}</span>
            {i < STEPS.length - 1 && <span className="mx-1 hidden h-px w-8 bg-border sm:block" />}
          </div>
        ))}
        <Link to={`/branding/history?appId=${appId}`} className="ml-auto flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline" data-testid="branding-editor-history-link">
          <History className="size-4" /> Version history
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        {/* Config panel */}
        <Card className="shadow-sm xl:col-span-5">
          <CardContent className="p-4">
            <Tabs defaultValue="theme">
              <TabsList className="w-full flex-wrap justify-start">
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
              </TabsList>

              <TabsContent value="assets" className="space-y-4 pt-4">
                <AssetUploader
                  label="Application logo"
                  hint="Shown in the app header and branding cards."
                  value={assets.logo}
                  onChange={(logo) => setAssets((a) => ({ ...a, logo }))}
                  testId="branding-asset-logo"
                />
                <AssetUploader
                  label="Favicon"
                  hint="Square icon rendered in browser tabs."
                  value={assets.favicon}
                  onChange={(favicon) => setAssets((a) => ({ ...a, favicon }))}
                  testId="branding-asset-favicon"
                />
                <AssetUploader
                  label="Login page background"
                  hint="Backdrop for the application's sign-in screen."
                  value={assets.loginBg}
                  onChange={(loginBg) => setAssets((a) => ({ ...a, loginBg }))}
                  testId="branding-asset-loginbg"
                />
                <AssetUploader
                  label="Custom icon"
                  hint="Optional auxiliary icon or wordmark."
                  value={assets.icon}
                  onChange={(icon) => setAssets((a) => ({ ...a, icon }))}
                  testId="branding-asset-icon"
                />
              </TabsContent>

              <TabsContent value="theme" className="pt-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {COLOR_FIELDS.map((field) => (
                    <ColorPicker
                      key={field.key}
                      label={field.label}
                      value={style[field.key] as string}
                      onChange={(value) => patch({ [field.key]: value } as Partial<BrandingStyle>)}
                      testId={`branding-color-${String(field.key)}`}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="typography" className="space-y-5 pt-4">
                <div className="space-y-1.5">
                  <Label>Font family</Label>
                  <Select value={style.fontFamily} onValueChange={(value) => patch({ fontFamily: value })}>
                    <SelectTrigger data-testid="branding-font-family-select">
                      <SelectValue>{style.fontFamily}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Heading font size</Label>
                    <span className="font-mono text-xs text-muted-foreground">{style.headingSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={34}
                    value={style.headingSize}
                    onChange={(e) => patch({ headingSize: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                    data-testid="branding-heading-size-range"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Body font size</Label>
                    <span className="font-mono text-xs text-muted-foreground">{style.bodySize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={18}
                    value={style.bodySize}
                    onChange={(e) => patch({ bodySize: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                    data-testid="branding-body-size-range"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Font weight</Label>
                    <Select value={String(style.fontWeight)} onValueChange={(value) => patch({ fontWeight: Number(value) })}>
                      <SelectTrigger data-testid="branding-font-weight-select">
                        <SelectValue>{style.fontWeight}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {[400, 500, 600, 700, 800].map((weight) => (
                          <SelectItem key={weight} value={String(weight)}>
                            {weight}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Line height</Label>
                      <span className="font-mono text-xs text-muted-foreground">{style.lineHeight}</span>
                    </div>
                    <input
                      type="range"
                      min={1.2}
                      max={1.9}
                      step={0.05}
                      value={style.lineHeight}
                      onChange={(e) => patch({ lineHeight: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                      data-testid="branding-line-height-range"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="components" className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label>Component style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['modern', 'minimal', 'classic', 'rounded'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => patch({ componentStyle: option })}
                        className={cn(
                          'rounded-lg border p-3 text-left transition-all',
                          style.componentStyle === option
                            ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                            : 'border-border hover:bg-muted/60',
                        )}
                        data-testid={`branding-style-${option}`}
                      >
                        <p className="text-sm font-semibold capitalize">{option}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{COMPONENT_STYLE_LABELS[option].split('—')[1]?.trim()}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Border radius</Label>
                    <span className="font-mono text-xs text-muted-foreground">{style.radius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={style.radius}
                    onChange={(e) => patch({ radius: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                    data-testid="branding-radius-range"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Shadow depth</Label>
                    <Select value={style.shadow} onValueChange={(value) => patch({ shadow: value as BrandingStyle['shadow'] })}>
                      <SelectTrigger data-testid="branding-shadow-select">
                        <SelectValue>{style.shadow}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={style.tableStriped}
                        onCheckedChange={(checked) => patch({ tableStriped: checked === true })}
                        data-testid="branding-table-striped-checkbox"
                      />
                      Striped tables
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="presets" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Built-in themes</p>
                  {brandingService.builtInPresets().map((preset) => (
                    <div key={preset.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <div className="flex shrink-0 gap-1">
                        {[preset.style.primary, preset.style.accent, preset.style.sidebarBg].map((color, i) => (
                          <span key={i} className="size-5 rounded-md border border-border" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{preset.name}</p>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setStyle(preset.style);
                          toast.success(`"${preset.name}" applied — save as draft to keep it`);
                        }}
                        data-testid={`branding-preset-apply-${preset.id}`}
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom presets</p>
                  {customPresets.length === 0 && (
                    <p className="text-xs text-muted-foreground">No custom presets saved yet.</p>
                  )}
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <div className="flex shrink-0 gap-1">
                        {[preset.style.primary, preset.style.accent, preset.style.sidebarBg].map((color, i) => (
                          <span key={i} className="size-5 rounded-md border border-border" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{preset.name}</p>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setStyle(preset.style);
                          toast.success(`"${preset.name}" applied`);
                        }}
                        data-testid={`branding-custom-preset-apply-${preset.id}`}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          brandingService.deleteCustomPreset(preset.id);
                          invalidate();
                          toast.success(`"${preset.name}" deleted`);
                        }}
                        aria-label={`Delete ${preset.name}`}
                        data-testid={`branding-custom-preset-delete-${preset.id}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Preset name…"
                      data-testid="branding-preset-name-input"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (presetName.trim().length < 2) {
                          toast.error('Give the preset a name first');
                          return;
                        }
                        brandingService.saveCustomPreset(presetName.trim(), style);
                        setPresetName('');
                        invalidate();
                        toast.success('Custom preset saved');
                      }}
                      data-testid="branding-preset-save-button"
                    >
                      <Plus className="size-4" /> Save current
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="space-y-4 xl:col-span-7 xl:sticky xl:top-20">
          <Card className="shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold">Live preview</p>
                  <p className="text-xs text-muted-foreground">Simulated {app.name} — updates instantly as you edit</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} data-testid="branding-preview-fullscreen-button">
                  <Eye className="size-4" /> Fullscreen
                </Button>
              </div>
              <BrandingPreview style={style} appName={app.name} logo={assets.logo} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="flex items-center gap-2 font-heading text-sm font-semibold">
                <ShieldCheck className="size-4 text-emerald-600" /> Validation
              </p>
              <div className="mt-2 space-y-2">
                {checks.map((check) => (
                  <div key={check.message} className="flex items-start gap-2 text-xs">
                    {check.level === 'pass' ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    )}
                    <span className="text-muted-foreground">{check.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen preview */}
      <Dialog open={submitScopeOpen} onOpenChange={setSubmitScopeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Where would you like to apply this branding change?</DialogTitle>
            <DialogDescription>Choose the application scope for this approval request. No branding changes are applied until a checker approves it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <button type="button" onClick={() => setSubmitScope('SINGLE_APPLICATION')} className={cn('rounded-xl border p-4 text-left transition-colors', submitScope === 'SINGLE_APPLICATION' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')} data-testid="branding-scope-single">
              <p className="font-semibold text-foreground">Apply to This Application</p>
              <p className="mt-1 text-sm text-muted-foreground">Only {app.name} will receive the proposed branding.</p>
            </button>
            <button type="button" onClick={() => setSubmitScope('ALL_APPLICATIONS')} className={cn('rounded-xl border p-4 text-left transition-colors', submitScope === 'ALL_APPLICATIONS' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')} data-testid="branding-scope-all">
              <p className="font-semibold text-foreground">Apply to All Applications</p>
              <p className="mt-1 text-sm text-muted-foreground">All {apps.length} registered applications will receive this branding after approval.</p>
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSubmitScopeOpen(false)}>Cancel</Button>
            <Button onClick={() => submitApproval.mutate()} disabled={submitApproval.isPending}>Continue</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{app.name} — full branding preview</DialogTitle>
            <DialogDescription>Exactly how the application will render once published.</DialogDescription>
          </DialogHeader>
          <BrandingPreview style={style} appName={app.name} logo={assets.logo} />
        </DialogContent>
      </Dialog>

      {/* Reset confirm */}
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all changes?"
        description="The draft will be reverted to the last published theme. Unsaved changes are lost."
        confirmLabel="Reset changes"
        destructive
        onConfirm={() => reset.mutate()}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Application?"
        description={`Are you sure you want to delete ${app.name}? This action will remove the application from the Shared Services platform and may affect its associated configurations.\n\nApplication code: ${app.code}\n\nHistorical configurations and audit records will be preserved.`}
        confirmLabel="Delete Application"
        destructive
        onConfirm={() => deleteApplication.mutate()}
      />

    </div>
  );
}
