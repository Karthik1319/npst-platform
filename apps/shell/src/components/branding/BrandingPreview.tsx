import { Bell, Search } from '@/components/icons';
import type { BrandingStyle } from '@/types';
import { SHADOW_MAP, contrastRatio } from '@/utils/branding';
import { useCssVars } from '@/lib/css-vars';
import { cn } from '@/lib/utils';
import styles from './BrandingPreview.module.css';

interface BrandingPreviewProps {
  /** The branding configuration to preview (the original called this prop `style`). */
  draft: BrandingStyle;
  appName: string;
  logo?: string;
  className?: string;
}

const PREVIEW_NAV = [
  'Dashboard',
  'Employees',
  'Payroll',
  'Reports',
  'Settings',
];
const PREVIEW_ROWS = [
  { name: 'Aarav Mehta', role: 'Super Admin', status: 'Active' },
  { name: 'Priya Nair', role: 'Admin', status: 'Active' },
  { name: 'Rohit Kulkarni', role: 'App Admin', status: 'Invited' },
];

/**
 * The critical live branding preview — a simulated mini-application driven entirely by
 * CSS variables derived from the current draft. Every token change reflects immediately.
 */
export function BrandingPreview({
  draft: style,
  appName,
  logo,
  className,
}: BrandingPreviewProps) {
  const radius =
    style.componentStyle === 'rounded'
      ? Math.max(style.radius, 14)
      : style.radius;
  const sidebarText =
    contrastRatio(style.sidebarBg, '#FFFFFF') >= 3 ? '#FFFFFF' : '#0F172A';
  const sidebarMuted =
    sidebarText === '#FFFFFF'
      ? 'rgba(255, 255, 255, 0.62)'
      : 'rgba(15, 23, 42, 0.55)';
  const buttonLabel =
    contrastRatio(style.button, '#FFFFFF') >= 3 ? '#FFFFFF' : '#0F172A';

  const rounded = style.componentStyle === 'rounded';
  // The draft's values as CSS variables on the preview's root (no inline styles).
  const ref = useCssVars<HTMLDivElement>({
    '--pv-bg': style.bg,
    '--pv-card': style.cardBg,
    '--pv-header': style.headerBg,
    '--pv-sidebar': style.sidebarBg,
    '--pv-text': style.text,
    '--pv-border': style.borderColor,
    '--pv-primary': style.primary,
    '--pv-accent': style.accent,
    '--pv-button': style.button,
    '--pv-button-label': buttonLabel,
    '--pv-sidebar-text': sidebarText,
    '--pv-sidebar-muted': sidebarMuted,
    '--pv-radius': `${radius}px`,
    '--pv-shadow': SHADOW_MAP[style.shadow],
    '--pv-font-family': `'${style.fontFamily}', sans-serif`,
    '--pv-body-size': `${style.bodySize}px`,
    '--pv-line-height': style.lineHeight,
    '--pv-heading-size': `${style.headingSize}px`,
    '--pv-title-size': `${Math.max(style.bodySize, 13)}px`,
    '--pv-font-weight': style.fontWeight,
    '--pv-control-radius': rounded ? '999px' : 'calc(var(--pv-radius) * 0.7)',
    '--pv-input-radius': rounded ? '999px' : 'calc(var(--pv-radius) * 0.55)',
  });

  return (
    <div
      ref={ref}
      className={cn(`${styles.div} branding-preview-shell`, className)}
      data-testid="branding-live-preview"
    >
      {/* Browser chrome */}
      <div className={styles.div2}>
        <span className={`${styles.span} npst-sized`} />
        <span className={`${styles.span2} npst-sized`} />
        <span className={`${styles.span3} npst-sized`} />
        <span className={styles.span4}>
          {appName.toLowerCase().replace(/\s+/g, '-')}.npst.com/dashboard
        </span>
      </div>

      <div className={styles.pvApp}>
        {/* App header */}
        <div className={cn(styles.div3, styles.pvHeader)}>
          {logo ? (
            <img src={logo} alt={`${appName} logo`} className={styles.img} />
          ) : (
            <span className={`${styles.span5} ${styles.pvMark} npst-sized`}>
              {appName.slice(0, 1)}
            </span>
          )}
          <span className={cn(styles.span6, styles.pvTitle)}>{appName}</span>
          <span className={cn(styles.span7, styles.pvMuted)}>
            <Search className={`${styles.search} npst-sized`} />
            <Bell className={`${styles.search} npst-sized`} />
            <span className={styles.span8}>
              <span className={`${styles.span9} ${styles.pvAvatar} npst-sized`}>
                AM
              </span>
              <span className={`${styles.span10} ${styles.pvDot} npst-sized`} />
            </span>
          </span>
        </div>

        <div className={styles.div4}>
          {/* Sidebar */}
          <div className={cn(styles.div5, styles.pvSidebar)}>
            {PREVIEW_NAV.map((item, i) => (
              <div
                key={item}
                className={cn(
                  styles.div6,
                  i === 0 ? styles.pvNavActive : styles.pvNav,
                )}
              >
                <span
                  className={`${styles.span11} ${styles.pvNavDot} npst-sized`}
                />
                {item}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className={styles.div7}>
            <p className={cn(styles.p, styles.pvHeading)}>Welcome back</p>

            <div className={styles.div8}>
              {[
                { label: 'Employees', value: '1,248' },
                { label: 'Pending', value: '32' },
                { label: 'Active', value: '96%' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(styles.div9, styles.pvCard)}
                >
                  <p className={cn(styles.p2, styles.pvMuted)}>{stat.label}</p>
                  <p className={cn(styles.p3, styles.pvWeight)}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Notification indicator */}
            <div className={cn(styles.div10, styles.pvNotice)}>
              <Bell
                className={`${styles.bell} ${styles.pvAccent} npst-sized`}
              />
              3 new notifications require your attention
            </div>

            {/* Buttons */}
            <div className={styles.div11}>
              <button
                type="button"
                className={cn(styles.button, styles.pvPrimary)}
              >
                Primary action
              </button>
              <button
                type="button"
                className={cn(styles.button2, styles.pvSecondary)}
              >
                Secondary
              </button>
            </div>

            {/* Form */}
            <div className={cn(styles.div12, styles.pvCard)}>
              <div className={styles.div13}>
                <label className={cn(styles.label, styles.pvMutedStrong)}>
                  Employee name
                </label>
                <input
                  readOnly
                  value="e.g. Priya Sharma"
                  className={cn(styles.input, styles.pvInput)}
                />
              </div>
            </div>

            {/* Table */}
            <div className={cn(styles.div14, styles.pvCard)}>
              <table
                className={styles.table}
                data-striped={style.tableStriped || undefined}
              >
                <thead>
                  <tr className={cn(styles.pvMutedStrong, styles.pvRow)}>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Role</th>
                    <th className={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW_ROWS.map((row) => (
                    <tr key={row.name} className={styles.pvRow}>
                      <td className={styles.td}>{row.name}</td>
                      <td className={styles.td}>{row.role}</td>
                      <td className={styles.td}>
                        <span className={cn(styles.span12, styles.pvStatus)}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
