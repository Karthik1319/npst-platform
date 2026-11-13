/** Every bus event name gets this prefix on `window`, e.g. `npst:demo:message`. */
export const EVENT_PREFIX = 'npst:';

/**
 * Registry of all cross-MFE events and their payloads.
 * Add new events here; never change or remove an existing one (additive only).
 */
export interface NpstEvents {
  /** Demo event: React A sends a message, React B displays it (Step 5). */
  'demo:message': { from: string; text: string };
}

export type NpstEventName = keyof NpstEvents;

/** Call it to stop listening. */
export type Unsubscribe = () => void;

export interface EventBus {
  emit<K extends NpstEventName>(name: K, detail: NpstEvents[K]): void;
  on<K extends NpstEventName>(
    name: K,
    handler: (detail: NpstEvents[K]) => void,
  ): Unsubscribe;
}

/**
 * Creates a typed event bus on top of DOM CustomEvents.
 * Every copy of this code that uses the same `window` talks to the same bus,
 * so MFEs that bundle their own copy can still exchange events.
 */
export function createEventBus(target: EventTarget = window): EventBus {
  return {
    emit<K extends NpstEventName>(name: K, detail: NpstEvents[K]) {
      target.dispatchEvent(new CustomEvent(EVENT_PREFIX + name, { detail }));
    },
    on<K extends NpstEventName>(
      name: K,
      handler: (detail: NpstEvents[K]) => void,
    ) {
      const listener = (event: Event) => {
        handler((event as CustomEvent<NpstEvents[K]>).detail);
      };
      target.addEventListener(EVENT_PREFIX + name, listener);
      return () => target.removeEventListener(EVENT_PREFIX + name, listener);
    },
  };
}
