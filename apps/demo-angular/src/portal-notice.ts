import { APP_NAME, PORTAL_URL } from './config';

/** Shown when the production build is opened directly instead of through the portal. */
export function showPortalNotice(root: Element): void {
  const notice = document.createElement('main');
  notice.className = 'npst-card';
  const title = document.createElement('h1');
  title.textContent = APP_NAME;
  const text = document.createElement('p');
  text.textContent = `${APP_NAME} is part of the NPST Portal and opens only inside it.`;
  const link = document.createElement('a');
  link.href = PORTAL_URL;
  link.textContent = 'Open the NPST Portal';
  notice.append(title, text, link);
  root.replaceChildren(notice);
}
