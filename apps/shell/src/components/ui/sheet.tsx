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
import styles from './sheet.module.css';

/* Side panel (same classes as the original shadcn Sheet); behaviour in modal.tsx. */

function Sheet(props: ModalRootProps) {
  return <ModalRoot {...props} />;
}

function SheetTrigger(
  props: ComponentProps<'button'> & { render?: ReactElement },
) {
  return <ModalTrigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(
  props: ComponentProps<'button'> & { render?: ReactElement },
) {
  return <ModalClose data-slot="sheet-close" {...props} />;
}

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: ComponentProps<'div'> & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}) {
  return (
    <ModalPopup
      data-slot="sheet-content"
      data-side={side}
      startingStyle
      backdropSlot="sheet-overlay"
      backdropClassName={styles.sheetPrimitiveBackdrop}
      className={cn(styles.sheetPrimitivePopup, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <ModalClose
          data-slot="sheet-close"
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

function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(styles.div, className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(styles.div2, className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: ComponentProps<'h2'>) {
  const { titleId } = useModal();
  return (
    <h2
      id={titleId}
      data-slot="sheet-title"
      className={cn(styles.sheetPrimitiveTitle, className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: ComponentProps<'p'>) {
  const { descriptionId } = useModal();
  return (
    <p
      id={descriptionId}
      data-slot="sheet-description"
      className={cn(styles.sheetPrimitiveDescription, className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
