// Central type definitions — single source of truth shared by services, components and pages.

export type IntegrationStatus = 'active' | 'inactive' | 'pending';
export type ConfigStatus = 'published' | 'draft' | 'not-configured' | 'pending-approval';
export type NotificationIntegration = 'integrated' | 'partial' | 'not-integrated';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type DeliveryStatus = 'delivered' | 'failed' | 'pending';
export type ChannelKey = 'inapp' | 'email' | 'sms' | 'push';
export type ReminderStatus = 'pending' | 'completed' | 'overdue';
export type ReminderFrequency = 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type UserRole = 'Super Admin' | 'Admin' | 'Application Admin' | 'Employee';
export type ComponentStyle = 'modern' | 'minimal' | 'classic' | 'rounded';
export type ShadowDepth = 'none' | 'sm' | 'md' | 'lg';
export type BrandingWorkflowStatus = 'draft' | 'pending-approval' | 'published';
export type TemplateCategory = 'welcome' | 'reminder' | 'approval' | 'alert' | 'announcement';
export type TriggerEvent =
  | 'employee-onboarding'
  | 'approval-pending'
  | 'task-due'
  | 'payment-received'
  | 'document-expiring'
  | 'deal-stage-change'
  | 'course-due';

export interface NotificationCodeMaster {
  id: string;
  appId: string;
  code: string;
  name: string;
  category: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface NotificationDefinition {
  id: string;
  codeId: string;
  subject: string;
  body: string;
  variables: string[];
  channels: ChannelKey[];
  language: string;
  status: 'active' | 'inactive';
}

export interface ReminderCodeMaster {
  id: string;
  appId: string;
  code: string;
  name: string;
  category: string;
  description: string;
  reasons: string[];
  status: 'active' | 'inactive';
}

export interface ReminderDefinition {
  id: string;
  codeId: string;
  defaultMessage: string;
  variables: string[];
  defaultChannels: ChannelKey[];
  status: 'active' | 'inactive';
}

export interface NpstApplication {
  id: string;
  name: string;
  code: string;
  url: string;
  description: string;
  /** Brand color used to render the generated application logo avatar. */
  color: string;
  status: IntegrationStatus;
  brandingStatus: ConfigStatus;
  notificationStatus: NotificationIntegration;
  employees?: number;
  lastUpdated: string;
  registrationDate?: string;
}

export interface BrandingStyle {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  sidebarBg: string;
  headerBg: string;
  cardBg: string;
  text: string;
  borderColor: string;
  button: string;
  buttonHover: string;
  fontFamily: string;
  headingSize: number;
  bodySize: number;
  fontWeight: number;
  lineHeight: number;
  radius: number;
  componentStyle: ComponentStyle;
  shadow: ShadowDepth;
  tableStriped: boolean;
}

export interface BrandingAssets {
  logo?: string;
  favicon?: string;
  loginBg?: string;
  icon?: string;
}

export interface BrandingConfig extends BrandingStyle {
  id: string;
  appId: string;
  assets: BrandingAssets;
  status: BrandingWorkflowStatus;
  version: number;
  lastPublished?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BrandingVersion {
  id: string;
  appId: string;
  version: number;
  modifiedBy: string;
  modifiedDate: string;
  publishedBy: string;
  status: 'published' | 'archived';
  style: BrandingStyle;
}

export interface BrandingApprovalRequest {
  id: string;
  appId: string;
  requestedBy: string;
  submittedAt: string;
  previousStyle: BrandingStyle;
  proposedStyle: BrandingStyle;
  previousAssets: BrandingAssets;
  proposedAssets: BrandingAssets;
  status: 'pending' | 'approved' | 'rejected';
  checkerComments?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface BrandingPreset {
  id: string;
  name: string;
  builtIn: boolean;
  style: BrandingStyle;
}

export interface BrandingCheck {
  level: 'pass' | 'warning';
  message: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  code: string;
  appId: string;
  category: TemplateCategory;
  channel: ChannelKey;
  channels: ChannelKey[];
  subject: string;
  body: string;
  variables: string[];
  priority: Priority;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  appId: string;
  triggerEvent: TriggerEvent;
  recipient: string;
  channels: ChannelKey[];
  priority: Priority;
  templateId: string;
  conditions: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ChannelConfig {
  id: string;
  key: ChannelKey;
  name: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  /** Non-sensitive mock configuration fields only — no credentials live in the frontend. */
  fields: Record<string, string>;
}

export interface NotificationLog {
  id: string;
  recipient: string;
  appId: string;
  templateName: string;
  channel: ChannelKey;
  sentAt: string;
  status: DeliveryStatus;
  priority: Priority;
  message: string;
}

export interface ScheduleStep {
  id: string;
  day: number;
  label: string;
  type: 'initial' | 'reminder' | 'escalation';
  recipient: string;
  channels: ChannelKey[];
}

export interface ReminderPolicy {
  id: string;
  name: string;
  code: string;
  reason?: string;
  appId: string;
  description: string;
  triggerEvent: TriggerEvent;
  triggerDate: string;
  frequency: ReminderFrequency;
  customDays?: number;
  firstReminderAfter: number;
  repeatInterval: number;
  maxCount: number;
  recipient: string;
  channels: ChannelKey[];
  priority: Priority;
  status: 'active' | 'inactive';
  schedule: ScheduleStep[];
  createdAt: string;
}

export interface EscalationLevel {
  id: string;
  policyId: string;
  appId: string;
  level: number;
  triggerCondition: string;
  timeAfterDue: number;
  recipient: string;
  channels: ChannelKey[];
  message: string;
}

export interface ReminderInstance {
  id: string;
  policyId: string;
  policyName: string;
  appId: string;
  recipient: string;
  scheduledDate: string;
  nextReminderDate: string;
  escalationLevel: number;
  sentCount: number;
  maxCount: number;
  status: ReminderStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  apps: string[];
  status: 'active' | 'inactive';
  phone?: string;
  department?: string;
  designation?: string;
  reportingManager?: string;
  employeeId?: string;
  lastLogin?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  description: string;
  appId?: string;
  timestamp: string;
  read: boolean;
  path?: string;
  roles: UserRole[];
}

export interface AccessibilityPreferences {
  zoom: number;
  highContrast: boolean;
  theme: 'light' | 'dark';
}

export interface AuditEntry {
  id: string;
  user: string;
  module: string;
  action: string;
  appId: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'failed';
}

export interface Session {
  email: string;
  name: string;
  role: UserRole;
  loginAt: string;
  remember: boolean;
}

export interface NpstSettings {
  portalName: string;
  timezone: string;
  dateFormat: string;
  sessionTimeout: number;
  enforce2FA: boolean;
  passwordExpiry: number;
  apiKey: string;
}
