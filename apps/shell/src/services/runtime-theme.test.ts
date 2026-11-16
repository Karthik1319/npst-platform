import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadRuntimeTheme,
  RUNTIME_THEME_LINK_ID,
} from '@/services/runtime-theme';

const URL = 'http://brand.example/theme.css';
const runtimeLink = () =>
  document.getElementById(RUNTIME_THEME_LINK_ID) as HTMLLinkElement | null;

afterEach(() => {
  runtimeLink()?.remove();
  vi.restoreAllMocks();
});

describe('loadRuntimeTheme', () => {
  it("adds the brand server's stylesheet after the bundled styles", () => {
    const bundled = document.createElement('style');
    document.head.append(bundled);

    loadRuntimeTheme(URL);

    const link = runtimeLink();
    expect(link?.rel).toBe('stylesheet');
    expect(link?.href).toBe(URL);
    // Later in the document = wins over the bundled theme for the same variables.
    expect(document.head.lastElementChild).toBe(link);
    bundled.remove();
  });

  it('adds it only once', () => {
    loadRuntimeTheme(URL);
    loadRuntimeTheme(URL);
    expect(document.querySelectorAll(`#${RUNTIME_THEME_LINK_ID}`).length).toBe(
      1,
    );
  });

  it('falls back to the bundled theme when the brand server is down', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    loadRuntimeTheme(URL);

    runtimeLink()?.dispatchEvent(new Event('error'));

    expect(runtimeLink()).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('using the bundled theme'),
    );
  });
});
