/** An application that the portal can open. */
export interface PortalApp {
  id: string;
  name: string;
  description: string;
  /** Route in the shell where the app is shown, e.g. `/react-a`. */
  path: string;
}

/** Static list for now; Step 3 filters it by the user's roles. */
export const portalApps: readonly PortalApp[] = [
  {
    id: 'react-a',
    name: 'React A',
    description: 'Demo React micro-frontend (remote A).',
    path: '/react-a',
  },
  {
    id: 'react-b',
    name: 'React B',
    description: 'Demo React micro-frontend (remote B).',
    path: '/react-b',
  },
  {
    id: 'angular',
    name: 'Angular',
    description: 'Demo Angular micro-frontend (mount/unmount).',
    path: '/angular',
  },
];
