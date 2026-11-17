import type { ReactNode } from 'react';
import { AlertTriangle } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  icon,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={styles.dialogContent}>
        <DialogHeader>
          <div className={styles.div}>
            <div
              className={cn(
                `${styles.div2} npst-sized`,
                destructive ? styles.div3 : styles.div4,
              )}
            >
              {icon ?? (
                <AlertTriangle
                  className={`${styles.alertTriangle} npst-sized`}
                />
              )}
            </div>
            <div className={styles.div5}>
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        {children}
        <DialogFooter className={styles.dialogFooter}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="confirm-dialog-cancel-button"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            data-testid="confirm-dialog-confirm-button"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
