import type { MfeProps, MountableMfe } from '@npst/shared-contracts';

/**
 * Unit-test stand-in for a non-React remote (mount contract).
 * `live` counts mounted instances, to catch missing or duplicate unmounts.
 */
export const mountStub: MountableMfe & { live: number } = {
  live: 0,
  async mount(element: HTMLElement, { user, basePath, platform }: MfeProps) {
    this.live += 1;
    const heading = document.createElement('h1');
    heading.textContent = 'Mount stub';
    const text = document.createElement('p');
    text.textContent = `user=${user.name} basePath=${basePath} platformUser=${platform.user.name}`;
    element.replaceChildren(heading, text);
  },
  async unmount(element: HTMLElement) {
    this.live -= 1;
    element.replaceChildren();
  },
};
