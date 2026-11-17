import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  Settings2,
  Smartphone,
} from '@/components/icons';
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
import styles from './NotificationChannels.module.css';

const CHANNEL_ICONS: Record<ChannelKey, typeof Bell> = {
  inapp: Bell,
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
};

export default function NotificationChannels() {
  const queryClient = useQueryClient();
  const { data: channels = [] } = useQuery({
    queryKey: ['notification-channels'],
    queryFn: () => notificationService.listChannels(),
  });
  const [configuring, setConfiguring] = useState<ChannelConfig | null>(null);
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  const toggleMutation = useMutation({
    mutationFn: ({
      channel,
      enabled,
    }: {
      channel: ChannelConfig;
      enabled: boolean;
    }) =>
      Promise.resolve(
        notificationService.updateChannel(channel.id, { enabled }),
      ),
    onSuccess: (updated) => {
      invalidate();
      toast.success(
        `${updated?.name} ${updated?.enabled ? 'enabled' : 'disabled'}`,
      );
    },
  });

  const configureMutation = useMutation({
    mutationFn: ({
      id,
      fields,
    }: {
      id: string;
      fields: Record<string, string>;
    }) =>
      Promise.resolve(
        notificationService.updateChannel(id, { fields, configured: true }),
      ),
    onSuccess: (updated) => {
      invalidate();
      toast.success(`${updated?.name} configuration saved`);
      setConfiguring(null);
    },
  });

  const testMutation = useMutation({
    mutationFn: (key: ChannelKey) =>
      Promise.resolve(notificationService.testChannel(key)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      toast.success('Test notification delivered — check the history log');
    },
  });

  return (
    <div className={styles.div}>
      <PageHeader
        title="Notification Channels"
        description="In-app, email, SMS and push delivery configuration. No credentials are stored in the frontend — only non-sensitive routing details."
        testId="channels-title"
      />

      <div className={styles.div2} data-testid="channels-grid">
        {channels.map((channel) => {
          const Icon = CHANNEL_ICONS[channel.key];
          return (
            <Card key={channel.id} className={styles.card}>
              <CardContent className={styles.cardContent}>
                <div className={styles.div3}>
                  <div className={styles.div4}>
                    <div className={`${styles.div5} npst-sized`}>
                      <Icon className={`${styles.icon} npst-sized`} />
                    </div>
                    <div>
                      <p className={styles.p}>{channel.name}</p>
                      <p className={styles.p2}>{channel.description}</p>
                    </div>
                  </div>
                  <StatusBadge
                    value={channel.configured ? 'configured' : 'not-configured'}
                    label={
                      channel.configured ? 'Configured' : 'Action required'
                    }
                  />
                </div>

                <div className={styles.div6}>
                  {Object.entries(channel.fields).map(([key, value]) => (
                    <div key={key} className={styles.div7}>
                      <span className={styles.span}>{key}</span>
                      <span className={styles.span2}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.div8}>
                  <label className={styles.label}>
                    <Checkbox
                      checked={channel.enabled}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          channel,
                          enabled: checked === true,
                        })
                      }
                      data-testid={`channel-enabled-${channel.key}`}
                    />
                    Enabled
                  </label>
                  <div className={styles.div9}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfiguring(channel);
                        setDraftFields({ ...channel.fields });
                      }}
                      data-testid={`channel-configure-${channel.key}`}
                    >
                      <Settings2 className={`${styles.settings2} npst-sized`} />{' '}
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testMutation.mutate(channel.key)}
                      disabled={testMutation.isPending}
                      data-testid={`channel-test-${channel.key}`}
                    >
                      <Send className={`${styles.settings2} npst-sized`} /> Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={configuring !== null}
        onOpenChange={(open) => !open && setConfiguring(null)}
      >
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Configure {configuring?.name}</DialogTitle>
            <DialogDescription>
              Non-sensitive routing details only. Secrets and credentials belong
              in the backend environment, never in the browser.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.div10}>
            {configuring &&
              Object.entries(draftFields).map(([key, value]) => (
                <div key={key} className={styles.div11}>
                  <Label htmlFor={`channel-field-${key}`}>{key}</Label>
                  <Input
                    id={`channel-field-${key}`}
                    value={value}
                    onChange={(e) =>
                      setDraftFields((f) => ({ ...f, [key]: e.target.value }))
                    }
                    data-testid={`channel-field-${key.replace(/\s+/g, '-').toLowerCase()}-input`}
                  />
                </div>
              ))}
          </div>
          <DialogFooter className={styles.dialogFooter}>
            <Button
              variant="outline"
              onClick={() => setConfiguring(null)}
              data-testid="channel-config-cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                configuring &&
                configureMutation.mutate({
                  id: configuring.id,
                  fields: draftFields,
                })
              }
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
