import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  appName: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Keeps the shell usable when a remote cannot be loaded or crashes:
 * only this area shows a message, the header and navigation stay.
 * (Step 7 adds timeout and retry.)
 */
export class RemoteErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[shell] ${this.props.appName} failed to load`,
      error,
      info.componentStack,
    );
  }

  override render() {
    if (this.state.failed) {
      return (
        <p role="alert">
          {this.props.appName} is not available right now. Please try again
          later.
        </p>
      );
    }
    return this.props.children;
  }
}
