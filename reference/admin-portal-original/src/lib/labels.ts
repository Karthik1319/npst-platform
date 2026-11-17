import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  ChannelKey,
  ConfigStatus,
  DeliveryStatus,
  IntegrationStatus,
  NotificationIntegration,
  Priority,
  ReminderFrequency,
  ReminderStatus,
  TemplateCategory,
  TriggerEvent,
} from '@/types';

export const CHANNEL_LABELS: Record<ChannelKey, string> = {
  inapp: 'In-App',
  email: 'Email',
  sms: 'SMS',
  push: 'Push',
};

export const CHANNEL_KEYS = Object.keys(CHANNEL_LABELS) as ChannelKey[];

export const CHANNEL_ICONS: Record<ChannelKey, LucideIcon> = {
  inapp: Bell,
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  delivered: 'Delivered',
  failed: 'Failed',
  pending: 'Pending',
};

export const INTEGRATION_LABELS: Record<IntegrationStatus, string> = {
  active: 'Active',
  inactive: 'Disabled',
  pending: 'Pending',
};

export const BRANDING_STATUS_LABELS: Record<ConfigStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  'not-configured': 'Not Configured',
  'pending-approval': 'Pending Approval',
};

export const NOTIF_INTEGRATION_LABELS: Record<NotificationIntegration, string> = {
  integrated: 'Fully Integrated',
  partial: 'Partial',
  'not-integrated': 'Not Integrated',
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'Pending',
  completed: 'Completed',
  overdue: 'Overdue',
};

export const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  'one-time': 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom Interval',
};

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  welcome: 'Welcome',
  reminder: 'Reminder',
  approval: 'Approval',
  alert: 'Alert',
  announcement: 'Announcement',
};

export const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  'employee-onboarding': 'Employee Onboarding',
  'approval-pending': 'Approval Pending',
  'task-due': 'Task Due',
  'payment-received': 'Payment Received',
  'document-expiring': 'Document Expiring',
  'deal-stage-change': 'Deal Stage Change',
  'course-due': 'Course Due',
};

export const RECIPIENT_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'approver', label: 'Approver' },
  { value: 'manager', label: 'Reporting Manager' },
  { value: 'admin', label: 'Administrator' },
] as const;

export const MODULES = [
  'Dashboard',
  'Applications',
  'UI Branding',
  'Notifications',
  'Reminders',
  'Users',
  'Settings',
] as const;

export const TEMPLATE_VARIABLES = [
  '{{employeeName}}',
  '{{applicationName}}',
  '{{dueDate}}',
  '{{taskName}}',
  '{{managerName}}',
  '{{amount}}',
] as const;
