import { useRef } from 'react';
import { toast } from 'sonner';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MAX_ASSET_BYTES = 400 * 1024;

interface AssetUploaderProps {
  label: string;
  hint?: string;
  value?: string;
  onChange: (dataUrl?: string) => void;
  testId: string;
}

/** Uploads brand assets to data URLs (local previews only — nothing leaves the browser). */
export function AssetUploader({ label, hint, value, onChange, testId }: AssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG, JPG or SVG).');
      return;
    }
    if (file.size > MAX_ASSET_BYTES) {
      toast.error('Image is too large — keep brand assets under 400 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
        toast.success(`${label} updated`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-3">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
          {value ? (
            <img src={value} alt={`${label} preview`} className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground/60" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">
            {hint ?? (value ? 'Asset uploaded.' : 'PNG, JPG or SVG up to 400 KB.')}
          </p>
          <div className="mt-1.5 flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => inputRef.current?.click()}
              data-testid={`${testId}-upload-button`}
            >
              <Upload className="size-3.5" /> {value ? 'Replace' : 'Upload'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  onChange(undefined);
                  toast.success(`${label} removed`);
                }}
                data-testid={`${testId}-remove-button`}
              >
                <Trash2 className="size-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
            e.target.value = '';
          }}
          data-testid={`${testId}-input`}
        />
      </div>
    </div>
  );
}
