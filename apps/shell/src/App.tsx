import { Route, Routes } from 'react-router';
import { LoginPage } from '@/pages/LoginPage';
import { Portal } from '@/Portal';
import { RequireSession } from '@/session/RequireSession';

/** Top level: the public login page, everything else needs a session. */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireSession>
            <Portal />
          </RequireSession>
        }
      />
    </Routes>
  );
}
