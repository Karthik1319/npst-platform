import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '@/lib/utils';
import {
  Portal,
  renderElement,
  useControllable,
  useDismiss,
  usePopupPosition,
  type Align,
  type Side,
} from './primitives';
import positioning from './primitives.module.css';
import styles from './popover.module.css';

/* Same classes as the original shadcn Popover; in-house behaviour (was Base UI). */

interface PopoverState {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}
const PopoverContext = createContext<PopoverState | null>(null);
const usePopover = () => {
  const state = useContext(PopoverContext);
  if (!state) throw new Error('Popover parts must be used inside <Popover>');
  return state;
};

function Popover({
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
    <PopoverContext value={{ open: isOpen, setOpen, triggerRef }}>
      {children}
    </PopoverContext>
  );
}

function PopoverTrigger({
  render,
  onClick,
  ...props
}: ComponentProps<'button'> & { render?: ReactElement }) {
  const { open, setOpen, triggerRef } = usePopover();
  const own = {
    'data-slot': 'popover-trigger',
    ...props,
    ref: triggerRef,
    'aria-expanded': open,
    'aria-haspopup': 'dialog' as const,
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

function PopoverContent({
  className,
  align = 'center',
  alignOffset = 0,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: ComponentProps<'div'> & {
  align?: Align;
  alignOffset?: number;
  side?: Side;
  sideOffset?: number;
}) {
  const { open, setOpen, triggerRef } = usePopover();
  const positionerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);
  useDismiss(open, [positionerRef, triggerRef], close);
  const usedSide = usePopupPosition(open, triggerRef, positionerRef, {
    side,
    align,
    sideOffset,
    alignOffset,
  });
  if (!open) return null;
  return (
    <Portal>
      <div
        ref={positionerRef}
        className={cn(
          styles.popoverPrimitivePositioner,
          positioning.positioner,
        )}
      >
        <div
          data-slot="popover-content"
          data-open=""
          data-side={usedSide}
          role="dialog"
          className={cn(styles.popoverPrimitivePopup, className)}
          {...props}
        />
      </div>
    </Portal>
  );
}

function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-header"
      className={cn(styles.div, className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="popover-title"
      className={cn(styles.popoverPrimitiveTitle, className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="popover-description"
      className={cn(styles.popoverPrimitiveDescription, className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
