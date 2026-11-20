import type { MfeProps } from '@npst/shared-contracts';
import { DEFAULT_USER_ID, startStandalone } from './standalone';

describe('standalone mode (development only)', () => {
  let root: HTMLElement;
  let mounted: MfeProps[];
  const fakeMount = async (_element: HTMLElement, props: MfeProps) => {
    mounted.push(props);
  };

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    root = document.createElement('div');
    document.body.append(root);
    mounted = [];
  });

  afterEach(() => {
    root.remove();
    vi.restoreAllMocks();
  });

  it('starts as Neha Kapoor, a non-admin user allowed to open PeopleOS (least privilege)', async () => {
    await startStandalone(root, '', fakeMount);
    expect(DEFAULT_USER_ID).toBe('user-7');
    expect(
      mounted.map((props) => `${props.user.name} ${props.basePath}`),
    ).toEqual(['Neha Kapoor /']);
    expect(root.textContent).toContain('Standalone mode (development only).');
  });

  it('denies ?user=user-5 like the portal does', async () => {
    await startStandalone(root, '?user=user-5', fakeMount);
    expect(mounted).toEqual([]);
    expect(root.textContent).toContain(
      'Vikram Desai (Application Admin, SALES) does not have permission to open PeopleOS.',
    );
  });

  it('rejects an unknown mock user', async () => {
    await startStandalone(root, '?user=nobody', fakeMount);
    expect(mounted).toEqual([]);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain(
      'Unknown mock user',
    );
  });

  it('shows toasts itself (no portal in standalone mode)', async () => {
    await startStandalone(root, '?user=user-3', fakeMount);
    mounted[0]?.platform.notify.toast('Hello');
    expect(root.querySelector('[role="status"]')?.textContent).toBe('Hello');
  });
});
