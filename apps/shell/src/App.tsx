import { Route, Routes } from 'react-router';
import { portalApps } from '@/config/apps';
import { Layout } from '@/layout/Layout';
import { AppPlaceholderPage } from '@/pages/AppPlaceholderPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {portalApps.map((app) => (
          // `/*` lets each app own the sub-routes below its path later.
          <Route
            key={app.id}
            path={`${app.path}/*`}
            element={<AppPlaceholderPage app={app} />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
