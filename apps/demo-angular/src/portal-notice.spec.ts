import { showPortalNotice } from './portal-notice';

describe('portal notice (production build opened directly)', () => {
  it('says the app opens only inside the portal and links to it', () => {
    const root = document.createElement('div');
    showPortalNotice(root);
    expect(root.textContent).toContain(
      'Keka HR is part of the NPST Portal and opens only inside it.',
    );
    expect(root.querySelector('a')?.getAttribute('href')).toBe(
      'http://localhost:4200',
    );
  });
});
