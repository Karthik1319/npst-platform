import type { ComponentProps, ReactElement } from 'react';
import { XIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ModalClose,
  ModalPopup,
  ModalRoot,
  ModalTrigger,
  useModal,
  type ModalRootProps,
} from './modal';
import styles from './dialog.module.css';

/* Same structure and classes as the original shadcn Dialog; behaviour in modal.tsx. */

function Dialog(props: ModalRootProps) {
  return <ModalRoot {...props} />;
}

function DialogTrigger(
  props: ComponentProps<'button'> & { render?: ReactElement },
) {
  return <ModalTrigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function DialogClose(
  props: ComponentProps<'button'> & { render?: ReactElement },
) {
  return <ModalClose data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className }: { className?: string }) {
  // The overlay is rendered by DialogContent (backdrop); kept for API compatibility.
  void className;
  return null;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <ModalPopup
      data-slot="dialog-content"
      backdropSlot="dialog-overlay"
      backdropClassName={styles.dialogPrimitiveBackdrop}
      className={cn(styles.dialogPrimitivePopup, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <ModalClose
          data-slot="dialog-close"
          render={
            <Button variant="ghost" className={styles.button} size="icon-sm" />
          }
        >
          <XIcon />
          <span className={styles.span}>Close</span>
        </ModalClose>
      )}
    </ModalPopup>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(styles.div, className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(styles.div2, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <ModalClose render={<Button variant="outline" />}>Close</ModalClose>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: ComponentProps<'h2'>) {
  const { titleId } = useModal();
  return (
    <h2
      id={titleId}
      data-slot="dialog-title"
      className={cn(styles.dialogPrimitiveTitle, className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: ComponentProps<'p'>) {
  const { descriptionId } = useModal();
  return (
    <p
      id={descriptionId}
      data-slot="dialog-description"
      className={cn(styles.dialogPrimitiveDescription, className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
