import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { CheckIcon, ChevronRightIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  handleListKeys,
  Portal,
  renderElement,
  useControllable,
  useDismiss,
  usePopupPosition,
  type Align,
  type Side,
} from './primitives';
import positioning from './primitives.module.css';
import styles from './dropdown-menu.module.css';

/* Same classes as the original shadcn DropdownMenu; in-house behaviour (was Base UI Menu). */

interface MenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}
const MenuContext = createContext<MenuState | null>(null);
const useMenu = () => {
  const state = useContext(MenuContext);
  if (!state)
    throw new Error('DropdownMenu parts must be used inside <DropdownMenu>');
  return state;
};

function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <MenuContext value={{ open: isOpen, setOpen, triggerRef }}>
      {children}
    </MenuContext>
  );
}

function DropdownMenuPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuTrigger({
  render,
  onClick,
  ...props
}: ComponentProps<'button'> & { render?: ReactElement }) {
  const { open, setOpen, triggerRef } = useMenu();
  const own = {
    'data-slot': 'dropdown-menu-trigger',
    ...props,
    ref: triggerRef,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    ...(open ? { 'data-popup-open': '' } : {}),
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) setOpen(!open);
    },
  };
  return render ? (
    renderElement(render, own)
  ) : (
    <button type="button" {...own} />
  );
}

function DropdownMenuContent({
  align = 'start',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  className,
  children,
  ...props
}: ComponentProps<'div'> & {
  align?: Align;
  alignOffset?: number;
  side?: Side;
  sideOffset?: number;
}) {
  const { open, setOpen, triggerRef } = useMenu();
  const positionerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen, triggerRef]);
  useDismiss(open, [positionerRef, triggerRef], close);
  const usedSide = usePopupPosition(open, triggerRef, positionerRef, {
    side,
    align,
    sideOffset,
    alignOffset,
  });
  useEffect(() => {
    if (open) popupRef.current?.focus({ preventScroll: true });
  }, [open]);
  if (!open) return null;
  return (
    <Portal>
      <div
        ref={positionerRef}
        className={cn(styles.menuPrimitivePositioner, positioning.positioner)}
      >
        <div
          ref={popupRef}
          role="menu"
          tabIndex={-1}
          data-slot="dropdown-menu-content"
          data-open=""
          data-side={usedSide}
          className={cn(styles.menuPrimitivePopup, className)}
          onKeyDown={(event) => {
            handleListKeys(event, '[role^="menuitem"]');
            if (event.key === 'Tab') close();
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}

function DropdownMenuGroup(props: ComponentProps<'div'>) {
  return <div role="group" data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: ComponentProps<'div'> & { inset?: boolean }) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset || undefined}
      className={cn(styles.menuPrimitiveGroupLabel, className)}
      {...props}
    />
  );
}

type ItemProps = ComponentProps<'div'> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  render?: ReactElement;
  closeOnClick?: boolean;
};

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  disabled,
  render,
  onClick,
  closeOnClick = true,
  ...props
}: ItemProps) {
  const { setOpen } = useMenu();
  const own = {
    role: 'menuitem',
    tabIndex: -1,
    'data-slot': 'dropdown-menu-item',
    'data-inset': inset || undefined,
    'data-variant': variant,
    ...(disabled ? { 'data-disabled': '', 'aria-disabled': true } : {}),
    className: cn(
      `${styles.menuPrimitiveItem} npst-g-dropdown-menu-item`,
      className,
    ),
    ...props,
    onMouseMove: (event: React.MouseEvent<HTMLElement>) =>
      event.currentTarget.focus({ preventScroll: true }),
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.currentTarget.click();
      }
    },
    onClick: (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      onClick?.(event);
      if (closeOnClick) setOpen(false);
    },
  };
  return render ? renderElement(render, own) : <div {...own} />;
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="separator"
      data-slot="dropdown-menu-separator"
      className={cn(styles.menuPrimitiveSeparator, className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(styles.span2, className)}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  onCheckedChange,
  ...props
}: ComponentProps<'div'> & {
  checked?: boolean;
  inset?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={-1}
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset || undefined}
      className={cn(styles.menuPrimitiveCheckboxItem, className)}
      onClick={() => onCheckedChange?.(!checked)}
      onMouseMove={(event) =>
        event.currentTarget.focus({ preventScroll: true })
      }
      {...props}
    >
      <span
        className={styles.span}
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        {checked && <CheckIcon />}
      </span>
      {children}
    </div>
  );
}

function DropdownMenuSub({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ComponentProps<'div'> & { inset?: boolean }) {
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset || undefined}
      className={cn(styles.menuPrimitiveSubmenuTrigger, className)}
      {...props}
    >
      {children}
      <ChevronRightIcon className={styles.chevronRightIcon} />
    </div>
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
};
