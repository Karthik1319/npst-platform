import { loadCollection, persistCollection, uid } from './storage';

export interface Identifiable {
  id: string;
}

/**
 * Generic LocalStorage-backed CRUD collection. Every domain service composes this,
 * so swapping to real HTTP calls later only touches these service modules.
 */
export function createCrudService<T extends Identifiable>(key: string, seed: () => T[]) {
  const list = (): T[] => loadCollection(key, seed);
  const get = (id: string): T | undefined => list().find((item) => item.id === id);
  const create = (input: Omit<T, 'id'>): T => {
    const item = { ...input, id: uid() } as T;
    persistCollection(key, [item, ...list()]);
    return item;
  };
  const update = (id: string, patch: Partial<Omit<T, 'id'>>): T | undefined => {
    const items = list();
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;
    const next = { ...items[idx], ...patch } as T;
    items[idx] = next;
    persistCollection(key, items);
    return next;
  };
  const remove = (id: string): void => persistCollection(key, list().filter((item) => item.id !== id));
  return { list, get, create, update, remove };
}
