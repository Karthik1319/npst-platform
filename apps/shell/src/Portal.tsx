import { Route, Routes } from 'react-router';
import { Layout } from '@/layout/Layout';
import { AccessDeniedPage } from '@/pages/AccessDeniedPage';
import { AppPlaceholderPage } from '@/pages/AppPlaceholderPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { usePlatform } from '@/platform/PlatformContext';
import { RequireAppAccess } from '@/platform/RequireAppAccess';
import { useAsyncData } from '@/platform/useAsyncData';

/** The signed-in portal: layout, Portal Home and one guarded route per app. */
export function Portal() {
  const platform = usePlatform();
  // Every hosted app gets a route (so we can say "access denied");
  // only allowed apps get a nav link and a tile.
  const catalogue = useAsyncData(platform.apps.catalogue);
  const allowed = useAsyncData(platform.apps.allowed);
  const allApps = catalogue.status === 'ready' ? catalogue.data : [];
  const allowedApps = allowed.status === 'ready' ? allowed.data : [];

  return (
    <Routes>
      <Route element={<Layout apps={allowedApps} />}>
        <Route index element={<HomePage apps={allowed} />} />
        {allApps.map((app) => (
          // `/*` lets each app own the sub-routes below its path later.
          <Route
            key={app.id}
            path={`${app.path}/*`}
            element={
              <RequireAppAccess app={app}>
                <AppPlaceholderPage app={app} />
              </RequireAppAccess>
            }
          />
        ))}
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route
          path="*"
          element={
            catalogue.status === 'loading' ? <p>Loading…</p> : <NotFoundPage />
          }
        />
      </Route>
    </Routes>
  );
}
