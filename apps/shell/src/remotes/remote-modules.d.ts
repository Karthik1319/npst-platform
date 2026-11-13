// Types for modules that come from remotes at runtime (Module Federation).
// TypeScript cannot see them at build time, so we declare their shape here:
// every remote React app is a component that takes the host props.
declare module 'demoReactA/App' {
  import type { MfeProps } from '@npst/shared-contracts';
  import type { ComponentType } from 'react';

  const App: ComponentType<MfeProps>;
  export default App;
}
