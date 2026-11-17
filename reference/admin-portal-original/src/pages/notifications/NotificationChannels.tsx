import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, Mail, MessageSquare, Send, Settings2, Smartphone } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ChannelConfig, ChannelKey } from '@/types';

const CHANNEL_ICONS: Record<ChannelKey, typeof Bell> = {
  inapp: Bell,
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
};

export default function NotificationChannels() {
  const queryClient = useQueryClient();
  const { data: channels = [] } = useQuery({ queryKey: ['notification-channels'], queryFn: () => notificationService.listChannels() });
  const [configuring, setConfiguring] = useState<ChannelConfig | null>(null);
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const toggleMutation = useMutation({
    mutationFn: ({ channel, enabled }: { channel: ChannelConfig; enabled: boolean }) =>
      Promise.resolve(notificationService.updateChannel(channel.id, { enabled })),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`${updated?.name} ${updated?.enabled ? 'enabled' : 'disabled'}`);
    },
  });

  const configureMutation = useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Record<string, string> }) =>
      Promise.resolve(notificationService.updateChannel(id, { fields, configured: true })),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`${updated?.name} configuration saved`);
      setConfiguring(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: (key: ChannelKey) => Promise.resolve(notificationService.testChannel(key)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      toast.success('Test notification delivered — check the history log');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Channels"
        description="In-app, email, SMS and push delivery configuration. No credentials are stored in the frontend — only non-sensitive routing details."
        testId="channels-title"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="channels-grid">
        {channels.map((channel) => {
          const Icon = CHANNEL_ICONS[channel.key];
          return (
            <Card key={channel.id} className="shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-foreground">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.description}</p>
                    </div>
                  </div>
                  <StatusBadge value={channel.configured ? 'configured' : 'not-configured'} label={channel.configured ? 'Configured' : 'Action required'} />
                </div>

                <div className="grid gap-1.5 rounded-xl border border-border bg-muted/40 p-3.5 text-sm">
                  {Object.entries(channel.fields).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{key}</span>
                      <span className="truncate font-mono text-xs">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={channel.enabled}
                      onCheckedChange={(checked) => toggleMutation.mutate({ channel, enabled: checked === true })}
                      data-testid={`channel-enabled-${channel.key}`}
                    />
                    Enabled
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfiguring(channel);
                        setDraftFields({ ...channel.fields });
                      }}
                      data-testid={`channel-configure-${channel.key}`}
                    >
                      <Settings2 className="size-4" /> Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testMutation.mutate(channel.key)}
                      disabled={testMutation.isPending}
                      data-testid={`channel-test-${channel.key}`}
                    >
                      <Send className="size-4" /> Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={configuring !== null} onOpenChange={(open) => !open && setConfiguring(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {configuring?.name}</DialogTitle>
            <DialogDescription>
              Non-sensitive routing details only. Secrets and credentials belong in the backend environment, never in the browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {configuring &&
              Object.entries(draftFields).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`channel-field-${key}`}>{key}</Label>
                  <Input
                    id={`channel-field-${key}`}
                    value={value}
                    onChange={(e) => setDraftFields((f) => ({ ...f, [key]: e.target.value }))}
                    data-testid={`channel-field-${key.replace(/\s+/g, '-').toLowerCase()}-input`}
                  />
                </div>
              ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfiguring(null)} data-testid="channel-config-cancel-button">
              Cancel
            </Button>
            <Button
              onClick={() => configuring && configureMutation.mutate({ id: configuring.id, fields: draftFields })}
              data-testid="channel-config-save-button"
            >
              Save configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
