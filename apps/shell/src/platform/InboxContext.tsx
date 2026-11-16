import type { InboxItem, Reminder } from '@npst/shared-contracts';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePlatform } from '@/platform/PlatformContext';

interface InboxValue {
  status: 'loading' | 'ready' | 'error';
  items: readonly InboxItem[];
  reminders: readonly Reminder[];
  unreadCount: number;
  markRead(id: string): void;
  markAllRead(): void;
}

const InboxContext = createContext<InboxValue | null>(null);

/**
 * The signed-in user's notifications and reminders, loaded once for the whole
 * portal (bell, left nav, Portal Home) and reloaded when the Notification
 * Service announces a change.
 */
export function InboxProvider({ children }: { children: ReactNode }) {
  const platform = usePlatform();
  const [status, setStatus] = useState<InboxValue['status']>('loading');
  const [items, setItems] = useState<readonly InboxItem[]>([]);
  const [reminders, setReminders] = useState<readonly Reminder[]>([]);

  useEffect(() => {
    let active = true;
    const load = () => {
      Promise.all([platform.inbox.list(), platform.reminders.list()]).then(
        ([inbox, upcoming]) => {
          if (!active) return;
          setItems(inbox);
          setReminders(upcoming);
          setStatus('ready');
        },
        () => {
          if (active) setStatus('error');
        },
      );
    };
    load();
    const stop = platform.inbox.subscribe(load);
    return () => {
      active = false;
      stop();
    };
  }, [platform]);

  const value = useMemo<InboxValue>(
    () => ({
      status,
      items,
      reminders,
      unreadCount: items.filter((item) => !item.read).length,
      markRead: (id) => void platform.inbox.markRead(id),
      markAllRead: () => void platform.inbox.markAllRead(),
    }),
    [status, items, reminders, platform],
  );
  return <InboxContext value={value}>{children}</InboxContext>;
}

export function useInbox(): InboxValue {
  const inbox = useContext(InboxContext);
  if (!inbox) throw new Error('useInbox() must be used inside <InboxProvider>');
  return inbox;
}
