import type { MfeProps } from '@npst/shared-contracts';

/** Unit-test stand-in for a remote app: shows the host props it received. */
export default function RemoteStub({ user, basePath, platform }: MfeProps) {
  return (
    <section>
      <h1>Remote stub</h1>
      <p>
        user={user.name} basePath={basePath} platformUser={platform.user.name}
      </p>
    </section>
  );
}
