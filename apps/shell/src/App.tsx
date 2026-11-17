import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import { Portal } from '@/Portal';
import { RequireSession } from '@/session/RequireSession';

/** Top level: the public login page, everything else needs the central session. */
export function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
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
