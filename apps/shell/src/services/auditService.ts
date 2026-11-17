import { createCrudService } from './mockApi';
import { readSession, STORAGE_KEYS } from './storage';
import { seedAuditLogs } from '@/data/seed';
import type { AuditEntry } from '@/types';

const crud = createCrudService<AuditEntry>(STORAGE_KEYS.audit, seedAuditLogs);

const MOCK_IPS = ['10.24.8.41', '10.24.8.42', '10.24.9.17', '10.24.7.63'];

function mockIp(): string {
  return MOCK_IPS[Math.floor(Math.random() * MOCK_IPS.length)];
}

export const auditService = {
  list: crud.list,
  get: crud.get,
  log: (
    module: string,
    action: string,
    appId: string,
    status: 'success' | 'failed' = 'success',
  ): void => {
    const session = readSession();
    crud.create({
      user: session?.email ?? 'system@npst.com',
      module,
      action,
      appId,
      timestamp: new Date().toISOString(),
      ip: mockIp(),
      status,
    });
  },
};
