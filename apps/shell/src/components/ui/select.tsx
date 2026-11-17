import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import { CheckIcon, ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  handleListKeys,
  Portal,
  useControllable,
  useDismiss,
  usePopupPosition,
  type Align,
  type Side,
} from './primitives';
import positioning from './primitives.module.css';
import styles from './select.module.css';

/* Same classes as the original shadcn Select; in-house behaviour (was Base UI Select). */

interface SelectState {
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  disabled?: boolean;
}
const SelectContext = createContext<SelectState | null>(null);
const useSelect = () => {
  const state = useContext(SelectContext);
  if (!state) throw new Error('Select parts must be used inside <Select>');
  return state;
};

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  name?: string;
  children?: ReactNode;
}

function Select({
  value,
  defaultValue = '',
  onValueChange,
  open,
  onOpenChange,
  disabled,
  name,
  children,
}: SelectProps) {
  const [current, setValue] = useControllable(
    value,
    defaultValue,
    onValueChange,
  );
  const [isOpen, setOpen] = useControllable(open, false, onOpenChange);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <SelectContext
      value={{
        value: current,
        setValue,
        open: isOpen,
        setOpen,
        triggerRef,
        disabled,
      }}
    >
      {children}
      {/* Like Base UI: a visually hidden input after the trigger holds the
          form value (it also affects spacing in "space-y" containers). */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={current}
        readOnly
        className={positioning.hiddenInput}
      />
    </SelectContext>
  );
}

function SelectGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="group"
      data-slot="select-group"
      className={cn(styles.selectPrimitiveGroup, className)}
      {...props}
    />
  );
}

/** Shows `children` when given, otherwise the selected value (as Base UI does). */
function SelectValue({
  className,
  children,
  placeholder,
  ...props
}: ComponentProps<'span'> & { placeholder?: ReactNode }) {
  const { value } = useSelect();
  return (
    <span
      data-slot="select-value"
      className={cn(styles.selectPrimitiveValue, className)}
      {...props}
    >
      {children ?? (value || placeholder)}
    </span>
  );
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  onClick,
  onKeyDown,
  ...props
}: ComponentProps<'button'> & { size?: 'sm' | 'default' }) {
  const { open, setOpen, triggerRef, value, disabled } = useSelect();
  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      disabled={disabled}
      data-slot="select-trigger"
      data-size={size}
      {...(value ? {} : { 'data-placeholder': '' })}
      {...(open ? { 'data-popup-open': '' } : {})}
      className={cn(styles.selectPrimitiveTrigger, className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
          event.preventDefault();
          setOpen(true);
        }
      }}
      {...props}
    >
      {children}
      <ChevronDownIcon className={`${styles.chevronDownIcon} npst-sized`} />
    </button>
  );
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  align = 'center',
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: ComponentProps<'div'> & {
  side?: Side;
  sideOffset?: number;
  align?: Align;
  alignOffset?: number;
  alignItemWithTrigger?: boolean;
}) {
  const { open, setOpen, triggerRef } = useSelect();
  const positionerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen, triggerRef]);
  useDismiss(open, [positionerRef, triggerRef], close);
  const usedSide = usePopupPosition(open, triggerRef, positionerRef, {
    side,
    align: align === 'center' ? 'start' : align,
    sideOffset,
    alignOffset,
  });
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    (
      list?.querySelector<HTMLElement>('[aria-selected="true"]') ??
      list?.querySelector<HTMLElement>('[role="option"]')
    )?.focus({ preventScroll: true });
  }, [open]);
  if (!open) return null;
  return (
    <Portal>
      <div
        ref={positionerRef}
        className={cn(styles.selectPrimitivePositioner, positioning.positioner)}
      >
        <div
          ref={listRef}
          role="listbox"
          data-slot="select-content"
          data-align-trigger={false}
          data-open=""
          data-side={usedSide}
          className={cn(styles.selectPrimitivePopup, className)}
          onKeyDown={(event) => {
            handleListKeys(event, '[role="option"]');
            if (event.key === 'Tab') close();
          }}
          {...props}
        >
          {void alignItemWithTrigger}
          {children}
        </div>
      </div>
    </Portal>
  );
}

function SelectLabel({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-label"
      className={cn(styles.selectPrimitiveGroupLabel, className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value,
  disabled,
  ...props
}: ComponentProps<'div'> & { value: string; disabled?: boolean }) {
  const select = useSelect();
  const selected = select.value === value;
  const choose = () => {
    if (disabled) return;
    select.setValue(value);
    select.setOpen(false);
    select.triggerRef.current?.focus();
  };
  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      data-slot="select-item"
      {...(selected ? { 'data-selected': '' } : {})}
      {...(disabled ? { 'data-disabled': '', 'aria-disabled': true } : {})}
      className={cn(styles.selectPrimitiveItem, className)}
      onClick={choose}
      onMouseMove={(event) =>
        event.currentTarget.focus({ preventScroll: true })
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose();
        }
      }}
      {...props}
    >
      <span className={styles.selectPrimitiveItemText}>{children}</span>
      {selected && (
        <span className={`${styles.span} npst-sized`}>
          <CheckIcon className={styles.checkIcon} />
        </span>
      )}
    </div>
  );
}

function SelectSeparator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      data-slot="select-separator"
      className={cn(styles.selectPrimitiveSeparator, className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
