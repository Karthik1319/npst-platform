// Entry when React A is opened directly at its own address (not through the
// shell). The shell never uses this file: it loads `App` via Module Federation
// (mf-manifest.json → remoteEntry.js) and passes the real host props.
import '@npst/design-tokens/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PortalNotice } from '@/PortalNotice';
import '@/page.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Element #root not found in index.html');
}
const root = createRoot(rootElement);

if (import.meta.env.DEV) {
  // Development only: run React A on its own with the mock platform.
  // `import.meta.env.DEV` is `false` in production builds, so this branch and
  // the mock users are removed from the build output.
  const { Standalone } = await import('@/standalone/Standalone');
  root.render(
    <StrictMode>
      <Standalone search={window.location.search} />
    </StrictMode>,
  );
} else {
  // Production: React A opens only inside the portal.
  root.render(
    <StrictMode>
      <PortalNotice />
    </StrictMode>,
  );
}
