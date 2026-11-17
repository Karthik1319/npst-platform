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

/** Renders Sales Hub as the portal does: at `/sales/...` with the host props. */
function renderAt(path: string, userId = 'user-2') {
  window.history.replaceState(null, '', `/sales${path === '/' ? '' : path}`);
  const user = mockAuth.findUser(userId);
  if (!user) throw new Error('mock user missing');
  const platform = createMockPlatform({ user });
  const toasts: string[] = [];
  platform.toasts.subscribe((toast) => toasts.push(toast.message));
  render(<App user={user} basePath="/sales" platform={platform} />);
  return { toasts };
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  localStorage.clear(); // the simulated backend keeps its data here
  vi.restoreAllMocks();
});

describe('Sales Hub dashboard', () => {
  it('shows the sales figures', async () => {
    renderAt('/');
    const figures = await screen.findByRole('list', { name: 'Sales figures' });
    for (const label of [
      'Total leads',
      'Qualified leads',
      'Active opportunities',
      'Proposals submitted',
      'Won deals',
      'Pipeline value',
    ]) {
      expect(within(figures).getByText(label)).toBeDefined();
    }
    expect(within(figures).getByText('124')).toBeDefined();
  });

  it('moves between its pages with the tabs and keeps the URL below the base path', async () => {
    renderAt('/');
    const tabs = screen.getByRole('navigation', { name: 'Sales Hub' });

    act(() => within(tabs).getByRole('link', { name: 'Leads' }).click());

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Leads' }),
    ).toBeDefined();
    expect(window.location.pathname).toBe('/sales/leads');
    expect(
      within(tabs)
        .getByRole('link', { name: 'Leads' })
        .getAttribute('aria-current'),
    ).toBe('page');
  });

  it('follows URL changes made by the portal (popstate)', async () => {
    renderAt('/');
    await screen.findByRole('list', { name: 'Sales figures' });

    act(() => {
      window.history.pushState(null, '', '/sales/tasks');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Tasks & follow-ups',
      }),
    ).toBeDefined();
  });
});

describe('Leads', () => {
  it('lists leads ten per page and filters by search and status', async () => {
    renderAt('/leads');
    expect(await screen.findByText('Showing 1–10 of 124')).toBeDefined();

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'New' },
    });
    expect(await screen.findByText('Showing 1–10 of 24')).toBeDefined();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search leads' }), {
      target: { value: 'no such company' },
    });
    expect(
      await screen.findByText('No leads match these filters.'),
    ).toBeDefined();
  });

  it('adds a lead and asks the portal to confirm it with a toast (MFE → shell)', async () => {
    const { toasts } = renderAt('/leads');
    act(() => screen.getByRole('button', { name: 'Add lead' }).click());
    const dialog = await screen.findByRole('dialog', { name: 'Add lead' });

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Company' }), {
      target: { value: 'Harbor Urban Co-op Bank' },
    });
    fireEvent.change(
      within(dialog).getByRole('textbox', { name: 'Contact person' }),
      { target: { value: 'Asha Rao' } },
    );
    await act(async () =>
      within(dialog).getByRole('button', { name: 'Add lead' }).click(),
    );

    expect(await screen.findByText('Harbor Urban Co-op Bank')).toBeDefined();
    expect(screen.getByText('Showing 1–10 of 125')).toBeDefined();
    expect(toasts).toEqual([
      expect.stringMatching(
        /^Lead “Harbor Urban Co-op Bank” added \(LD-\d+\)$/,
      ),
    ]);
  });
});

describe('Opportunities', () => {
  it('shows the pipeline stages and filters the table by stage', async () => {
    renderAt('/opportunities');
    const stages = await screen.findByRole('list', { name: 'Pipeline stages' });
    for (const stage of [
      'Lead',
      'Qualified',
      'Opportunity',
      'Proposal',
      'Negotiation',
      'Won',
      'Lost',
    ]) {
      expect(within(stages).getByText(stage)).toBeDefined();
    }

    act(() => within(stages).getByRole('button', { name: /^Won/ }).click());

    expect(
      await screen.findByRole('heading', { name: 'Won stage' }),
    ).toBeDefined();
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    expect(rows.length).toBe(7);
    expect(rows.every((row) => within(row).queryByText('Won') !== null)).toBe(
      true,
    );
  });

  it('shows ten opportunities per page', async () => {
    renderAt('/opportunities');
    expect(await screen.findByText('Showing 1–10 of 38')).toBeDefined();
    act(() => screen.getByRole('button', { name: 'Next page' }).click());
    expect(await screen.findByText('Showing 11–20 of 38')).toBeDefined();
  });

  it('opens the details of an opportunity', async () => {
    renderAt('/opportunities');
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search opportunities' }),
      { target: { value: 'OP-1043' } },
    );
    const link = await screen.findByRole('link', { name: 'ABC Bank' });
    act(() => link.click());

    expect(
      await screen.findByRole('heading', {
        name: 'ABC Bank – Digital Banking Platform',
      }),
    ).toBeDefined();
    expect(window.location.pathname).toBe('/sales/opportunities/OP-1043');
    for (const section of [
      'Customer',
      'Overview',
      'Requirements',
      'Assigned team',
      'Current stage',
      'Activity timeline',
      'Comments and notes',
      'Related tasks',
      'Documents and proposals',
    ]) {
      expect(screen.getByRole('region', { name: section })).toBeDefined();
    }
    expect(screen.getByText('Meera Iyer')).toBeDefined();
  });

  it('shows change history only with view:audit (Admin)', async () => {
    renderAt('/opportunities/OP-1043', 'user-7');
    await screen.findByRole('region', { name: 'Overview' });
    expect(screen.queryByRole('region', { name: 'Change history' })).toBeNull();
    cleanup();

    renderAt('/opportunities/OP-1043', 'user-1');
    const history = await screen.findByRole('region', {
      name: 'Change history',
    });
    expect(
      await within(history).findByText(
        'Stage changed from Opportunity to Proposal',
      ),
    ).toBeDefined();
  });

  it('adds a note to the opportunity', async () => {
    renderAt('/opportunities/OP-1043');
    const notes = await screen.findByRole('region', {
      name: 'Comments and notes',
    });
    fireEvent.change(within(notes).getByRole('textbox', { name: 'New note' }), {
      target: { value: 'Pricing call booked for Thursday.' },
    });
    await act(async () =>
      within(notes).getByRole('button', { name: 'Add note' }).click(),
    );

    expect(
      await within(notes).findByText('Pricing call booked for Thursday.'),
    ).toBeDefined();
  });

  it('says so when an opportunity does not exist', async () => {
    renderAt('/opportunities/OP-9999');
    expect(
      await screen.findByText('Opportunity OP-9999 was not found'),
    ).toBeDefined();
  });
});

describe('Tasks and follow-ups', () => {
  it('groups open tasks by due date and marks one done', async () => {
    const { toasts } = renderAt('/tasks');
    expect(
      await screen.findByRole('region', { name: 'Due today' }),
    ).toBeDefined();
    const overdue = screen.getByRole('region', { name: 'Overdue' });
    const before = within(overdue).getAllByRole('row').length;

    await act(async () =>
      within(overdue).getAllByRole('button', { name: 'Mark done' })[0]?.click(),
    );

    await vi.waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: 'Overdue' })).getAllByRole(
          'row',
        ).length,
      ).toBe(before - 1),
    );
    expect(toasts).toEqual([expect.stringMatching(/^Follow-up done: /)]);
  });
});

describe('Cross-application workflow (Sales Hub side)', () => {
  it('creates an opportunity and opens it', async () => {
    const { toasts } = renderAt('/opportunities');
    act(() => screen.getByRole('button', { name: 'New opportunity' }).click());
    const dialog = await screen.findByRole('dialog', {
      name: 'New opportunity',
    });
    await vi.waitFor(() =>
      expect(
        within(dialog).getByRole('option', { name: /^ABC Bank/ }),
      ).toBeDefined(),
    );

    fireEvent.change(
      within(dialog).getByRole('textbox', { name: 'Opportunity name' }),
      { target: { value: 'UPI Merchant Payments' } },
    );
    await act(async () =>
      within(dialog)
        .getByRole('button', { name: 'Create opportunity' })
        .click(),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'ABC Bank – UPI Merchant Payments',
      }),
    ).toBeDefined();
    expect(window.location.pathname).toMatch(
      /^\/sales\/opportunities\/OP-\d+$/,
    );
    expect(toasts).toEqual([
      expect.stringMatching(/^Opportunity OP-\d+ created for ABC Bank$/),
    ]);
  });

  it('hands proposal work to the Solutions team', async () => {
    const { toasts } = renderAt('/opportunities/OP-1043');
    const request = await screen.findByRole('button', {
      name: 'Request solution proposal',
    });
    act(() => request.click());
    const dialog = await screen.findByRole('dialog', {
      name: 'Request solution proposal',
    });

    await act(async () =>
      within(dialog)
        .getByRole('button', { name: 'Send to Solutions team' })
        .click(),
    );

    expect(toasts).toEqual([
      expect.stringMatching(/^Proposal task T-\d+ sent to the Solutions team$/),
    ]);
    const related = screen.getByRole('region', { name: 'Related tasks' });
    expect(
      await within(related).findByText('Prepare solution proposal – ABC Bank'),
    ).toBeDefined();
    const timeline = screen.getByRole('region', { name: 'Activity timeline' });
    expect(
      within(timeline).getByText(
        /^Solution proposal requested from the Solutions team/,
      ),
    ).toBeDefined();
  });
});
