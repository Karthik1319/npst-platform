import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, Database, Download, Globe, KeyRound, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { settingsService } from '@/services/adminService';
import { resetAllData, STORAGE_KEYS } from '@/services/storage';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/utils/format';
import type { NpstSettings } from '@/types';

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/notifications', description: 'Templates, rules and delivery records' },
  { method: 'POST', path: '/api/branding', description: 'Theme tokens and brand asset distribution' },
  { method: 'POST', path: '/api/reminders', description: 'Reminder scheduling and escalation webhooks' },
];

export default function Settings() {
  const [settings, setSettings] = useState<NpstSettings>(() => settingsService.get());
  const [copied, setCopied] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const saveGeneral = () => {
    setSettings(settingsService.save({ portalName: settings.portalName, timezone: settings.timezone, dateFormat: settings.dateFormat }));
    toast.success('General settings saved');
  };

  const saveSecurity = () => {
    setSettings(
      settingsService.save({
        sessionTimeout: settings.sessionTimeout,
        enforce2FA: settings.enforce2FA,
        passwordExpiry: settings.passwordExpiry,
      }),
    );
    toast.success('Security settings saved');
  };

  const regenerateKey = () => {
    setSettings({ ...settings, apiKey: settingsService.regenerateApiKey() });
    toast.success('API key regenerated');
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(settings.apiKey);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the key manually');
    }
  };

  const exportData = () => {
    const data: Record<string, unknown> = { exportedAt: new Date().toISOString() };
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          data[name] = JSON.parse(raw);
        } catch {
          data[name] = raw;
        }
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'npst-portal-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Portal data exported as JSON');
  };

  const resetData = () => {
    resetAllData();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Settings"
        description="General configuration, security posture and the Shared Services API gateway."
        testId="settings-title"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <Globe className="size-4 text-blue-600" /> General
            </CardTitle>
            <CardDescription>Portal identity and locale defaults for every integrated application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-portal-name">Portal name</Label>
              <Input
                id="settings-portal-name"
                value={settings.portalName}
                onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
                data-testid="settings-portal-name-input"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(timezone) => setSettings({ ...settings, timezone })}>
                  <SelectTrigger data-testid="settings-timezone-select">
                    <SelectValue>{settings.timezone}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (ET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date format</Label>
                <Select value={settings.dateFormat} onValueChange={(dateFormat) => setSettings({ ...settings, dateFormat })}>
                  <SelectTrigger data-testid="settings-date-format-select">
                    <SelectValue>{settings.dateFormat}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveGeneral} data-testid="settings-general-save-button">
              <Save className="size-4" /> Save general
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <ShieldCheck className="size-4 text-blue-600" /> Security
            </CardTitle>
            <CardDescription>Session and password policy for all portal administrators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="settings-timeout">Session timeout (minutes)</Label>
                <Input
                  id="settings-timeout"
                  type="number"
                  min={5}
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: Math.max(5, Number(e.target.value)) })}
                  data-testid="settings-session-timeout-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="settings-password-expiry">Password expiry (days)</Label>
                <Input
                  id="settings-password-expiry"
                  type="number"
                  min={30}
                  value={settings.passwordExpiry}
                  onChange={(e) => setSettings({ ...settings, passwordExpiry: Math.max(30, Number(e.target.value)) })}
                  data-testid="settings-password-expiry-input"
                />
              </div>
            </div>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={settings.enforce2FA}
                onCheckedChange={(checked) => setSettings({ ...settings, enforce2FA: checked === true })}
                data-testid="settings-2fa-checkbox"
              />
              Require two-factor authentication for Super Admins
            </label>
            <Button onClick={saveSecurity} data-testid="settings-security-save-button">
              <Save className="size-4" /> Save security
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <KeyRound className="size-4 text-blue-600" /> Shared Services API Gateway
            </CardTitle>
            <CardDescription>Endpoints consumed by integrated applications to pull branding, notifications and reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {API_ENDPOINTS.map((endpoint) => (
                <div key={endpoint.path} className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
                  <span className="rounded-md bg-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">{endpoint.method}</span>
                  <span className="font-mono text-sm">{endpoint.path}</span>
                  <span className="ml-auto hidden text-xs text-muted-foreground sm:block">{endpoint.description}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>API key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm" data-testid="settings-api-key">
                  {settings.apiKey}
                </code>
                <Button variant="outline" size="icon" onClick={copyKey} aria-label="Copy API key" data-testid="settings-api-key-copy-button">
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </Button>
                <Button variant="outline" onClick={regenerateKey} data-testid="settings-api-key-regenerate-button">
                  <RotateCcw className="size-4" /> Regenerate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Last saved {formatDateTime(new Date())} · keys rotate without downtime</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <Database className="size-4 text-blue-600" /> Data Management
            </CardTitle>
            <CardDescription>This prototype persists mock data in your browser only — export or reset it here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              All applications, branding configurations, templates, rules, reminders, users and audit entries live in LocalStorage.
              Export produces a JSON snapshot; reset restores the original demo dataset.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportData} data-testid="settings-export-button">
                <Download className="size-4" /> Export data (JSON)
              </Button>
              <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setResetOpen(true)} data-testid="settings-reset-button">
                <RotateCcw className="size-4" /> Reset demo data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all demo data?"
        description="Every mock record returns to its seeded state and you will be signed out. This cannot be undone."
        confirmLabel="Reset everything"
        destructive
        onConfirm={resetData}
      />
    </div>
  );
}
