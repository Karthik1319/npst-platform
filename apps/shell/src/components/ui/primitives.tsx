/*
 * In-house building blocks for the Admin Portal's UI components (replacing the
 * Base UI library). They reproduce the parts of Base UI the original screens
 * rely on: the `render` prop, controlled/uncontrolled state, portals, closing
 * on outside click / Escape, and popup positioning. Popup coordinates are
 * passed to CSS as custom properties (`--npst-popup-x`, `--anchor-width`, …);
 * no inline styles.
 */
import {
  cloneElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type AnyProps = Record<string, unknown>;

function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref && typeof ref === 'object')
    (ref as { current: T | null }).current = value;
}

/** One ref callback that updates several refs. */
export function mergeRefs<T>(
  ...refs: (Ref<T> | undefined)[]
): (value: T | null) => void {
  return (value) => refs.forEach((ref) => setRef(ref, value));
}

/**
 * Merges two prop objects like Base UI's `mergeProps`: classes are joined,
 * event handlers both run (the element's own first), refs are merged.
 */
export function mergeProps(base: AnyProps, extra: AnyProps): AnyProps {
  const out: AnyProps = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = out[key];
    if (key === 'className') out[key] = cn(current as string, value as string);
    else if (key === 'ref')
      out[key] = mergeRefs(current as Ref<unknown>, value as Ref<unknown>);
    else if (
      /^on[A-Z]/.test(key) &&
      typeof current === 'function' &&
      typeof value === 'function'
    ) {
      out[key] = (...args: unknown[]) => {
        (value as (...a: unknown[]) => void)(...args);
        (current as (...a: unknown[]) => void)(...args);
      };
    } else if (value !== undefined) out[key] = value;
  }
  return out;
}

/** `render` prop: render our behaviour and styling onto the caller's element. */
export function renderElement(
  render: ReactElement,
  props: AnyProps,
  children?: ReactNode,
): ReactElement {
  const own = (render.props ?? {}) as AnyProps;
  const merged = mergeProps(props, own);
  const content = children ?? merged['children'];
  return content === undefined
    ? cloneElement(render, merged)
    : cloneElement(render, merged, content as ReactNode);
}

/** State that can be controlled by the caller (`value` + `onChange`) or kept internally. */
export function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInternal(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [current, set];
}

export function Portal({ children }: { children: ReactNode }) {
  return typeof document === 'undefined'
    ? null
    : createPortal(children, document.body);
}

/** Calls `onDismiss` on Escape or a pointer press outside every element in `refs`. */
export function useDismiss(
  open: boolean,
  refs: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismiss();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      onDismiss();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
    // refs are stable ref objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onDismiss]);
}

export type Side =
  'top' | 'bottom' | 'left' | 'right' | 'inline-start' | 'inline-end';
export type Align = 'start' | 'center' | 'end';

export interface PositionOptions {
  side?: Side;
  align?: Align;
  sideOffset?: number;
  alignOffset?: number;
}

const MARGIN = 8;

/**
 * Places a popup next to its anchor (like Base UI's Positioner) and exposes the
 * result as CSS variables on `popupRef`'s element. Returns the side actually used
 * (it flips to the top when there is no room below).
 */
export function usePopupPosition(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popupRef: RefObject<HTMLElement | null>,
  {
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
  }: PositionOptions,
): Side {
  const [usedSide, setUsedSide] = useState<Side>(side);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current;
      const popup = popupRef.current;
      if (!anchor || !popup) return;
      const a = anchor.getBoundingClientRect();
      const w = popup.offsetWidth;
      const h = popup.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let s: Side = side;
      if (
        s === 'bottom' &&
        a.bottom + sideOffset + h > vh - MARGIN &&
        a.top - sideOffset - h > MARGIN
      )
        s = 'top';
      else if (
        s === 'top' &&
        a.top - sideOffset - h < MARGIN &&
        a.bottom + sideOffset + h < vh - MARGIN
      )
        s = 'bottom';
      let x: number;
      let y: number;
      if (
        s === 'left' ||
        s === 'right' ||
        s === 'inline-start' ||
        s === 'inline-end'
      ) {
        x =
          s === 'left' || s === 'inline-start'
            ? a.left - sideOffset - w
            : a.right + sideOffset;
        y =
          align === 'start'
            ? a.top + alignOffset
            : align === 'end'
              ? a.bottom - h - alignOffset
              : a.top + (a.height - h) / 2;
      } else {
        y = s === 'bottom' ? a.bottom + sideOffset : a.top - sideOffset - h;
        x =
          align === 'start'
            ? a.left + alignOffset
            : align === 'end'
              ? a.right - w - alignOffset
              : a.left + (a.width - w) / 2;
      }
      x = Math.max(MARGIN, Math.min(x, vw - w - MARGIN));
      const available =
        s === 'top'
          ? a.top - sideOffset - MARGIN
          : vh - a.bottom - sideOffset - MARGIN;
      const originX = Math.min(Math.max(a.left + a.width / 2 - x, 0), w);
      const style = popup.style;
      style.setProperty('--npst-popup-x', `${Math.round(x)}px`);
      style.setProperty('--npst-popup-y', `${Math.round(y)}px`);
      style.setProperty('--anchor-width', `${a.width}px`);
      style.setProperty('--available-height', `${Math.max(available, 80)}px`);
      style.setProperty(
        '--transform-origin',
        `${originX}px ${s === 'top' ? `${h}px` : '0px'}`,
      );
      setUsedSide(s);
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, popupRef, side, align, sideOffset, alignOffset]);
  return usedSide;
}

/** Keeps focus inside `ref` while open (Tab cycles), and restores it on close. */
export function useFocusTrap(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => [
      ...(ref.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ];
    const first = focusables()[0];
    (first ?? ref.current)?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem?.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, ref]);
}

/** Stops the page behind a modal from scrolling. */
export function useScrollLock(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add('npst-scroll-lock');
    return () => root.classList.remove('npst-scroll-lock');
  }, [open]);
}

/** Moves focus between `[role=menuitem|option]` elements with the arrow keys. */
export function handleListKeys(
  event: React.KeyboardEvent<HTMLElement>,
  selector: string,
): void {
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLElement>(selector),
  ].filter((el) => !el.hasAttribute('data-disabled'));
  if (items.length === 0) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  const move = (i: number) => {
    event.preventDefault();
    items[(i + items.length) % items.length]?.focus();
  };
  if (event.key === 'ArrowDown') move(index + 1);
  else if (event.key === 'ArrowUp') move(index - 1);
  else if (event.key === 'Home') move(0);
  else if (event.key === 'End') move(items.length - 1);
}
