import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PortalNotice } from '@/PortalNotice';

afterEach(cleanup);

describe('production page when opened directly', () => {
  it('points to the portal and shows no app content', () => {
    render(<PortalNotice />);
    expect(
      screen.getByText(
        'React A is part of the NPST Portal and opens only inside it.',
      ),
    ).toBeDefined();
    expect(
      screen
        .getByRole('link', { name: 'Open the NPST Portal' })
        .getAttribute('href'),
    ).toBe('http://localhost:4200');
    expect(screen.queryByRole('button')).toBeNull();
  });
});
