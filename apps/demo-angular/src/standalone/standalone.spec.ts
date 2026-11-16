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

  it('starts as User 3, a non-admin user allowed to open Angular (least privilege)', async () => {
    await startStandalone(root, '', fakeMount);
    expect(DEFAULT_USER_ID).toBe('u-3');
    expect(
      mounted.map((props) => `${props.user.name} ${props.basePath}`),
    ).toEqual(['User 3 /']);
    expect(root.textContent).toContain('Standalone mode (development only).');
  });

  it('denies ?user=u-1 like the portal does', async () => {
    await startStandalone(root, '?user=u-1', fakeMount);
    expect(mounted).toEqual([]);
    expect(root.textContent).toContain(
      'User 1 (SALES) does not have permission to open People & HR.',
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
    await startStandalone(root, '?user=u-2', fakeMount);
    mounted[0]?.platform.notify.toast('Hello');
    expect(root.querySelector('[role="status"]')?.textContent).toBe('Hello');
  });
});
