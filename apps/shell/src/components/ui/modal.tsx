import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Portal,
  renderElement,
  useControllable,
  useFocusTrap,
  useScrollLock,
} from './primitives';

/* Shared behaviour of Dialog and Sheet (replaces Base UI's Dialog). */

interface ModalState {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const ModalContext = createContext<ModalState | null>(null);

export function useModal(): ModalState {
  const state = useContext(ModalContext);
  if (!state) throw new Error('Dialog parts must be used inside <Dialog>');
  return state;
}

export interface ModalRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function ModalRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: ModalRootProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const titleId = useId();
  const descriptionId = useId();
  return (
    <ModalContext value={{ open: isOpen, setOpen, titleId, descriptionId }}>
      {children}
    </ModalContext>
  );
}

type TriggerProps = ComponentProps<'button'> & {
  render?: ReactElement;
  'data-slot'?: string;
};

export function ModalTrigger({ render, onClick, ...props }: TriggerProps) {
  const { open, setOpen } = useModal();
  const own = {
    ...props,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) setOpen(true);
    },
  };
  return render ? (
    renderElement(render, own)
  ) : (
    <button type="button" {...own} />
  );
}

export function ModalClose({ render, onClick, ...props }: TriggerProps) {
  const { setOpen } = useModal();
  const own = {
    ...props,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) setOpen(false);
    },
  };
  return render ? (
    renderElement(render, own)
  ) : (
    <button type="button" {...own} />
  );
}

interface ModalPopupProps extends ComponentProps<'div'> {
  backdropClassName: string;
  backdropSlot: string;
  /** Sheet: animate in with `data-starting-style` like Base UI. */
  startingStyle?: boolean;
}

/** Backdrop + popup in a portal, only while open. */
export function ModalPopup({
  backdropClassName,
  backdropSlot,
  startingStyle,
  children,
  ...props
}: ModalPopupProps) {
  const { open, setOpen, titleId, descriptionId } = useModal();
  const ref = useRef<HTMLDivElement>(null);
  const [starting, setStarting] = useState(true);
  useFocusTrap(open, ref);
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const frame = requestAnimationFrame(() => setStarting(false));
    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
      setStarting(true);
    };
  }, [open, setOpen]);
  if (!open) return null;
  const state = { 'data-open': '', 'data-state': 'open' };
  return (
    <Portal>
      <div
        data-slot={backdropSlot}
        className={backdropClassName}
        {...state}
        {...(startingStyle && starting ? { 'data-starting-style': '' } : {})}
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        {...state}
        {...(startingStyle && starting ? { 'data-starting-style': '' } : {})}
        {...props}
      >
        {children}
      </div>
    </Portal>
  );
}
