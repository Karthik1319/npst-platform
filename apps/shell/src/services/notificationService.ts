import { createCrudService } from './mockApi';
import { auditService } from './auditService';
import { STORAGE_KEYS } from './storage';
import {
  seedChannels,
  seedNotifLogs,
  seedRules,
  seedTemplates,
} from '@/data/seed';
import { applicationService } from './adminService';
import { extractVariables } from '@/utils/format';
import type {
  ChannelConfig,
  ChannelKey,
  DeliveryStatus,
  NotificationLog,
  NotificationRule,
  NotificationTemplate,
  Priority,
} from '@/types';

const templateCrud = createCrudService<NotificationTemplate>(
  STORAGE_KEYS.templates,
  seedTemplates,
);
const ruleCrud = createCrudService<NotificationRule>(
  STORAGE_KEYS.rules,
  seedRules,
);
const logCrud = createCrudService<NotificationLog>(
  STORAGE_KEYS.notifLogs,
  seedNotifLogs,
);
const channelCrud = createCrudService<ChannelConfig>(
  STORAGE_KEYS.channels,
  seedChannels,
);
const displayTemplate = (
  template: NotificationTemplate,
): NotificationTemplate => ({
  ...template,
  name: template.name.replace(/^Keka\b/, 'PeopleOS'),
});
const displayLog = (log: NotificationLog): NotificationLog => ({
  ...log,
  templateName: log.templateName.replace(/^Keka\b/, 'PeopleOS'),
});

export const notificationService = {
  listTemplates: () => templateCrud.list().map(displayTemplate),
  getTemplate: templateCrud.get,
  createTemplate: (
    input: Omit<
      NotificationTemplate,
      'id' | 'variables' | 'createdAt' | 'updatedAt'
    >,
  ): NotificationTemplate => {
    const template = templateCrud.create({
      ...input,
      variables: extractVariables(`${input.subject} ${input.body}`),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    auditService.log(
      'Notifications',
      `Created template "${template.name}"`,
      template.appId,
    );
    return template;
  },
  updateTemplate: (
    id: string,
    patch: Partial<Omit<NotificationTemplate, 'id'>>,
  ): NotificationTemplate | undefined => {
    const merged = {
      ...templateCrud.get(id),
      ...patch,
    } as NotificationTemplate;
    const next = templateCrud.update(id, {
      ...patch,
      variables: extractVariables(`${merged.subject} ${merged.body}`),
      updatedAt: new Date().toISOString(),
    });
    if (next)
      auditService.log(
        'Notifications',
        `Updated template "${next.name}"`,
        next.appId,
      );
    return next;
  },
  removeTemplate: (id: string): void => {
    const template = templateCrud.get(id);
    templateCrud.remove(id);
    if (template)
      auditService.log(
        'Notifications',
        `Deleted template "${template.name}"`,
        template.appId,
      );
  },
  duplicateTemplate: (id: string): NotificationTemplate | undefined => {
    const source = templateCrud.get(id);
    if (!source) return undefined;
    const copy = templateCrud.create({
      ...source,
      name: `${source.name} (Copy)`,
      code: `${source.code}-COPY`,
      status: 'inactive',
      updatedAt: new Date().toISOString(),
    });
    auditService.log(
      'Notifications',
      `Duplicated template "${source.name}"`,
      source.appId,
    );
    return copy;
  },

  listRules: ruleCrud.list,
  createRule: (
    input: Omit<NotificationRule, 'id' | 'createdAt'>,
  ): NotificationRule => {
    const rule = ruleCrud.create({
      ...input,
      createdAt: new Date().toISOString(),
    });
    auditService.log(
      'Notifications',
      `Created rule "${rule.name}"`,
      rule.appId,
    );
    return rule;
  },
  updateRule: (
    id: string,
    patch: Partial<Omit<NotificationRule, 'id'>>,
  ): NotificationRule | undefined => {
    const next = ruleCrud.update(id, patch);
    if (next)
      auditService.log(
        'Notifications',
        `Updated rule "${next.name}"`,
        next.appId,
      );
    return next;
  },
  removeRule: (id: string): void => {
    const rule = ruleCrud.get(id);
    ruleCrud.remove(id);
    if (rule)
      auditService.log(
        'Notifications',
        `Deleted rule "${rule.name}"`,
        rule.appId,
      );
  },

  listChannels: channelCrud.list,
  updateChannel: (
    id: string,
    patch: Partial<Omit<ChannelConfig, 'id'>>,
  ): ChannelConfig | undefined => {
    const next = channelCrud.update(id, patch);
    if (next)
      auditService.log(
        'Notifications',
        `Updated channel configuration "${next.name}"`,
        'Portal',
      );
    return next;
  },
  testChannel: (key: ChannelKey): NotificationLog => {
    const channel = channelCrud.list().find((c) => c.key === key);
    const log = logCrud.create({
      recipient: 'admin@npst.com',
      appId: 'Portal',
      templateName: `Test — ${channel?.name ?? key}`,
      channel: key,
      sentAt: new Date().toISOString(),
      status: 'delivered',
      priority: 'medium',
      message: `Test notification dispatched through the ${channel?.name ?? key} channel.`,
    });
    auditService.log(
      'Notifications',
      `Sent test notification via ${channel?.name ?? key}`,
      'Portal',
    );
    return log;
  },

  listLogs: () => logCrud.list().map(displayLog),
  addLog: (input: {
    recipient: string;
    appId: string;
    templateName: string;
    channel: ChannelKey;
    status: DeliveryStatus;
    priority: Priority;
    message: string;
  }): NotificationLog =>
    logCrud.create({ ...input, sentAt: new Date().toISOString() }),

  getUnreadCount(): number {
    try {
      const readAt = Number(
        localStorage.getItem(STORAGE_KEYS.notifReadAt) ?? 0,
      );
      return logCrud.list().filter((l) => new Date(l.sentAt).getTime() > readAt)
        .length;
    } catch {
      return 0;
    }
  },
  markAllRead(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.notifReadAt, String(Date.now()));
    } catch {
      // ignore
    }
  },

  /** Marks an app's notification integration flag once templates/rules are wired. */
  markAppIntegration: (
    appId: string,
    status: 'integrated' | 'partial' | 'not-integrated',
  ): void => {
    applicationService.setIntegrationStatus(appId, {
      notificationStatus: status,
    });
  },
};
