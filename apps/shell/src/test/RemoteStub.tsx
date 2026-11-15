import type { MfeProps } from '@npst/shared-contracts';

/**
 * Unit-test stand-in for a remote app. It uses the contract both ways:
 * shows the host props it received (shell → MFE) and asks the platform for a
 * toast (MFE → shell).
 */
export default function RemoteStub({ user, basePath, platform }: MfeProps) {
  const canExport = platform.permissions.can('export', 'react-a');

  return (
    <section>
      <h1>Remote stub</h1>
      <p>
        user={user.name} basePath={basePath} platformUser={platform.user.name}
      </p>
      <p>canExport={String(canExport)}</p>
      <button
        type="button"
        onClick={() =>
          platform.notify.toast(`Hello from ${basePath}`, { kind: 'success' })
        }
      >
        Notify the portal
      </button>
    </section>
  );
}
