import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from '@/components/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

interface Props {
  appName: string;
  /** Starts a fresh load of the remote (the parent re-creates this boundary). */
  onRetry: () => void;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Keeps the shell usable when a remote cannot be loaded (after its timeout
 * and automatic retry) or crashes while rendering: only this area shows a
 * message with "Try again"; the header and navigation stay.
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
        <div role="alert">
          <EmptyState
            icon={AlertTriangle}
            title={`${this.props.appName} is not available right now.`}
            description="The rest of the portal keeps working. Try again in a moment."
            action={
              <Button variant="outline" onClick={this.props.onRetry}>
                Try again
              </Button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}
