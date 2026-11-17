import type { CSSProperties } from 'react';
import { Bell, Search } from 'lucide-react';
import type { BrandingStyle } from '@/types';
import { SHADOW_MAP, contrastRatio } from '@/utils/branding';
import { cn } from '@/lib/utils';

interface BrandingPreviewProps {
  style: BrandingStyle;
  appName: string;
  logo?: string;
  className?: string;
}

const PREVIEW_NAV = ['Dashboard', 'Employees', 'Payroll', 'Reports', 'Settings'];
const PREVIEW_ROWS = [
  { name: 'Aarav Mehta', role: 'Super Admin', status: 'Active' },
  { name: 'Priya Nair', role: 'Admin', status: 'Active' },
  { name: 'Rohit Kulkarni', role: 'App Admin', status: 'Invited' },
];

/**
 * The critical live branding preview — a simulated mini-application driven entirely by
 * CSS variables derived from the current draft. Every token change reflects immediately.
 */
export function BrandingPreview({ style, appName, logo, className }: BrandingPreviewProps) {
  const radius = style.componentStyle === 'rounded' ? Math.max(style.radius, 14) : style.radius;
  const sidebarText = contrastRatio(style.sidebarBg, '#FFFFFF') >= 3 ? '#FFFFFF' : '#0F172A';
  const sidebarMuted =
    sidebarText === '#FFFFFF' ? 'rgba(255, 255, 255, 0.62)' : 'rgba(15, 23, 42, 0.55)';
  const buttonLabel = contrastRatio(style.button, '#FFFFFF') >= 3 ? '#FFFFFF' : '#0F172A';

  const vars = {
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
  } as CSSProperties;

  const cardStyle: CSSProperties = {
    background: 'var(--pv-card)',
    color: 'var(--pv-text)',
    borderRadius: 'var(--pv-radius)',
    border: `1px solid var(--pv-border)`,
    boxShadow: 'var(--pv-shadow)',
  };

  return (
    <div
      className={cn('branding-preview-shell overflow-hidden rounded-xl border border-[#CBD5E1] bg-white', className)}
      style={vars}
      data-testid="branding-live-preview"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#F87171]" />
        <span className="size-2.5 rounded-full bg-[#FBBF24]" />
        <span className="size-2.5 rounded-full bg-[#34D399]" />
        <span className="ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[10px] text-[#64748B] ring-1 ring-[#E2E8F0]">
          {appName.toLowerCase().replace(/\s+/g, '-')}.npst.com/dashboard
        </span>
      </div>

      <div
        style={{
          background: 'var(--pv-bg)',
          color: 'var(--pv-text)',
          fontFamily: `'${style.fontFamily}', sans-serif`,
          fontSize: style.bodySize,
          lineHeight: style.lineHeight,
        }}
      >
        {/* App header */}
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ background: 'var(--pv-header)', borderBottom: '1px solid var(--pv-border)' }}
        >
          {logo ? (
            <img src={logo} alt={`${appName} logo`} className="h-6 w-auto max-w-24 object-contain" />
          ) : (
            <span
              className="grid size-6 place-items-center text-[11px] font-bold"
              style={{ background: 'var(--pv-primary)', color: 'var(--pv-button-label)', borderRadius: 'calc(var(--pv-radius) * 0.5)' }}
            >
              {appName.slice(0, 1)}
            </span>
          )}
          <span className="font-heading font-bold" style={{ fontSize: Math.max(style.bodySize, 13), fontWeight: style.fontWeight }}>
            {appName}
          </span>
          <span className="ml-auto flex items-center gap-2" style={{ color: 'rgba(100, 116, 139, 0.9)' }}>
            <Search className="size-3.5" />
            <Bell className="size-3.5" />
            <span
              className="relative inline-flex"
            >
              <span
                className="grid size-6 place-items-center text-[10px] font-bold"
                style={{ background: 'var(--pv-accent)', color: '#FFFFFF', borderRadius: '999px' }}
              >
                AM
              </span>
              <span
                className="absolute -right-0.5 -top-0.5 size-2 rounded-full"
                style={{ background: '#EF4444', border: '1.5px solid var(--pv-header)' }}
              />
            </span>
          </span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-32 shrink-0 space-y-1 px-2.5 py-3" style={{ background: 'var(--pv-sidebar)', color: 'var(--pv-sidebar-text)' }}>
            {PREVIEW_NAV.map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-2 truncate px-2 py-1.5 text-[11px]"
                style={
                  i === 0
                    ? {
                        background: 'color-mix(in srgb, var(--pv-primary) 32%, transparent)',
                        color: 'var(--pv-sidebar-text)',
                        borderRadius: 'calc(var(--pv-radius) * 0.6)',
                        fontWeight: 600,
                      }
                    : { color: 'var(--pv-sidebar-muted)', borderRadius: 'calc(var(--pv-radius) * 0.6)' }
                }
              >
                <span className="size-1.5 rounded-full" style={{ background: 'currentColor', opacity: 0.7 }} />
                {item}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-3 p-3.5">
            <p className="font-heading font-bold leading-tight" style={{ fontSize: style.headingSize, fontWeight: style.fontWeight }}>
              Welcome back
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Employees', value: '1,248' },
                { label: 'Pending', value: '32' },
                { label: 'Active', value: '96%' },
              ].map((stat) => (
                <div key={stat.label} style={cardStyle} className="p-2.5">
                  <p className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(100, 116, 139, 0.9)' }}>
                    {stat.label}
                  </p>
                  <p className="mt-0.5 font-heading text-sm font-bold" style={{ fontWeight: style.fontWeight }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Notification indicator */}
            <div
              className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium"
              style={{
                background: `color-mix(in srgb, var(--pv-accent) 14%, var(--pv-card))`,
                color: 'var(--pv-text)',
                borderRadius: 'var(--pv-radius)',
                border: `1px solid color-mix(in srgb, var(--pv-accent) 45%, var(--pv-card))`,
              }}
            >
              <Bell className="size-3.5 shrink-0" style={{ color: 'var(--pv-accent)' }} />
              3 new notifications require your attention
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-[11px] font-semibold transition-colors"
                style={{
                  background: 'var(--pv-button)',
                  color: 'var(--pv-button-label)',
                  borderRadius: style.componentStyle === 'rounded' ? '999px' : 'calc(var(--pv-radius) * 0.7)',
                }}
              >
                Primary action
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-[11px] font-semibold"
                style={{
                  color: 'var(--pv-text)',
                  borderRadius: style.componentStyle === 'rounded' ? '999px' : 'calc(var(--pv-radius) * 0.7)',
                  border: `1px solid var(--pv-border)`,
                  background: 'var(--pv-card)',
                }}
              >
                Secondary
              </button>
            </div>

            {/* Form */}
            <div className="space-y-1.5" style={cardStyle} >
              <div className="p-2.5 pt-2.5">
                <label className="mb-1 block text-[10px] font-semibold" style={{ color: 'rgba(100, 116, 139, 0.95)' }}>
                  Employee name
                </label>
                <input
                  readOnly
                  value="e.g. Priya Sharma"
                  className="w-full bg-transparent px-2.5 py-1.5 text-[11px] outline-none"
                  style={{
                    border: `1px solid var(--pv-border)`,
                    borderRadius: style.componentStyle === 'rounded' ? '999px' : 'calc(var(--pv-radius) * 0.55)',
                    color: 'var(--pv-text)',
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden" style={cardStyle}>
              <table className="w-full text-left text-[10.5px]">
                <thead>
                  <tr style={{ color: 'rgba(100, 116, 139, 0.95)', borderBottom: '1px solid var(--pv-border)' }}>
                    <th className="px-2.5 py-1.5 font-semibold">Name</th>
                    <th className="px-2.5 py-1.5 font-semibold">Role</th>
                    <th className="px-2.5 py-1.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW_ROWS.map((row, i) => (
                    <tr
                      key={row.name}
                      style={{
                        borderBottom: i < PREVIEW_ROWS.length - 1 ? '1px solid var(--pv-border)' : 'none',
                        ...(style.tableStriped && i % 2 === 1
                          ? { background: 'color-mix(in srgb, var(--pv-primary) 5%, var(--pv-card))' }
                          : {}),
                      }}
                    >
                      <td className="px-2.5 py-1.5">{row.name}</td>
                      <td className="px-2.5 py-1.5">{row.role}</td>
                      <td className="px-2.5 py-1.5">
                        <span
                          className="inline-block rounded-full px-1.5 py-0.5 font-semibold"
                          style={{ background: `color-mix(in srgb, var(--pv-primary) 12%, var(--pv-card))`, color: 'var(--pv-primary)' }}
                        >
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
