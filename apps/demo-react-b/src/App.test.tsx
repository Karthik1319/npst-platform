import { createMockPlatform, mockAuth } from '@npst/platform-mocks';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';

/** Renders Projects & Delivery as the portal does: at `/projects/...` with the host props. */
function renderAt(path: string, userId = 'u-2') {
  window.history.replaceState(null, '', `/projects${path === '/' ? '' : path}`);
  const user = mockAuth.findUser(userId);
  if (!user) throw new Error('mock user missing');
  const platform = createMockPlatform({ user });
  const toasts: string[] = [];
  platform.toasts.subscribe((toast) => toasts.push(toast.message));
  render(<App user={user} basePath="/projects" platform={platform} />);
  return { toasts };
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  localStorage.clear(); // the simulated backend keeps its data here
  vi.restoreAllMocks();
});

describe('Projects dashboard', () => {
  it('shows delivery figures and the projects needing attention', async () => {
    renderAt('/');
    const figures = await screen.findByRole('list', {
      name: 'Delivery figures',
    });
    for (const label of [
      'Active projects',
      'On track',
      'At risk',
      'Delayed',
      'Upcoming milestones',
      'Team utilisation',
    ]) {
      expect(within(figures).getByText(label)).toBeDefined();
    }
    const attention = screen.getByRole('region', {
      name: 'Projects needing attention',
    });
    expect(
      await within(attention).findByRole('link', {
        name: 'Digital Onboarding Platform',
      }),
    ).toBeDefined();
    expect(
      screen.getByRole('region', { name: 'Resource allocation' }),
    ).toBeDefined();
  });
});

describe('Projects list', () => {
  it('filters by status and search', async () => {
    renderAt('/list');
    expect(await screen.findByText('24 projects')).toBeDefined();

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'Delayed' },
    });
    expect(await screen.findByText('3 projects')).toBeDefined();

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search projects' }),
      { target: { value: 'PRJ-209' } },
    );
    expect(await screen.findByText('1 projects')).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'Mobile Banking App 2.0' }),
    ).toBeDefined();
  });

  it('opens a project with all its sections', async () => {
    renderAt('/list');
    const link = await screen.findByRole('link', {
      name: 'Digital Onboarding Platform',
    });
    act(() => link.click());

    expect(
      await screen.findByRole('heading', {
        name: 'Digital Onboarding Platform',
      }),
    ).toBeDefined();
    expect(window.location.pathname).toBe('/projects/PRJ-221');
    for (const section of [
      'Project overview',
      'Customer',
      'Assigned team',
      'Milestones',
      'Task progress',
      'Timeline',
      'Risks and blockers',
      'Recent updates',
    ]) {
      expect(screen.getByRole('region', { name: section })).toBeDefined();
    }
    expect(
      screen.getByText('e-KYC provider API sandbox delayed by two weeks'),
    ).toBeDefined();
    expect(screen.getByRole('img', { name: /^Timeline from / })).toBeDefined();
  });
});

describe('Task board', () => {
  it('lets the Solutions team move a task that came from Sales Hub', async () => {
    const { toasts } = renderAt('/tasks');
    const todo = await screen.findByRole('region', { name: 'To do' });
    const card = within(todo).getByRole('listitem', {
      name: 'Technical evaluation: Trident Bank fraud risk RFP',
    });
    expect(within(card).getByText(/From Sales Hub · OP-1041/)).toBeDefined();

    await act(async () =>
      fireEvent.change(within(card).getByRole('combobox'), {
        target: { value: 'In progress' },
      }),
    );

    const inProgress = screen.getByRole('region', { name: 'In progress' });
    expect(
      await within(inProgress).findByRole('listitem', {
        name: 'Technical evaluation: Trident Bank fraud risk RFP',
      }),
    ).toBeDefined();
    expect(toasts).toEqual([
      '“Technical evaluation: Trident Bank fraud risk RFP” moved to In progress',
    ]);
  });

  it('is view only for Sales (no update:project-task)', async () => {
    renderAt('/tasks', 'u-1');
    await screen.findByRole('region', { name: 'To do' });
    expect(screen.getByText('View only')).toBeDefined();
    expect(screen.queryAllByRole('combobox', { name: /^Move / })).toHaveLength(
      0,
    );
  });

  it('highlights the task opened from a notification or My Tasks', async () => {
    renderAt('/tasks?task=T-3101');
    const card = await screen.findByRole('listitem', {
      name: 'Technical evaluation: Trident Bank fraud risk RFP',
    });
    expect(card.getAttribute('aria-current')).toBe('true');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('filters the board by project', async () => {
    renderAt('/tasks?project=PRJ-221');
    const todo = await screen.findByRole('region', { name: 'To do' });
    await vi.waitFor(() =>
      expect(within(todo).queryByText(/Trident Bank/)).toBeNull(),
    );
    expect(
      (screen.getByRole('combobox', { name: 'Project' }) as HTMLSelectElement)
        .value,
    ).toBe('PRJ-221');
  });
});
