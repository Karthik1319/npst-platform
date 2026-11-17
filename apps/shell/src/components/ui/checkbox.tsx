import type { ComponentProps } from 'react';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useControllable } from './primitives';
import positioning from './primitives.module.css';
import styles from './checkbox.module.css';

/* Same classes as the original shadcn Checkbox; in-house behaviour (was Base UI). */

type CheckboxProps = Omit<ComponentProps<'button'>, 'onChange' | 'value'> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function Checkbox({
  className,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  onClick,
  ...props
}: CheckboxProps) {
  const [isChecked, setChecked] = useControllable(
    checked,
    defaultChecked,
    onCheckedChange,
  );
  return (
    <>
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        disabled={disabled}
        data-slot="checkbox"
        {...(isChecked ? { 'data-checked': '' } : { 'data-unchecked': '' })}
        {...(disabled ? { 'data-disabled': '' } : {})}
        className={cn(
          `${styles.checkboxPrimitiveRoot} npst-p npst-sized`,
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setChecked(!isChecked);
        }}
        {...props}
      >
        {isChecked && (
          <span
            data-slot="checkbox-indicator"
            data-checked=""
            className={styles.checkboxPrimitiveIndicator}
          >
            <CheckIcon />
          </span>
        )}
      </button>
      {/* Like Base UI: a visually hidden checkbox input follows the control. */}
      <input
        type="checkbox"
        tabIndex={-1}
        aria-hidden="true"
        checked={isChecked}
        readOnly
        className={positioning.hiddenInput}
      />
    </>
  );
}

export { Checkbox };
