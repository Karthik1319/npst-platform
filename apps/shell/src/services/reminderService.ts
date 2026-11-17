import { addDays } from 'date-fns';
import { createCrudService } from './mockApi';
import { auditService } from './auditService';
import { seedEscalations, seedPolicies, seedReminders } from '@/data/seed';
import { notificationService } from './notificationService';
import { STORAGE_KEYS } from './storage';
import type {
  EscalationLevel,
  ReminderInstance,
  ReminderPolicy,
} from '@/types';

const policyCrud = createCrudService<ReminderPolicy>(
  STORAGE_KEYS.policies,
  seedPolicies,
);
const escalationCrud = createCrudService<EscalationLevel>(
  STORAGE_KEYS.escalations,
  seedEscalations,
);
const instanceCrud = createCrudService<ReminderInstance>(
  STORAGE_KEYS.reminders,
  seedReminders,
);

export const reminderService = {
  listPolicies: policyCrud.list,
  getPolicy: policyCrud.get,
  createPolicy: (
    input: Omit<ReminderPolicy, 'id' | 'createdAt'>,
  ): ReminderPolicy => {
    const policy = policyCrud.create({
      ...input,
      createdAt: new Date().toISOString(),
    });
    auditService.log(
      'Reminders',
      `Created reminder policy "${policy.name}"`,
      policy.appId,
    );
    return policy;
  },
  updatePolicy: (
    id: string,
    patch: Partial<Omit<ReminderPolicy, 'id'>>,
  ): ReminderPolicy | undefined => {
    const next = policyCrud.update(id, patch);
    if (next)
      auditService.log(
        'Reminders',
        `Updated reminder policy "${next.name}"`,
        next.appId,
      );
    return next;
  },
  removePolicy: (id: string): void => {
    const policy = policyCrud.get(id);
    policyCrud.remove(id);
    if (policy)
      auditService.log(
        'Reminders',
        `Deleted reminder policy "${policy.name}"`,
        policy.appId,
      );
  },

  listEscalations: escalationCrud.list,
  listEscalationsForPolicy: (policyId: string): EscalationLevel[] =>
    escalationCrud
      .list()
      .filter((e) => e.policyId === policyId)
      .sort((a, b) => a.level - b.level),
  createEscalation: (input: Omit<EscalationLevel, 'id'>): EscalationLevel => {
    const level = escalationCrud.create(input);
    auditService.log(
      'Reminders',
      `Added escalation level ${level.level}`,
      level.appId,
    );
    return level;
  },
  updateEscalation: (
    id: string,
    patch: Partial<Omit<EscalationLevel, 'id'>>,
  ): EscalationLevel | undefined => {
    const next = escalationCrud.update(id, patch);
    if (next)
      auditService.log(
        'Reminders',
        `Updated escalation level ${next.level}`,
        next.appId,
      );
    return next;
  },
  removeEscalation: (id: string): void => {
    const level = escalationCrud.get(id);
    escalationCrud.remove(id);
    if (level)
      auditService.log(
        'Reminders',
        `Removed escalation level ${level.level}`,
        level.appId,
      );
  },

  listInstances: instanceCrud.list,
  completeInstance: (id: string): ReminderInstance | undefined => {
    const next = instanceCrud.update(id, { status: 'completed' });
    if (next)
      auditService.log(
        'Reminders',
        `Marked reminder ${next.id} as completed`,
        next.appId,
      );
    return next;
  },
  sendNow: (id: string): ReminderInstance | undefined => {
    const instance = instanceCrud.get(id);
    if (!instance) return undefined;
    const policy = policyCrud.get(instance.policyId);
    const interval = policy?.repeatInterval ?? 1;
    const next = instanceCrud.update(id, {
      sentCount: Math.min(instance.sentCount + 1, instance.maxCount),
      nextReminderDate: addDays(
        new Date(instance.nextReminderDate),
        Math.max(interval, 1),
      ).toISOString(),
    });
    notificationService.addLog({
      recipient: instance.recipient,
      appId: instance.appId,
      templateName: `${instance.policyName} — manual reminder`,
      channel: policy?.channels[0] ?? 'inapp',
      status: 'delivered',
      priority: policy?.priority ?? 'medium',
      message: `Manual reminder sent for "${instance.policyName}".`,
    });
    auditService.log(
      'Reminders',
      `Sent an out-of-band reminder for "${instance.policyName}"`,
      instance.appId,
    );
    return next;
  },
};
