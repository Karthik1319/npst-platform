import { createMockPlatform } from '@npst/platform-mocks';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastHost } from '@/components/ToastHost';
import { PlatformProvider } from '@/platform/PlatformContext';

afterEach(cleanup);

describe('ToastHost', () => {
  it('shows a toast sent through platform.notify.toast()', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const platform = createMockPlatform();
    render(
      <PlatformProvider platform={platform}>
        <ToastHost />
      </PlatformProvider>,
    );

    act(() => platform.notify.toast('Saved', { kind: 'success' }));

    expect(await screen.findByText('Saved')).toBeDefined();
  });
});
