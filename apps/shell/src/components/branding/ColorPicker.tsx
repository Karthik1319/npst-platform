import { useCssVars } from '@/lib/css-vars';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

/** Interactive color picker: native swatch plus a hex text field, kept in sync. */
export function ColorPicker({
  label,
  value,
  onChange,
  testId,
}: ColorPickerProps) {
  const swatchId = testId ?? 'color-picker';
  const swatch = useCssVars<HTMLLabelElement>({ '--swatch-color': value });
  return (
    <div className={styles.div}>
      <p className={styles.p}>{label}</p>
      <div className={styles.div2}>
        <label
          ref={swatch}
          className={`${styles.label} ${styles.swatch} npst-sized`}
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className={`${styles.input} npst-sized`}
            data-testid={`${swatchId}-swatch`}
            aria-label={`${label} color swatch`}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onChange(raw.startsWith('#') ? raw : `#${raw}`);
          }}
          maxLength={7}
          spellCheck={false}
          className={styles.input2}
          data-testid={`${swatchId}-hex`}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
