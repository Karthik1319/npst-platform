// The bundled NPST theme (fallback): NPST tokens and the Admin Portal's design
// tokens. Loaded once here, so the login page and the portal use the same theme.
import '@npst/design-tokens/theme.css';
import '@/styles/admin-portal-fonts.css';
import '@/styles/admin-portal-base.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from '@/App';
import { Toaster } from '@/components/Toaster';
import { AuthProvider } from '@/context/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { loadRuntimeTheme } from '@/services/runtime-theme';
import { SessionProvider } from '@/session/SessionContext';

// The brand server's theme, loaded after the bundled one so its values win.
loadRuntimeTheme();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </SessionProvider>
    </QueryClientProvider>
    <Toaster />
  </StrictMode>,
);
