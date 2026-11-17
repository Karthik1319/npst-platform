import { createCrudService } from './mockApi';
import { auditService } from './auditService';
import { readSession, STORAGE_KEYS } from './storage';
import {
  adminNotificationService,
  adminRoles,
} from './adminNotificationService';
import { seedBrandingConfigs, seedBrandingVersions } from '@/data/seed';
import { applicationService } from './adminService';
import {
  BUILT_IN_PRESETS,
  NPST_DEFAULT_STYLE,
  validateBranding,
} from '@/utils/branding';
import type {
  BrandingAssets,
  BrandingCheck,
  BrandingConfig,
  BrandingPreset,
  BrandingStyle,
  BrandingVersion,
  BrandingApprovalRequest,
} from '@/types';

const versionCrud = createCrudService<BrandingVersion>(
  STORAGE_KEYS.brandingVersions,
  seedBrandingVersions,
);
const presetCrud = createCrudService<BrandingPreset>(
  STORAGE_KEYS.brandingPresets,
  () => [],
);
const approvalCrud = createCrudService<BrandingApprovalRequest>(
  STORAGE_KEYS.brandingApprovals,
  () => [],
);

const actor = () => readSession()?.email ?? 'admin@npst.com';
const nowIso = () => new Date().toISOString();
const listConfigs = (): BrandingConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.brandingConfigs);
    if (raw !== null) return JSON.parse(raw) as BrandingConfig[];
  } catch {
    // fall through to seed
  }
  const seeded = seedBrandingConfigs();
  try {
    localStorage.setItem(STORAGE_KEYS.brandingConfigs, JSON.stringify(seeded));
  } catch {
    // storage full — session copy still works
  }
  return seeded;
};

const persistConfigs = (items: BrandingConfig[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.brandingConfigs, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to persist branding configs', error);
  }
};

export const brandingService = {
  listConfigs,
  listVersions: versionCrud.list,
  listCustomPresets: presetCrud.list,
  listApprovalRequests: approvalCrud.list,
  builtInPresets: (): BrandingPreset[] => BUILT_IN_PRESETS,

  getConfig(appId: string): BrandingConfig | undefined {
    return listConfigs().find((c) => c.appId === appId);
  },

  getOrCreateDraft(appId: string): BrandingConfig {
    const existing = this.getConfig(appId);
    if (existing) return existing;
    const draft: BrandingConfig = {
      ...NPST_DEFAULT_STYLE,
      id: appId,
      appId,
      assets: {},
      status: 'draft',
      version: 0,
      updatedBy: actor(),
      updatedAt: nowIso(),
    };
    persistConfigs([draft, ...listConfigs()]);
    return draft;
  },

  saveDraft(
    appId: string,
    style: BrandingStyle,
    assets: BrandingAssets,
  ): BrandingConfig {
    const config = this.upsertConfig(appId, style, assets, 'draft');
    auditService.log('UI Branding', 'Saved branding draft', appId);
    return config;
  },

  submitForApproval(
    appId: string,
    style: BrandingStyle,
    assets: BrandingAssets,
  ): BrandingConfig {
    const existing = this.getConfig(appId);
    if (!existing)
      throw new Error(
        'Cannot submit branding without an existing configuration',
      );
    const request = approvalCrud.create({
      appId,
      requestedBy: actor(),
      submittedAt: nowIso(),
      previousStyle: {
        primary: existing.primary,
        secondary: existing.secondary,
        accent: existing.accent,
        bg: existing.bg,
        sidebarBg: existing.sidebarBg,
        headerBg: existing.headerBg,
        cardBg: existing.cardBg,
        text: existing.text,
        borderColor: existing.borderColor,
        button: existing.button,
        buttonHover: existing.buttonHover,
        fontFamily: existing.fontFamily,
        headingSize: existing.headingSize,
        bodySize: existing.bodySize,
        fontWeight: existing.fontWeight,
        lineHeight: existing.lineHeight,
        radius: existing.radius,
        componentStyle: existing.componentStyle,
        shadow: existing.shadow,
        tableStriped: existing.tableStriped,
      },
      proposedStyle: style,
      previousAssets: existing.assets ?? {},
      proposedAssets: assets,
      status: 'pending',
    });
    adminNotificationService.create({
      title: 'Theme change approval requested',
      description: `A branding change for ${appId} is waiting for checker review.`,
      appId,
      path: `/applications/approval-queue?requestId=${request.id}`,
      roles: adminRoles,
    });
    auditService.log(
      'UI Branding',
      'Submitted branding change for approval',
      appId,
    );
    return existing;
  },
  approveRequest(id: string, comments = ''): BrandingApprovalRequest {
    const request = approvalCrud.get(id);
    if (!request) throw new Error('Approval request not found');
    const session = readSession();
    if (!session || session.email === request.requestedBy)
      throw new Error('The maker cannot approve their own request');
    const config = this.getConfig(request.appId);
    const version = (config?.version ?? 0) + 1;
    this.upsertConfig(
      request.appId,
      request.proposedStyle,
      request.proposedAssets,
      'published',
      version,
      nowIso(),
    );
    versionCrud.create({
      appId: request.appId,
      version,
      modifiedBy: request.requestedBy,
      modifiedDate: nowIso(),
      publishedBy: session.email,
      status: 'published',
      style: request.proposedStyle,
    });
    applicationService.setIntegrationStatus(request.appId, {
      brandingStatus: 'published',
    });
    const updated = approvalCrud.update(id, {
      status: 'approved',
      checkerComments: comments,
      reviewedBy: session.email,
      reviewedAt: nowIso(),
    });
    if (!updated) throw new Error('Failed to update approval request');
    adminNotificationService.create({
      title: 'Theme change approved',
      description: `Branding change for ${request.appId} was approved.`,
      appId: request.appId,
      roles: adminRoles,
    });
    auditService.log(
      'UI Branding',
      'Approved branding change request',
      request.appId,
    );
    return updated;
  },
  rejectRequest(id: string, comments: string): BrandingApprovalRequest {
    const request = approvalCrud.get(id);
    if (!request) throw new Error('Approval request not found');
    const session = readSession();
    if (!session || session.email === request.requestedBy)
      throw new Error('The maker cannot reject their own request');
    if (!comments.trim()) throw new Error('A rejection reason is required');
    const updated = approvalCrud.update(id, {
      status: 'rejected',
      checkerComments: comments,
      reviewedBy: session.email,
      reviewedAt: nowIso(),
    });
    if (!updated) throw new Error('Failed to update approval request');
    adminNotificationService.create({
      title: 'Theme change rejected',
      description: `Branding change for ${request.appId} was rejected.`,
      appId: request.appId,
      roles: adminRoles,
    });
    auditService.log(
      'UI Branding',
      'Rejected branding change request',
      request.appId,
    );
    return updated;
  },

  publish(
    appId: string,
    style: BrandingStyle,
    assets: BrandingAssets,
  ): BrandingConfig {
    const current = this.getConfig(appId);
    const version = (current?.version ?? 0) + 1;
    const config = this.upsertConfig(
      appId,
      style,
      assets,
      'published',
      version,
      nowIso(),
    );
    versionCrud.create({
      appId,
      version,
      modifiedBy: actor(),
      modifiedDate: nowIso(),
      publishedBy: actor(),
      status: 'published',
      style,
    });
    applicationService.setIntegrationStatus(appId, {
      brandingStatus: 'published',
    });
    auditService.log('UI Branding', `Published theme v${version}`, appId);
    return config;
  },

  applyToAllApplications(
    style: BrandingStyle,
    assets: BrandingAssets,
  ): BrandingConfig[] {
    const applications = applicationService.list();
    const publishedAt = nowIso();
    const publishedBy = actor();
    const configs = applications.map((application) => {
      const current = this.getConfig(application.id);
      const version = (current?.version ?? 0) + 1;
      const config = this.upsertConfig(
        application.id,
        style,
        assets,
        'published',
        version,
        publishedAt,
      );
      versionCrud.create({
        appId: application.id,
        version,
        modifiedBy: publishedBy,
        modifiedDate: publishedAt,
        publishedBy,
        status: 'published',
        style,
      });
      applicationService.setIntegrationStatus(application.id, {
        brandingStatus: 'published',
      });
      auditService.log(
        'UI Branding',
        `Published theme v${version} to all applications`,
        application.id,
      );
      return config;
    });
    return configs;
  },

  resetToPublished(appId: string): BrandingConfig {
    const lastVersion = versionCrud
      .list()
      .filter((v) => v.appId === appId)
      .sort((a, b) => b.version - a.version)[0];
    const style = lastVersion?.style ?? NPST_DEFAULT_STYLE;
    const config = this.upsertConfig(
      appId,
      style,
      this.getConfig(appId)?.assets ?? {},
      'draft',
    );
    auditService.log(
      'UI Branding',
      'Reset changes — reverted to last published theme',
      appId,
    );
    return config;
  },

  restoreVersion(appId: string, versionId: string): BrandingConfig {
    const version = versionCrud.get(versionId);
    const config = this.upsertConfig(
      appId,
      version?.style ?? NPST_DEFAULT_STYLE,
      this.getConfig(appId)?.assets ?? {},
      'draft',
    );
    auditService.log(
      'UI Branding',
      `Restored branding version ${version?.version ?? '—'} as draft`,
      appId,
    );
    return config;
  },

  validate(appId: string, style: BrandingStyle): BrandingCheck[] {
    void appId;
    return validateBranding(style);
  },

  saveCustomPreset(name: string, style: BrandingStyle): BrandingPreset {
    const preset = presetCrud.create({ name, builtIn: false, style });
    auditService.log(
      'UI Branding',
      `Saved custom theme preset "${name}"`,
      'Portal',
    );
    return preset;
  },

  deleteCustomPreset(id: string): void {
    const preset = presetCrud.get(id);
    presetCrud.remove(id);
    if (preset)
      auditService.log(
        'UI Branding',
        `Deleted custom theme preset "${preset.name}"`,
        'Portal',
      );
  },

  upsertConfig(
    appId: string,
    style: BrandingStyle,
    assets: BrandingAssets,
    status: BrandingConfig['status'],
    version?: number,
    lastPublished?: string,
  ): BrandingConfig {
    const items = listConfigs();
    const idx = items.findIndex((c) => c.appId === appId);
    const base: BrandingConfig = {
      ...(idx >= 0
        ? items[idx]
        : { ...NPST_DEFAULT_STYLE, id: appId, appId, version: 0 }),
      ...style,
      appId,
      assets,
      status,
      ...(version !== undefined ? { version } : {}),
      ...(lastPublished !== undefined ? { lastPublished } : {}),
      updatedBy: actor(),
      updatedAt: nowIso(),
    };
    if (idx >= 0) items[idx] = base;
    else items.unshift(base);
    persistConfigs(items);
    return base;
  },
};
