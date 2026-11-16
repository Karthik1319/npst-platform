import { createRandom } from './random';
import { seedEmployees, seedLeaveRequests } from './seed/hr';
import {
  seedActivity,
  seedNotifications,
  seedReminders,
} from './seed/platform';
import { seedProjects } from './seed/projects';
import { CUSTOMERS, seedLeads, seedOpportunities } from './seed/sales';
import { seedTasks } from './seed/tasks';
import type { DemoData } from './types';

/**
 * The simulated backends keep their data in the browser's localStorage, so it
 * survives a reload and a sign-out/sign-in as another user (that is how the
 * demo shows one team's work arriving at another team).
 *
 * Inside the portal every app runs on the portal's page, so they all see the
 * same data, just as they would all call the same backends. Opened on its own
 * (standalone mode), an app runs on its own origin and has its own copy.
 */
export const STORAGE_KEY = 'npst.demo-backend';
/** Bump when the shape of the data changes: old saved data is then replaced. */
export const DATA_VERSION = 1;
/** Fired on `window` after any change, by whichever app made it. */
export const CHANGE_EVENT = 'npst-demo-data-change';

let memory: DemoData | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // Storage blocked: keep the data in memory for this page.
  }
}

/** Builds the sample data. The same records every time; dates are relative to `now`. */
export function generateDemoData(now: Date = new Date()): DemoData {
  const leads = seedLeads(now, createRandom(101));
  const opportunities = seedOpportunities(now, createRandom(202));
  const projects = seedProjects(now, createRandom(303));
  const employees = seedEmployees(now, createRandom(404));
  const pipeline = opportunities
    .filter((o) => ['Opportunity', 'Proposal', 'Negotiation'].includes(o.stage))
    .reduce((sum, o) => sum + o.value, 0);
  return {
    version: DATA_VERSION,
    seededAt: now.toISOString(),
    customers: CUSTOMERS.map((c) => ({ ...c })),
    leads,
    opportunities,
    projects,
    tasks: seedTasks(now, createRandom(505), projects, opportunities, leads),
    employees,
    leaveRequests: seedLeaveRequests(now, createRandom(606), employees),
    notifications: seedNotifications(now),
    reminders: seedReminders(now),
    activity: seedActivity(now),
    benchmarks: { pipelineLastQuarter: Math.round(pipeline / 1.12) },
    counters: {},
  };
}

/** Current data (generated on first use). Treat the result as read-only. */
export function readData(): DemoData {
  const store = storage();
  if (!store) {
    memory ??= generateDemoData();
    return memory;
  }
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoData;
      if (parsed.version === DATA_VERSION) return parsed;
    }
  } catch {
    // Unreadable data: start again from the sample data.
  }
  const fresh = generateDemoData();
  save(fresh);
  return fresh;
}

function save(data: DemoData): void {
  const store = storage();
  if (!store) {
    memory = data;
    return;
  }
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    memory = data;
  }
}

/** Applies a change and tells every listener on the page. */
export function updateData<T>(change: (data: DemoData) => T): T {
  const data = readData();
  const result = change(data);
  save(data);
  announceChange();
  return result;
}

/** Puts the sample data back to its starting state (for repeating a demo). */
export function resetDemoData(now: Date = new Date()): void {
  save(generateDemoData(now));
  announceChange();
}

/** Next id for a record created during the demo, e.g. `OP-1050`. */
export function nextId(data: DemoData, prefix: string, first: number): string {
  const number = data.counters[prefix] ?? first;
  data.counters[prefix] = number + 1;
  return `${prefix}-${number}`;
}

function announceChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/**
 * Calls `listener` after any change, on this page or in another tab.
 * Stands in for a backend push channel (WebSocket or server-sent events).
 */
export function onDataChange(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
