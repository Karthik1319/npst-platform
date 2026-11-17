interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

/** Interactive color picker: native swatch plus a hex text field, kept in sync. */
export function ColorPicker({ label, value, onChange, testId }: ColorPickerProps) {
  const swatchId = testId ?? 'color-picker';
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-blue-600/30">
        <label
          className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
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
          className="w-full bg-transparent font-mono text-xs uppercase text-foreground outline-none"
          data-testid={`${swatchId}-hex`}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
