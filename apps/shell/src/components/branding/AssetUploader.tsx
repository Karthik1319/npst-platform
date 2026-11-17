import { useRef } from 'react';
import { toast } from '@/lib/toast';
import { ImagePlus, Trash2, Upload } from '@/components/icons';
import { Button } from '@/components/ui/button';
import styles from './AssetUploader.module.css';

export const MAX_ASSET_BYTES = 400 * 1024;

interface AssetUploaderProps {
  label: string;
  hint?: string;
  value?: string;
  onChange: (dataUrl?: string) => void;
  testId: string;
}

/** Uploads brand assets to data URLs (local previews only — nothing leaves the browser). */
export function AssetUploader({
  label,
  hint,
  value,
  onChange,
  testId,
}: AssetUploaderProps) {
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
    <div className={styles.div}>
      <p className={styles.p}>{label}</p>
      <div className={styles.div2}>
        <div className={`${styles.div3} npst-sized`}>
          {value ? (
            <img
              src={value}
              alt={`${label} preview`}
              className={`${styles.img} npst-sized`}
            />
          ) : (
            <ImagePlus className={`${styles.imagePlus} npst-sized`} />
          )}
        </div>
        <div className={styles.div4}>
          <p className={styles.p2}>
            {hint ??
              (value ? 'Asset uploaded.' : 'PNG, JPG or SVG up to 400 KB.')}
          </p>
          <div className={styles.div5}>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => inputRef.current?.click()}
              data-testid={`${testId}-upload-button`}
            >
              <Upload className={`${styles.upload} npst-sized`} />{' '}
              {value ? 'Replace' : 'Upload'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className={styles.button}
                onClick={() => {
                  onChange(undefined);
                  toast.success(`${label} removed`);
                }}
                data-testid={`${testId}-remove-button`}
              >
                <Trash2 className={`${styles.upload} npst-sized`} /> Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={styles.input}
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
