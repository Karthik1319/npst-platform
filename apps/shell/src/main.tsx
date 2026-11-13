// The bundled NPST theme (fallback). Loaded once here, so the login page and
// the signed-in portal always use the same theme.
import '@npst/design-tokens/theme.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from '@/App';
import { SessionProvider } from '@/session/SessionContext';
import '@/styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <SessionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SessionProvider>
  </StrictMode>,
);
