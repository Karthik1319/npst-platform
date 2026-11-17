import { createMockPlatform, mockUsers } from '@npst/platform-mocks';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '@/components/Toaster';
import { connectToasts, showToast, toast } from '@/lib/toast';

afterEach(() => {
  cleanup();
  connectToasts(null);
});

describe('Toaster', () => {
  it('shows toasts from the pages before sign-in (no platform yet)', () => {
    render(<Toaster />);
    act(() => toast.success('Signed out of the portal'));
    const toaster = screen.getByRole('region', { name: 'Notifications' });
    const item = within(toaster)
      .getByText('Signed out of the portal')
      .closest('li');
    expect(item?.getAttribute('data-type')).toBe('success');
  });

  it("routes the pages' toasts through the platform's Notification Service when signed in", () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const user = mockUsers[0];
    if (!user) throw new Error('mock user missing');
    const platform = createMockPlatform({ user });
    const notify = vi.spyOn(platform.notify, 'toast');
    connectToasts(platform.notify);
    const unsubscribe = platform.toasts.subscribe(showToast);
    render(<Toaster />);

    act(() => toast.error('Could not save'));

    expect(notify).toHaveBeenCalledWith('Could not save', { kind: 'error' });
    expect(screen.getByText('Could not save')).toBeDefined();
    unsubscribe();
  });
});
