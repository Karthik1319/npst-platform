/** This app's id in the portal (its permission is `access` on this id). */
export const APP_ID = 'react-a';
export const APP_NAME = 'React A';

/** Portal address used on the production page. Set `VITE_PORTAL_URL` per environment. */
export const PORTAL_URL: string =
  import.meta.env['VITE_PORTAL_URL'] ?? 'http://localhost:4200';
