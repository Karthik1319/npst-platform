import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
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
} from '@/components/icons';
import { applicationService } from '@/services/adminService';
import { useAuth } from '@/context/AuthContext';
import { brandingService } from '@/services/brandingService';
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
import { Swatch } from '@/components/branding/Swatch';
import styles from './BrandingEditor.module.css';

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

  const { data: apps = [] } = useQuery({
    queryKey: ['apps'],
    queryFn: () => applicationService.list(),
  });
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
  const [submitScope, setSubmitScope] = useState<
    'SINGLE_APPLICATION' | 'ALL_APPLICATIONS'
  >('SINGLE_APPLICATION');
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Start the draft from the loaded configuration (set during render, once).
  if (config && style === null) {
    setStyle(styleOf(config));
    setAssets(config.assets ?? {});
  }

  const checks = useMemo(
    () => (style ? brandingService.validate(appId, style) : []),
    [appId, style],
  );
  const dirty = useMemo(
    () =>
      config && style
        ? JSON.stringify(styleOf(config)) !== JSON.stringify(style)
        : false,
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
    mutationFn: () =>
      Promise.resolve(brandingService.saveDraft(appId, style!, assets)),
    onSuccess: () => {
      invalidate();
      toast.success('Draft saved — you can pick this up any time');
    },
  });
  const submitApproval = useMutation({
    mutationFn: () =>
      Promise.resolve(
        brandingService.submitForApproval(
          appId,
          style!,
          assets,
          submitScope,
          submitScope === 'ALL_APPLICATIONS'
            ? apps.map((application) => application.id)
            : [appId],
        ),
      ),
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
      if (
        brandingService
          .listApprovalRequests()
          .some(
            (request) =>
              request.appId === appId && request.status === 'pending',
          )
      ) {
        throw new Error(
          'This application has a pending branding approval request. Resolve it before deletion.',
        );
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
          <Link
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            to="/branding"
            data-testid="branding-editor-back-after-missing"
          >
            <ArrowLeft className={`${styles.arrowLeft} npst-sized`} /> Back to
            branding
          </Link>
        }
      />
    );
  }

  if (!style || !config || !app) {
    return (
      <div className={styles.div} aria-busy="true">
        <div className={styles.div2} />
        <div className={styles.div3}>
          <div className={styles.div4} />
          <div className={styles.div5} />
        </div>
      </div>
    );
  }

  const patch = (partial: Partial<BrandingStyle>) =>
    setStyle({ ...style, ...partial });
  const statusStepIndex =
    config.status === 'published'
      ? 3
      : config.status === 'pending-approval'
        ? 3
        : dirty
          ? 0
          : 1;

  return (
    <div className={styles.div6}>
      <div className={styles.div7}>
        <div className={styles.div8}>
          <Link
            to="/branding"
            className={styles.link}
            data-testid="branding-editor-back-link"
          >
            <ArrowLeft className={`${styles.arrowLeft} npst-sized`} /> Back to
            branding
          </Link>
          <div className={styles.div9}>
            <AppAvatar
              name={app.name}
              color={app.color}
              src={assets.logo}
              className={`${styles.appAvatar} npst-sized`}
            />
            <div>
              <h1 className={styles.h1} data-testid="branding-editor-title">
                {app.name} — Branding
              </h1>
              <div className={styles.div10}>
                <StatusBadge value={config.status} />
                {config.version > 0 && (
                  <span className={styles.span}>v{config.version}</span>
                )}
                {dirty && <span className={styles.span2}>Unsaved changes</span>}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.div11}>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  data-testid="branding-validate-button"
                >
                  <ShieldCheck className={`${styles.arrowLeft} npst-sized`} />{' '}
                  Validate
                </Button>
              }
            />
            <PopoverContent align="end" className={styles.popoverContent}>
              <p className={styles.p}>Validation checks</p>
              <div className={styles.div12}>
                {checks.map((check) => (
                  <div key={check.message} className={styles.div13}>
                    {check.level === 'pass' ? (
                      <CheckCircle2
                        className={`${styles.checkCircle2} npst-sized`}
                      />
                    ) : (
                      <AlertTriangle
                        className={`${styles.alertTriangle} npst-sized`}
                      />
                    )}
                    <span className={styles.span3}>{check.message}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={() => setResetOpen(true)}
            data-testid="branding-reset-button"
          >
            <RotateCcw className={`${styles.arrowLeft} npst-sized`} /> Reset
            Changes
          </Button>
          {user?.role === 'Super Admin' && (
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              data-testid="branding-delete-application-button"
            >
              <Trash2 className={`${styles.arrowLeft} npst-sized`} /> Delete
              Application
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            data-testid="branding-preview-button"
          >
            <Eye className={`${styles.arrowLeft} npst-sized`} /> Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => saveDraft.mutate()}
            disabled={saveDraft.isPending}
            data-testid="branding-save-draft-button"
          >
            <Save className={`${styles.arrowLeft} npst-sized`} /> Save as Draft
          </Button>
          {config.status !== 'pending-approval' && (
            <Button
              variant="outline"
              onClick={() => setSubmitScopeOpen(true)}
              disabled={submitApproval.isPending}
              data-testid="branding-submit-button"
            >
              <Send className={`${styles.arrowLeft} npst-sized`} /> Submit for
              Approval
            </Button>
          )}
        </div>
      </div>

      {/* Workflow stepper */}
      <div className={styles.div14} data-testid="branding-workflow-stepper">
        {STEPS.map((step, i) => (
          <div key={step} className={styles.div15}>
            <span
              className={cn(
                `${styles.span4} npst-sized`,
                i <= statusStepIndex ? styles.span5 : styles.span6,
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                styles.span7,
                i <= statusStepIndex ? styles.span8 : styles.span3,
              )}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && <span className={styles.span9} />}
          </div>
        ))}
        <Link
          to={`/branding/history?appId=${appId}`}
          className={styles.link2}
          data-testid="branding-editor-history-link"
        >
          <History className={`${styles.arrowLeft} npst-sized`} /> Version
          history
        </Link>
      </div>

      <div className={styles.div16}>
        {/* Config panel */}
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <Tabs defaultValue="theme">
              <TabsList className={styles.tabsList}>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
              </TabsList>

              <TabsContent value="assets" className={styles.tabsContent}>
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

              <TabsContent value="theme" className={styles.tabsContent2}>
                <div className={styles.div17}>
                  {COLOR_FIELDS.map((field) => (
                    <ColorPicker
                      key={field.key}
                      label={field.label}
                      value={style[field.key] as string}
                      onChange={(value) =>
                        patch({ [field.key]: value } as Partial<BrandingStyle>)
                      }
                      testId={`branding-color-${String(field.key)}`}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="typography" className={styles.tabsContent3}>
                <div className={styles.div18}>
                  <Label>Font family</Label>
                  <Select
                    value={style.fontFamily}
                    onValueChange={(value) => patch({ fontFamily: value })}
                  >
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
                <div className={styles.div19}>
                  <div className={styles.div20}>
                    <Label>Heading font size</Label>
                    <span className={styles.span10}>{style.headingSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={34}
                    value={style.headingSize}
                    onChange={(e) =>
                      patch({ headingSize: Number(e.target.value) })
                    }
                    className={styles.input}
                    data-testid="branding-heading-size-range"
                  />
                </div>
                <div className={styles.div19}>
                  <div className={styles.div20}>
                    <Label>Body font size</Label>
                    <span className={styles.span10}>{style.bodySize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={18}
                    value={style.bodySize}
                    onChange={(e) =>
                      patch({ bodySize: Number(e.target.value) })
                    }
                    className={styles.input}
                    data-testid="branding-body-size-range"
                  />
                </div>
                <div className={styles.div21}>
                  <div className={styles.div18}>
                    <Label>Font weight</Label>
                    <Select
                      value={String(style.fontWeight)}
                      onValueChange={(value) =>
                        patch({ fontWeight: Number(value) })
                      }
                    >
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
                  <div className={styles.div19}>
                    <div className={styles.div20}>
                      <Label>Line height</Label>
                      <span className={styles.span10}>{style.lineHeight}</span>
                    </div>
                    <input
                      type="range"
                      min={1.2}
                      max={1.9}
                      step={0.05}
                      value={style.lineHeight}
                      onChange={(e) =>
                        patch({ lineHeight: Number(e.target.value) })
                      }
                      className={styles.input}
                      data-testid="branding-line-height-range"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="components" className={styles.tabsContent3}>
                <div className={styles.div19}>
                  <Label>Component style</Label>
                  <div className={styles.div22}>
                    {(['modern', 'minimal', 'classic', 'rounded'] as const).map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => patch({ componentStyle: option })}
                          className={cn(
                            styles.button,
                            style.componentStyle === option
                              ? styles.button2
                              : styles.button3,
                          )}
                          data-testid={`branding-style-${option}`}
                        >
                          <p className={styles.p2}>{option}</p>
                          <p className={styles.p3}>
                            {COMPONENT_STYLE_LABELS[option]
                              .split('—')[1]
                              ?.trim()}
                          </p>
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div className={styles.div19}>
                  <div className={styles.div20}>
                    <Label>Border radius</Label>
                    <span className={styles.span10}>{style.radius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={style.radius}
                    onChange={(e) => patch({ radius: Number(e.target.value) })}
                    className={styles.input}
                    data-testid="branding-radius-range"
                  />
                </div>
                <div className={styles.div21}>
                  <div className={styles.div18}>
                    <Label>Shadow depth</Label>
                    <Select
                      value={style.shadow}
                      onValueChange={(value) =>
                        patch({ shadow: value as BrandingStyle['shadow'] })
                      }
                    >
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
                  <div className={styles.div23}>
                    <label className={styles.label}>
                      <Checkbox
                        checked={style.tableStriped}
                        onCheckedChange={(checked) =>
                          patch({ tableStriped: checked === true })
                        }
                        data-testid="branding-table-striped-checkbox"
                      />
                      Striped tables
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="presets" className={styles.tabsContent}>
                <div className={styles.div19}>
                  <p className={styles.p4}>Built-in themes</p>
                  {brandingService.builtInPresets().map((preset) => (
                    <div key={preset.id} className={styles.div24}>
                      <div className={styles.div25}>
                        {[
                          preset.style.primary,
                          preset.style.accent,
                          preset.style.sidebarBg,
                        ].map((color, i) => (
                          <Swatch
                            key={i}
                            color={color}
                            className={`${styles.span11} npst-sized`}
                          />
                        ))}
                      </div>
                      <p className={styles.p5}>{preset.name}</p>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setStyle(preset.style);
                          toast.success(
                            `"${preset.name}" applied — save as draft to keep it`,
                          );
                        }}
                        data-testid={`branding-preset-apply-${preset.id}`}
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
                <div className={styles.div19}>
                  <p className={styles.p4}>Custom presets</p>
                  {customPresets.length === 0 && (
                    <p className={styles.p6}>No custom presets saved yet.</p>
                  )}
                  {customPresets.map((preset) => (
                    <div key={preset.id} className={styles.div24}>
                      <div className={styles.div25}>
                        {[
                          preset.style.primary,
                          preset.style.accent,
                          preset.style.sidebarBg,
                        ].map((color, i) => (
                          <Swatch
                            key={i}
                            color={color}
                            className={`${styles.span11} npst-sized`}
                          />
                        ))}
                      </div>
                      <p className={styles.p5}>{preset.name}</p>
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
                        className={styles.button4}
                        onClick={() => {
                          brandingService.deleteCustomPreset(preset.id);
                          invalidate();
                          toast.success(`"${preset.name}" deleted`);
                        }}
                        aria-label={`Delete ${preset.name}`}
                        data-testid={`branding-custom-preset-delete-${preset.id}`}
                      >
                        <Trash2 className={`${styles.trash2} npst-sized`} />
                      </Button>
                    </div>
                  ))}
                  <div className={styles.div26}>
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
                        brandingService.saveCustomPreset(
                          presetName.trim(),
                          style,
                        );
                        setPresetName('');
                        invalidate();
                        toast.success('Custom preset saved');
                      }}
                      data-testid="branding-preset-save-button"
                    >
                      <Plus className={`${styles.arrowLeft} npst-sized`} /> Save
                      current
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className={styles.div27}>
          <Card className={styles.card2}>
            <CardContent className={styles.cardContent2}>
              <div className={styles.div20}>
                <div>
                  <p className={styles.p}>Live preview</p>
                  <p className={styles.p6}>
                    Simulated {app.name} — updates instantly as you edit
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  data-testid="branding-preview-fullscreen-button"
                >
                  <Eye className={`${styles.arrowLeft} npst-sized`} />{' '}
                  Fullscreen
                </Button>
              </div>
              <BrandingPreview
                draft={style}
                appName={app.name}
                logo={assets.logo}
              />
            </CardContent>
          </Card>

          <Card className={styles.card2}>
            <CardContent className={styles.cardContent}>
              <p className={styles.p7}>
                <ShieldCheck className={`${styles.shieldCheck} npst-sized`} />{' '}
                Validation
              </p>
              <div className={styles.div12}>
                {checks.map((check) => (
                  <div key={check.message} className={styles.div13}>
                    {check.level === 'pass' ? (
                      <CheckCircle2
                        className={`${styles.checkCircle2} npst-sized`}
                      />
                    ) : (
                      <AlertTriangle
                        className={`${styles.alertTriangle} npst-sized`}
                      />
                    )}
                    <span className={styles.span3}>{check.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen preview */}
      <Dialog open={submitScopeOpen} onOpenChange={setSubmitScopeOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>
              Where would you like to apply this branding change?
            </DialogTitle>
            <DialogDescription>
              Choose the application scope for this approval request. No
              branding changes are applied until a checker approves it.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.div28}>
            <button
              type="button"
              onClick={() => setSubmitScope('SINGLE_APPLICATION')}
              className={cn(
                styles.button5,
                submitScope === 'SINGLE_APPLICATION'
                  ? styles.button6
                  : styles.button7,
              )}
              data-testid="branding-scope-single"
            >
              <p className={styles.span8}>Apply to This Application</p>
              <p className={styles.p8}>
                Only {app.name} will receive the proposed branding.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSubmitScope('ALL_APPLICATIONS')}
              className={cn(
                styles.button5,
                submitScope === 'ALL_APPLICATIONS'
                  ? styles.button6
                  : styles.button7,
              )}
              data-testid="branding-scope-all"
            >
              <p className={styles.span8}>Apply to All Applications</p>
              <p className={styles.p8}>
                All {apps.length} registered applications will receive this
                branding after approval.
              </p>
            </button>
          </div>
          <div className={styles.div29}>
            <Button variant="outline" onClick={() => setSubmitScopeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitApproval.mutate()}
              disabled={submitApproval.isPending}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className={styles.dialogContent2}>
          <DialogHeader>
            <DialogTitle>{app.name} — full branding preview</DialogTitle>
            <DialogDescription>
              Exactly how the application will render once published.
            </DialogDescription>
          </DialogHeader>
          <BrandingPreview
            draft={style}
            appName={app.name}
            logo={assets.logo}
          />
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
