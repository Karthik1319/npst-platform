import { createContext, useContext, useId, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from '@/lib/variants';
import { useControllable } from './primitives';
import styles from './tabs.module.css';

/* Same classes as the original shadcn Tabs; in-house behaviour (was Base UI Tabs). */

interface TabsState {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  orientation: 'horizontal' | 'vertical';
}
const TabsContext = createContext<TabsState | null>(null);
const useTabs = () => {
  const state = useContext(TabsContext);
  if (!state) throw new Error('Tabs parts must be used inside <Tabs>');
  return state;
};

type TabsProps = Omit<ComponentProps<'div'>, 'defaultValue'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
};

function Tabs({
  className,
  orientation = 'horizontal',
  value,
  defaultValue = '',
  onValueChange,
  ...props
}: TabsProps) {
  const [current, setValue] = useControllable(
    value,
    defaultValue,
    onValueChange,
  );
  const baseId = useId();
  return (
    <TabsContext value={{ value: current, setValue, baseId, orientation }}>
      <div
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(`${styles.tabsPrimitiveRoot} npst-g-tabs`, className)}
        {...props}
      />
    </TabsContext>
  );
}

const tabsListVariants = cva(`${styles.tabsListVariants} npst-g-tabs-list`, {
  variants: { variant: { default: styles.default, line: styles.line } },
  defaultVariants: { variant: 'default' },
});

function TabsList({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof tabsListVariants>) {
  const { orientation } = useTabs();
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      data-slot="tabs-list"
      data-variant={variant}
      data-orientation={orientation}
      className={cn(tabsListVariants({ variant }), className)}
      onKeyDown={(event) => {
        const tabs = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]:not([disabled])',
          ),
        ];
        const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          event.key === 'ArrowRight'
            ? i + 1
            : event.key === 'ArrowLeft'
              ? i - 1
              : null;
        if (next === null || i < 0) return;
        event.preventDefault();
        const tab = tabs[(next + tabs.length) % tabs.length];
        tab?.focus();
        tab?.click();
      }}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value,
  ...props
}: ComponentProps<'button'> & { value: string }) {
  const tabs = useTabs();
  const active = tabs.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${tabs.baseId}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${tabs.baseId}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      data-slot="tabs-trigger"
      data-orientation={tabs.orientation}
      {...(active ? { 'data-active': '' } : {})}
      className={cn(
        styles.tabsPrimitiveTab,
        styles.tabsPrimitiveTab2,
        styles.tabsPrimitiveTab3,
        styles.tabsPrimitiveTab4,
        className,
      )}
      onClick={() => tabs.setValue(value)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  value,
  ...props
}: ComponentProps<'div'> & { value: string }) {
  const tabs = useTabs();
  if (tabs.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${tabs.baseId}-panel-${value}`}
      aria-labelledby={`${tabs.baseId}-tab-${value}`}
      tabIndex={0}
      data-slot="tabs-content"
      data-orientation={tabs.orientation}
      className={cn(styles.tabsPrimitivePanel, className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
